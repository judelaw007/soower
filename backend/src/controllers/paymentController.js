const crypto = require('crypto');
const prisma = require('../config/database');
const paystackService = require('../services/paystackService');
const notificationService = require('../services/notificationService');
const { calculateNextPaymentDate } = require('../utils/helpers');

// Verify payment callback
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
      });
    }

    // Verify with Paystack
    const verifyResult = await paystackService.verifyTransaction(reference);

    if (!verifyResult.status || verifyResult.data.status !== 'success') {
      // Update payment status to failed
      await prisma.payment.updateMany({
        where: { paystackReference: reference },
        data: { status: 'FAILED' },
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const paymentData = verifyResult.data;

    // Update payment record
    const payment = await prisma.payment.update({
      where: { paystackReference: reference },
      data: {
        status: 'SUCCESS',
        paystackTransactionId: paymentData.id?.toString(),
        paidAt: new Date(paymentData.paid_at),
        metadata: paymentData,
      },
    });

    // Update subscription with Paystack details if applicable
    if (payment.subscriptionId) {
      const updateData = {
        lastPaymentDate: new Date(),
      };

      // Store authorization for future charges
      if (paymentData.authorization) {
        updateData.paystackCustomerCode = paymentData.customer?.customer_code;
      }

      // If Paystack subscription was created
      if (paymentData.plan && paymentData.subscription_code) {
        updateData.paystackSubscriptionCode = paymentData.subscription_code;
        updateData.paystackEmailToken = paymentData.email_token;
      }

      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: updateData,
      });
    }

    // Update project's current amount
    await prisma.project.update({
      where: { id: payment.projectId },
      data: {
        currentAmount: {
          increment: payment.amount,
        },
      },
    });

    // Send success notification
    notificationService.sendPaymentSuccess(payment).catch(console.error);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { payment },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

// Paystack webhook handler
const webhook = async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;
    console.log('Paystack webhook event:', event);

    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(data);
        break;
      case 'subscription.create':
        await handleSubscriptionCreate(data);
        break;
      case 'subscription.disable':
        await handleSubscriptionDisable(data);
        break;
      case 'invoice.create':
        await handleInvoiceCreate(data);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Handle successful charge
const handleChargeSuccess = async (data) => {
  const { reference, amount, customer, metadata, paid_at, authorization } = data;

  // Check if payment already exists
  let payment = await prisma.payment.findUnique({
    where: { paystackReference: reference },
  });

  if (payment) {
    // Update existing payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        paidAt: new Date(paid_at),
        metadata: data,
      },
    });
  } else if (metadata?.subscriptionId) {
    // Create new payment for recurring charge
    const subscription = await prisma.subscription.findUnique({
      where: { id: metadata.subscriptionId },
    });

    if (subscription) {
      payment = await prisma.payment.create({
        data: {
          userId: subscription.userId,
          projectId: subscription.projectId,
          subscriptionId: subscription.id,
          amount: amount / 100, // Convert from kobo
          status: 'SUCCESS',
          paystackReference: reference,
          paidAt: new Date(paid_at),
          metadata: data,
        },
      });

      // Update subscription next payment date
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          lastPaymentDate: new Date(),
          nextPaymentDate: calculateNextPaymentDate(
            subscription.interval,
            subscription.customIntervalDays
          ),
        },
      });

      // Update project amount
      await prisma.project.update({
        where: { id: subscription.projectId },
        data: {
          currentAmount: { increment: amount / 100 },
        },
      });

      // Send notification
      notificationService.sendPaymentSuccess(payment).catch(console.error);
    }
  }
};

// Handle subscription creation
const handleSubscriptionCreate = async (data) => {
  const { subscription_code, email_token, customer, plan } = data;

  // Find subscription by plan code and customer
  const subscription = await prisma.subscription.findFirst({
    where: {
      paystackPlanCode: plan.plan_code,
      user: { email: customer.email },
      status: 'ACTIVE',
    },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        paystackSubscriptionCode: subscription_code,
        paystackEmailToken: email_token,
        paystackCustomerCode: customer.customer_code,
      },
    });
  }
};

// Handle subscription disable
const handleSubscriptionDisable = async (data) => {
  const { subscription_code } = data;

  await prisma.subscription.updateMany({
    where: { paystackSubscriptionCode: subscription_code },
    data: { status: 'CANCELLED' },
  });
};

// Handle invoice creation (reminder)
const handleInvoiceCreate = async (data) => {
  const { subscription, customer } = data;

  const sub = await prisma.subscription.findFirst({
    where: { paystackSubscriptionCode: subscription.subscription_code },
    include: { user: true },
  });

  if (sub) {
    notificationService.sendPaymentReminder(sub).catch(console.error);
  }
};

// Handle failed invoice payment
const handleInvoicePaymentFailed = async (data) => {
  const { subscription } = data;

  const sub = await prisma.subscription.findFirst({
    where: { paystackSubscriptionCode: subscription.subscription_code },
  });

  if (sub) {
    // Create failed payment record
    const payment = await prisma.payment.create({
      data: {
        userId: sub.userId,
        projectId: sub.projectId,
        subscriptionId: sub.id,
        amount: sub.amount,
        status: 'FAILED',
        metadata: data,
      },
    });

    notificationService.sendPaymentFailed(payment).catch(console.error);
  }
};

// Get user's payment history
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message,
    });
  }
};

// Admin: Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { status, projectId, userId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message,
    });
  }
};

module.exports = {
  verifyPayment,
  webhook,
  getUserPayments,
  getAllPayments,
};
