const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Soower <noreply@soower.com>',
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const templates = {
  welcome: (user) => ({
    subject: 'Welcome to Soower!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Soower!</h1>
        <p>Hi ${user.firstName},</p>
        <p>Thank you for joining Soower! We're excited to have you on board.</p>
        <p>With Soower, you can easily manage your recurring donations and support projects you care about.</p>
        <p>Best regards,<br>The Soower Team</p>
      </div>
    `,
    text: `Welcome to Soower! Hi ${user.firstName}, Thank you for joining Soower!`,
  }),

  paymentReminder: (user, subscription, project) => ({
    subject: `Payment Reminder: ${project.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Payment Reminder</h1>
        <p>Hi ${user.firstName},</p>
        <p>This is a friendly reminder that your recurring donation is due soon.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Project:</strong> ${project.name}</p>
          <p><strong>Amount:</strong> ₦${subscription.amount}</p>
          <p><strong>Next Payment:</strong> ${new Date(subscription.nextPaymentDate).toLocaleDateString()}</p>
        </div>
        <p>Thank you for your continued support!</p>
        <p>Best regards,<br>The Soower Team</p>
      </div>
    `,
    text: `Payment Reminder for ${project.name}. Amount: ₦${subscription.amount}. Due: ${new Date(subscription.nextPaymentDate).toLocaleDateString()}`,
  }),

  paymentSuccess: (user, payment, project) => ({
    subject: `Payment Successful: ${project.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Payment Successful!</h1>
        <p>Hi ${user.firstName},</p>
        <p>Your donation has been processed successfully.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Project:</strong> ${project.name}</p>
          <p><strong>Amount:</strong> ₦${payment.amount}</p>
          <p><strong>Reference:</strong> ${payment.paystackReference}</p>
          <p><strong>Date:</strong> ${new Date(payment.paidAt).toLocaleDateString()}</p>
        </div>
        <p>Thank you for your generous donation!</p>
        <p>Best regards,<br>The Soower Team</p>
      </div>
    `,
    text: `Payment Successful for ${project.name}. Amount: ₦${payment.amount}. Reference: ${payment.paystackReference}`,
  }),

  paymentFailed: (user, payment, project) => ({
    subject: `Payment Failed: ${project.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EF4444;">Payment Failed</h1>
        <p>Hi ${user.firstName},</p>
        <p>Unfortunately, we were unable to process your donation.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Project:</strong> ${project.name}</p>
          <p><strong>Amount:</strong> ₦${payment.amount}</p>
        </div>
        <p>Please update your payment method and try again.</p>
        <p>Best regards,<br>The Soower Team</p>
      </div>
    `,
    text: `Payment Failed for ${project.name}. Please update your payment method.`,
  }),
};

// Send templated email
const sendTemplatedEmail = async (templateName, to, data) => {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const { subject, html, text } = template(...data);
  return sendEmail({ to, subject, html, text });
};

module.exports = {
  sendEmail,
  sendTemplatedEmail,
  templates,
};
