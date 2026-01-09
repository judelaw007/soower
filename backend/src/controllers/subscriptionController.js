const prisma = require('../config/database');
const paystackService = require('../services/paystackService');
const { calculateNextPaymentDate, generateReference } = require('../utils/helpers');

// Create subscription
const createSubscription = async (req, res) => {
  try {
    const { projectId, amount, interval, customIntervalDays } = req.body;
    const userId = req.user.id;

    // Verify project exists and is active
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || !project.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or inactive',
      });
    }

    // Check for existing active subscription to same project
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        projectId,
        status: 'ACTIVE',
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription to this project',
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Create Paystack plan for non-custom intervals
    let planCode = null;
    if (interval !== 'CUSTOM') {
      const planName = `${project.name} - ${interval} - ₦${amount}`;
      const planResult = await paystackService.createPlan(planName, amount, interval);
      if (planResult.status) {
        planCode = planResult.data.plan_code;
      }
    }

    // Initialize transaction with Paystack
    const callbackUrl = `${process.env.FRONTEND_URL}/payment/callback`;
    const metadata = {
      userId,
      projectId,
      subscriptionType: 'recurring',
      interval,
      customIntervalDays: interval === 'CUSTOM' ? customIntervalDays : null,
    };

    const transactionResult = await paystackService.initializeTransaction({
      email: user.email,
      amount,
      metadata,
      callback_url: callbackUrl,
      plan: planCode,
    });

    if (!transactionResult.status) {
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize payment',
      });
    }

    // Create pending subscription in database
    const nextPaymentDate = calculateNextPaymentDate(interval, customIntervalDays);
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        projectId,
        amount,
        interval,
        customIntervalDays: interval === 'CUSTOM' ? customIntervalDays : null,
        status: 'ACTIVE',
        paystackPlanCode: planCode,
        nextPaymentDate,
      },
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId,
        projectId,
        subscriptionId: subscription.id,
        amount,
        status: 'PENDING',
        paystackReference: transactionResult.data.reference,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Subscription initiated',
      data: {
        subscription,
        paymentUrl: transactionResult.data.authorization_url,
        reference: transactionResult.data.reference,
      },
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message,
    });
  }
};

// Get user's subscriptions
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          project: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
      error: error.message,
    });
  }
};

// Get single subscription
const getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
      include: {
        project: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    res.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription',
      error: error.message,
    });
  }
};

// Update subscription (amount or interval)
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, interval, customIntervalDays } = req.body;
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Can only update active subscriptions',
      });
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        amount: amount || subscription.amount,
        interval: interval || subscription.interval,
        customIntervalDays: interval === 'CUSTOM' ? customIntervalDays : subscription.customIntervalDays,
        nextPaymentDate: calculateNextPaymentDate(
          interval || subscription.interval,
          interval === 'CUSTOM' ? customIntervalDays : subscription.customIntervalDays
        ),
      },
    });

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription: updatedSubscription },
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message,
    });
  }
};

// Pause subscription
const pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active',
      });
    }

    // Disable Paystack subscription if exists
    if (subscription.paystackSubscriptionCode && subscription.paystackEmailToken) {
      await paystackService.disableSubscription(
        subscription.paystackSubscriptionCode,
        subscription.paystackEmailToken
      );
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: { subscription: updatedSubscription },
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause subscription',
      error: error.message,
    });
  }
};

// Resume subscription
const resumeSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status !== 'PAUSED') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not paused',
      });
    }

    // Enable Paystack subscription if exists
    if (subscription.paystackSubscriptionCode && subscription.paystackEmailToken) {
      await paystackService.enableSubscription(
        subscription.paystackSubscriptionCode,
        subscription.paystackEmailToken
      );
    }

    const nextPaymentDate = calculateNextPaymentDate(
      subscription.interval,
      subscription.customIntervalDays
    );

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        nextPaymentDate,
      },
    });

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: { subscription: updatedSubscription },
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume subscription',
      error: error.message,
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled',
      });
    }

    // Disable Paystack subscription if exists
    if (subscription.paystackSubscriptionCode && subscription.paystackEmailToken) {
      await paystackService.disableSubscription(
        subscription.paystackSubscriptionCode,
        subscription.paystackEmailToken
      );
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription: updatedSubscription },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message,
    });
  }
};

// Admin: Get all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, projectId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
      error: error.message,
    });
  }
};

module.exports = {
  createSubscription,
  getUserSubscriptions,
  getSubscription,
  updateSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  getAllSubscriptions,
};
