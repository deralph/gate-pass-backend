// backend/utils/emailService.js
import nodemailer from 'nodemailer';
// Create transporter


// Send email function
export const sendEmail = async (emailOptions) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  try {
    
    const mailOptions = {
      from: `"AAUA Parking System" <${process.env.MAIL_USER}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.html,
    };
    
    if (emailOptions.text) {
      mailOptions.text = emailOptions.text;
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Specific email templates
export const emailTemplates = {
  passwordReset: (resetUrl, user) => {
    return {
      subject: 'Password Reset Request - AAUA Parking System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .button { 
              display: inline-block; 
              background-color: #2563eb; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #6b7280; 
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AAUA Parking System</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${user.fullName},</p>
              <p>You have requested to reset your password for the AAUA Parking System.</p>
              <p>Please click the button below to reset your password:</p>
              <p>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AAUA Parking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },
  
  accessDenied: (user, plateNumber, reason, timestamp) => {
    return {
      subject: 'Access Denied - AAUA Parking System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #6b7280; 
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AAUA Parking System</h1>
            </div>
            <div class="content">
              <h2>Access Denied Notification</h2>
              <p>Hello ${user.fullName},</p>
              
              <div class="alert">
                <h3>🚫 Access Denied</h3>
                <p>Your vehicle <strong>${plateNumber}</strong> was denied access at the gate.</p>
              </div>
              
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
              <p><strong>Location:</strong> AAUA Main Gate</p>
              
              <p>If this was you and you believe this was a mistake, please contact the security department.</p>
              <p>If this wasn't you, please secure your account and contact security immediately.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AAUA Parking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },
  
  vehicleUsage: (user, plateNumber, scanType, timestamp) => {
    return {
      subject: 'Vehicle Usage Alert - AAUA Parking System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .info { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 12px; }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #6b7280; 
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AAUA Parking System</h1>
            </div>
            <div class="content">
              <h2>Vehicle Usage Notification</h2>
              <p>Hello ${user.fullName},</p>
              
              <div class="info">
                <h3>🚗 Vehicle Access ${scanType === 'in' ? 'Granted' : 'Exited'}</h3>
                <p>Your vehicle <strong>${plateNumber}</strong> was ${scanType === 'in' ? 'granted entry' : 'exited'} at the gate.</p>
              </div>
              
              <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
              <p><strong>Location:</strong> AAUA Main Gate</p>
              
              <p>If this was you, thank you for using the AAUA Parking System.</p>
              <p>If this wasn't you, please contact security immediately.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AAUA Parking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },
  
  adminCreated: (adminUser, createdBy) => {
    return {
      subject: 'Admin Account Created - AAUA Parking System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .info { background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 12px; }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #6b7280; 
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AAUA Parking System</h1>
            </div>
            <div class="content">
              <h2>Admin Account Created</h2>
              <p>Hello ${adminUser.fullName},</p>
              
              <div class="info">
                <h3>👨‍💼 Admin Account Activated</h3>
                <p>An admin account has been created for you in the AAUA Parking System.</p>
              </div>
              
              <p><strong>Account Details:</strong></p>
              <ul>
                <li><strong>Name:</strong> ${adminUser.fullName}</li>
                <li><strong>Email:</strong> ${adminUser.email}</li>
                <li><strong>Admin ID:</strong> ${adminUser.studentStaffId}</li>
                <li><strong>Created By:</strong> ${createdBy.fullName} (${createdBy.email})</li>
                <li><strong>Created At:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              
              <p>You can now access the admin dashboard with your credentials.</p>
              <p>If you didn't expect this email, please contact the system administrator immediately.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AAUA Parking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
};