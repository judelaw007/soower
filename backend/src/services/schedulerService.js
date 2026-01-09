const cron = require('node-cron');
const prisma = require('../config/database');
const notificationService = require('./notificationService');

// Send payment reminders for subscriptions due in 3 days
const sendPaymentReminders = async () => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextPaymentDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
      },
      include: {
        user: true,
        project: true,
      },
    });

    console.log(`Found ${subscriptions.length} subscriptions due for reminder`);

    for (const subscription of subscriptions) {
      await notificationService.sendPaymentReminder(subscription);
    }

    console.log('Payment reminders sent successfully');
  } catch (error) {
    console.error('Error sending payment reminders:', error);
  }
};

// Check for expired subscriptions
const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    // Find subscriptions that are past due by more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        nextPaymentDate: {
          lt: sevenDaysAgo,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    console.log(`Marked ${expiredSubscriptions.count} subscriptions as expired`);
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
  }
};

// Initialize scheduled jobs
const initScheduler = () => {
  // Send payment reminders daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    console.log('Running payment reminder job...');
    sendPaymentReminders();
  });

  // Check for expired subscriptions daily at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('Running expired subscription check...');
    checkExpiredSubscriptions();
  });

  console.log('Scheduler initialized');
};

module.exports = {
  initScheduler,
  sendPaymentReminders,
  checkExpiredSubscriptions,
};
