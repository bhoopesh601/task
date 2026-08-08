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
 * Supports Hostinger Webmail by default, and can be seamlessly switched to Gmail or any standard SMTP server via .env.
 * 
 * Hostinger Webmail defaults:
 * Host: smtp.hostinger.com
 * Port: 465 (SSL) or 587 (TLS)
 * 
 * Gmail upgrade instructions:
 * Set SMTP_HOST="smtp.gmail.com", SMTP_PORT=465, SMTP_SECURE=true
 * Set SMTP_USER="your.email@gmail.com", SMTP_PASS="your_16_digit_app_password"
 */
export const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
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
 * Sends an OTP email to the specified recipient.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} [options.subject] - Custom subject line
 * @param {string} [options.appName] - Application name (defaults to 'TaskFlow')
 */
export const sendOtpEmail = async ({ to, otp, subject = 'Your Verification Code', appName = 'TaskFlow' }) => {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || `noreply@taskflow.com`;

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
        <div class="logo">TaskFlow</div>
        <div class="title">Verification Code</div>
        <div class="text">Use the verification code below to complete your authentication with <strong>${appName}</strong>. This code will expire in 10 minutes.</div>
        <div class="otp-box">${otp}</div>
        <div class="text">If you did not request this code, please ignore this email.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: `${subject} - ${otp}`,
    html: htmlContent,
    text: `Your ${appName} verification code is: ${otp}. It will expire in 10 minutes.`,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

/**
 * Verifies SMTP connection configuration.
 */
export const verifySmtpConnection = async () => {
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
  sendOtpEmail,
  verifySmtpConnection,
};
