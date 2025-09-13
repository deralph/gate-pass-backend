// backend/test-email.js

import dotenv from 'dotenv';
import  { sendEmail, emailTemplates } from './utils/emailService.js';

dotenv.config()

const testEmail = async () => {
  console.log('Testing email service...');
  
  // Test password reset email
  const result = await sendEmail({
    to: 'jraphael441@gmail.com',
    subject: 'Test Email',
    html: '<h1>Test Email</h1><p>This is a test email from the AAUA Parking System.</p>'
  });
  
  console.log('Email test result:', result);
};

testEmail();