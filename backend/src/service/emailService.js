import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Create email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error);
  } else {
    console.log("✅ Email service ready:", success);
  }
});

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @param {string} password - User's password (to send in email)
 * @returns {Promise<object>} - Email send result
 */
export const sendPasswordResetEmail = async (email, username, password) => {
  try {
    if (!process.env.USER_EMAIL || !process.env.USER_PASS) {
      throw new Error("Email service credentials not configured");
    }

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
            .credential-item { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .value { font-size: 16px; font-family: monospace; background-color: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 5px; }
            .footer { text-align: center; font-size: 12px; color: #666; padding: 20px; border-top: 1px solid #ddd; }
            .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${username}</strong>,</p>
              <p>We received a password reset request for your TownX account. Here are your login credentials:</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <div class="label">Username:</div>
                  <div class="value">${username}</div>
                </div>
                <div class="credential-item">
                  <div class="label">Password:</div>
                  <div class="value">${password}</div>
                </div>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong> 
                <p>We recommend changing your password immediately after logging in. Never share your password with anyone.</p>
              </div>

              <p><strong>How to login:</strong></p>
              <ol>
                <li>Go to the TownX login page</li>
                <li>Enter your username: <code>${username}</code></li>
                <li>Enter your password from above</li>
                <li>Change your password to something more secure</li>
              </ol>

              <p style="margin-top: 30px;">
                <a href="http://localhost:5173" class="button">Go to TownX</a>
              </p>
            </div>
            <div class="footer">
              <p>If you didn't request this, please ignore this email or contact support immediately.</p>
              <p>&copy; 2025 TownX - All rights reserved</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const plainTextTemplate = `
Password Reset Request

Hello ${username},

We received a password reset request for your TownX account. Here are your login credentials:

Username: ${username}
Password: ${password}

⚠️ SECURITY NOTICE: We recommend changing your password immediately after logging in. Never share your password with anyone.

How to login:
1. Go to the TownX login page
2. Enter your username: ${username}
3. Enter your password from above
4. Change your password to something more secure

If you didn't request this, please ignore this email or contact support immediately.

© 2025 TownX - All rights reserved
    `;

    const info = await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: email,
      subject: "🔐 Your TownX Account Password Reset",
      text: plainTextTemplate,
      html: htmlTemplate,
    });

    console.log("✅ Password reset email sent to:", email, "| MessageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    throw error;
  }
};

/**
 * Send welcome email to new user
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @returns {Promise<object>} - Email send result
 */
export const sendWelcomeEmail = async (email, username) => {
  try {
    if (!process.env.USER_EMAIL || !process.env.USER_PASS) {
      throw new Error("Email service credentials not configured");
    }

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
            .footer { text-align: center; font-size: 12px; color: #666; padding: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to TownX!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${username}</strong>,</p>
              <p>Welcome to TownX! We're excited to have you on board. Discover amazing places, share reviews, and explore your city like never before.</p>
              
              <h3>What you can do:</h3>
              <ul>
                <li>🔍 Search for restaurants, cafes, hospitals, and more</li>
                <li>⭐ Add reviews and ratings to places</li>
                <li>💾 Save your favorite places</li>
                <li>🗺️ Get directions and route information</li>
                <li>📧 Share locations with friends via email</li>
              </ul>

              <p style="margin-top: 30px;">
                <a href="http://localhost:5173" class="button">Start Exploring</a>
              </p>
            </div>
            <div class="footer">
              <p>If you have any questions, please contact our support team.</p>
              <p>&copy; 2025 TownX - All rights reserved</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const plainTextTemplate = `
Welcome to TownX!

Hello ${username},

Welcome to TownX! We're excited to have you on board. Discover amazing places, share reviews, and explore your city like never before.

What you can do:
- Search for restaurants, cafes, hospitals, and more
- Add reviews and ratings to places
- Save your favorite places
- Get directions and route information
- Share locations with friends via email

Start exploring now!

If you have any questions, please contact our support team.

© 2025 TownX - All rights reserved
    `;

    const info = await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: email,
      subject: "🎉 Welcome to TownX!",
      text: plainTextTemplate,
      html: htmlTemplate,
    });

    console.log("✅ Welcome email sent to:", email, "| MessageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending welcome email:", error.message);
    throw error;
  }
};

export default { sendPasswordResetEmail, sendWelcomeEmail };
