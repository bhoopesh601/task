import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
dotenv.config({ override: true });

/**
 * Creates and returns a Nodemailer SMTP transporter.
 * Supports Hostinger Webmail, Gmail, Brevo, and custom SMTP servers.
 */
export const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const service = process.env.SMTP_SERVICE || undefined;

  const auth = user && pass ? { user, pass } : undefined;

  const transportOptions = service
    ? {
        service,
        ...(auth && { auth }),
      }
    : {
        host,
        port,
        secure,
        ...(auth && { auth }),
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
        },
      };

  return nodemailer.createTransport(transportOptions);
};

/**
 * Sends a generic email to the specified recipient using Brevo HTTP API or Nodemailer SMTP.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Subject line
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} [options.appName] - Application name
 */
export const sendMail = async ({ to, subject, html, text, appName = 'Todo Application' }) => {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || `noreply@taskflow.com`;
  const pass = process.env.SMTP_PASS || '';

  // Brevo Direct API Mode (if key starts with xkeysib-)
  if (pass.startsWith('xkeysib-')) {
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': pass,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: appName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await brevoResponse.json();
    if (!brevoResponse.ok) {
      throw new Error(data.message || `Brevo API error: ${JSON.stringify(data)}`);
    }
    return data;
  }

  // Standard Nodemailer SMTP Mode (Hostinger, Gmail App Password, etc.)
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

/**
 * Sends an OTP email to the specified recipient (Forgot Password / Verification).
 * Preserves existing template and flow.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} [options.subject] - Custom subject line
 * @param {string} [options.appName] - Application name (defaults to 'TaskFlow')
 */
export const sendOtpEmail = async ({ to, otp, subject = 'Your Verification Code', appName = 'TaskFlow' }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .logo { font-size: 24px; font-weight: bold; color: #E44332; margin-bottom: 24px; text-align: center; }
        .title { font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #111827; }
        .text { font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background-color: #f3f4f6; border: 2px dashed #E44332; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #E44332; text-align: center; padding: 16px; margin: 24px 0; }
        .footer { font-size: 13px; color: #9ca3af; text-align: center; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">${appName}</div>
        <div class="title">Verification Code</div>
        <div class="text">Use the verification code below to complete your authentication with <strong>${appName}</strong>. This code will expire in 10 minutes.</div>
        <div class="otp-box">${otp}</div>
        <div class="text">If you did not request this code, please ignore this email.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Your ${appName} verification code is: ${otp}. It will expire in 10 minutes.`;

  return await sendMail({
    to,
    subject: `${subject} - ${otp}`,
    html: htmlContent,
    text: textContent,
    appName,
  });
};

/**
 * Sends a Login Notification email upon successful login.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.userName] - Recipient user name
 * @param {string} [options.appName] - Application name
 */
export const sendLoginNotificationEmail = async ({ to, userName = 'User', appName = 'Todo Application' }) => {
  const subject = 'Login Notification';
  const textContent = `Hello ${userName},\n\nA successful login was detected on your Todo account.\n\nIf this was not you, please secure your account.\n\nRegards,\n${appName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .logo { font-size: 24px; font-weight: bold; color: #E44332; margin-bottom: 24px; text-align: center; }
        .title { font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #111827; }
        .text { font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 20px; }
        .footer { font-size: 13px; color: #9ca3af; text-align: center; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">${appName}</div>
        <div class="title">Login Notification</div>
        <div class="text">Hello ${userName},</div>
        <div class="text">A successful login was detected on your Todo account.</div>
        <div class="text">If this was not you, please secure your account.</div>
        <div class="text">Regards,<br><strong>${appName}</strong></div>
        <div class="footer">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  return await sendMail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
    appName,
  });
};

/**
 * Sends a Welcome / Registration Confirmation email upon successful sign up.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.userName] - Recipient user name
 * @param {string} [options.appName] - Application name
 */
export const sendWelcomeEmail = async ({ to, userName = 'User', appName = 'Todo Application' }) => {
  const subject = 'Welcome to Todo Application';
  const textContent = `Hello ${userName},\n\nYour Todo account has been successfully created.\n\nYou can now log in and start managing your tasks.\n\nRegards,\n${appName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .logo { font-size: 24px; font-weight: bold; color: #E44332; margin-bottom: 24px; text-align: center; }
        .title { font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #111827; }
        .text { font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 20px; }
        .footer { font-size: 13px; color: #9ca3af; text-align: center; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">${appName}</div>
        <div class="title">Welcome to Todo Application</div>
        <div class="text">Hello ${userName},</div>
        <div class="text">Your Todo account has been successfully created.</div>
        <div class="text">You can now log in and start managing your tasks.</div>
        <div class="text">Regards,<br><strong>${appName}</strong></div>
        <div class="footer">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  return await sendMail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
    appName,
  });
};

/**
 * Verifies email connection configuration (Brevo API key or SMTP transporter).
 */
export const verifySmtpConnection = async () => {
  const pass = process.env.SMTP_PASS || '';

  // If using Brevo API Key
  if (pass.startsWith('xkeysib-')) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': pass },
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: `Brevo API connection established successfully for ${data.email || 'account'}` };
      }
      return { success: false, error: data.message || 'Invalid Brevo API key' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Standard SMTP Verify
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection established successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  createTransporter,
  sendMail,
  sendOtpEmail,
  sendLoginNotificationEmail,
  sendWelcomeEmail,
  verifySmtpConnection,
};
