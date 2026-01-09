const prisma = require('../config/database');
const { sendTemplatedEmail } = require('./emailService');

// Create notification
const createNotification = async ({ userId, title, message, type, metadata }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata,
      },
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Get user notifications
const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
  const skip = (page - 1) * limit;

  const where = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

// Get unread count
const getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

// Send payment reminder notification
const sendPaymentReminder = async (subscription) => {
  const user = await prisma.user.findUnique({ where: { id: subscription.userId } });
  const project = await prisma.project.findUnique({ where: { id: subscription.projectId } });

  if (!user || !project) return;

  // Create in-app notification
  await createNotification({
    userId: user.id,
    title: 'Payment Reminder',
    message: `Your donation of ₦${subscription.amount} for ${project.name} is due on ${new Date(subscription.nextPaymentDate).toLocaleDateString()}`,
    type: 'payment_reminder',
    metadata: {
      subscriptionId: subscription.id,
      projectId: project.id,
      amount: subscription.amount,
    },
  });

  // Send email notification
  await sendTemplatedEmail('paymentReminder', user.email, [user, subscription, project]);
};

// Send payment success notification
const sendPaymentSuccess = async (payment) => {
  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  const project = await prisma.project.findUnique({ where: { id: payment.projectId } });

  if (!user || !project) return;

  // Create in-app notification
  await createNotification({
    userId: user.id,
    title: 'Payment Successful',
    message: `Your donation of ₦${payment.amount} for ${project.name} was successful!`,
    type: 'payment_success',
    metadata: {
      paymentId: payment.id,
      projectId: project.id,
      amount: payment.amount,
    },
  });

  // Send email notification
  await sendTemplatedEmail('paymentSuccess', user.email, [user, payment, project]);
};

// Send payment failed notification
const sendPaymentFailed = async (payment) => {
  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  const project = await prisma.project.findUnique({ where: { id: payment.projectId } });

  if (!user || !project) return;

  // Create in-app notification
  await createNotification({
    userId: user.id,
    title: 'Payment Failed',
    message: `Your donation of ₦${payment.amount} for ${project.name} failed. Please update your payment method.`,
    type: 'payment_failed',
    metadata: {
      paymentId: payment.id,
      projectId: project.id,
      amount: payment.amount,
    },
  });

  // Send email notification
  await sendTemplatedEmail('paymentFailed', user.email, [user, payment, project]);
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendPaymentReminder,
  sendPaymentSuccess,
  sendPaymentFailed,
};
