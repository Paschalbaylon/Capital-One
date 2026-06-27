// import { Injectable, Logger } from '@nestjs/common';
// import { Resend } from 'resend';

// @Injectable()
// export class MailService {
//   private readonly resend: Resend;
//   private readonly logger = new Logger(MailService.name);

//   constructor() {
//     this.resend = new Resend(process.env.RESEND_API_KEY);
//   }

//   // Use Resend's test sender for now
//   private getFromAddress(): string {
//     return 'Capital Bank <robertnewtt3@gmail.com>';
//   }

//   private handleError(error: unknown, context: string): void {
//     if (error instanceof Error) {
//       this.logger.error(`${context}: ${error.message}`);
//     } else {
//       this.logger.error(`${context}: Unknown error occurred`);
//     }
//   }

//   async sendWelcomeEmail(email: string, username: string) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: 'Capital-One Bank',
//         html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//         <div style="text-align: center; margin-bottom: 20px;">
//           <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//           <p style="color: #7f8c8d; margin-top: 0;">Account-Signup Notification</p>
//         </div>

//         <p>Hello<strong>Welcome, ${username}! </strong>,</p>

//         <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">

//         <div>
//         <p style="margin: 0px 0; font-size: 14px;">
//             <strong style="font-size: 18px;">Your account was created successfully.</strong>
//           </p>
//         <p style="margin: 0px 0; font-size: 14px;">
//             <strong style="font-size: 18px;">Thank you for choosing Capital-One Bank.</strong>
//           </p>
//         <p style="margin: 0px 0; font-size: 14px;">
//             <strong style="font-size: 18px;">Have a great day!</strong>
//           </p>
//         </div>

//           <p style="margin: 10px 0; font-size: 14px;">
//             <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
//             <strong>${new Date().toLocaleDateString('en-PH', {
//               year: 'numeric',
//               month: 'long',
//               day: 'numeric',
//               hour: '2-digit',
//               minute: '2-digit',
//             })}</strong>
//           </p>
//         </div>

//         <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
//           <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//             <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
//           </p>
//         </div>

//         <p style="font-size: 14px; color: #7f8c8d;">
//           If you did not request this action, please contact our customer support immediately.
//         </p>

//         <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

//         <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//           <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//           <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//           <p style="margin: 5px 0;">
//             <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
//             <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
//             <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
//           </p>
//           <p style="margin: 10px 0; font-size: 11px;">
//             This is an automated message. Please do not reply to this email.
//           </p>
//         </div>
//       </div>
//     `,
//       });
//       this.logger.log(`Welcome email sent to ${email}`);
//     } catch (error) {
//       this.handleError(error, `Failed to send welcome email to ${email}`);
//       throw error;
//     }
//   }

//   async sendLoginAlert(email: string) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: 'Login Alert',
//         html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//         <div style="text-align: center; margin-bottom: 20px;">
//           <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//           <p style="color: #7f8c8d; margin-top: 0;">Logged-In Notification</p>
//         </div>

//         <p><strong>Hello... </strong>,</p>

//         <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">

//         <div>
//         <p style="margin: 0px 0; font-size: 14px;">
//             <strong style="font-size: 18px;">You just logged into your account.</strong>
//           </p>
//         </div>

//           <p style="margin: 10px 0; font-size: 14px;">
//             <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
//             <strong>${new Date().toLocaleDateString('en-PH', {
//               year: 'numeric',
//               month: 'long',
//               day: 'numeric',
//               hour: '2-digit',
//               minute: '2-digit',
//             })}</strong>
//           </p>
//         </div>

//         <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
//           <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//             <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
//           </p>
//         </div>

//         <p style="font-size: 14px; color: #7f8c8d;">
//           If you did not request this action, please contact our customer support immediately.
//         </p>

//         <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

//         <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//           <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//           <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//           <p style="margin: 5px 0;">
//             <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
//             <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
//             <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
//           </p>
//           <p style="margin: 10px 0; font-size: 11px;">
//             This is an automated message. Please do not reply to this email.
//           </p>
//         </div>
//       </div>
//     `,
//       });
//       this.logger.log(`Login alert sent to ${email}`);
//     } catch (error) {
//       this.handleError(error, `Failed to send login alert to ${email}`);
//       throw error;
//     }
//   }

//   async createdAccountEmail(
//     email: string,
//     username: string,
//     accountNumber?: string,
//   ) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: accountNumber
//           ? `Account ${accountNumber} Created`
//           : 'Account Created',
//         html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//       <div style="text-align: center; margin-bottom: 20px;">
//         <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//         <p style="color: #7f8c8d; margin-top: 0;">Account Creation Notification</p>
//       </div>

//       <p>Hello <strong>${username}</strong>,</p>

//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 150px; color: #7f8c8d;">Account Number:</span>
//           <strong style="font-size: 18px;">${accountNumber || 'Pending'}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 60px; color: #7f8c8d;">Status:</span>
//           <strong style="font-size: 18px; color: #27ae60;">Account Created Successfully</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; color: #7f8c8d;"></span>
//           <strong style="font-size: 18px;">You can now make your first deposit.</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; color: #7f8c8d;"></span>
//           <strong style="font-size: 18px;">Thank you for banking with us.</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 150px; color: #7f8c8d;">Creation Date:</span>
//           <strong>${new Date().toLocaleDateString('en-PH', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//           })}</strong>
//         </p>
//       </div>

//       <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
//         <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//           <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
//         </p>
//       </div>

//       <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//         <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//         <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//         <p style="margin: 5px 0;">
//           <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
//           <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
//           <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
//         </p>
//         <p style="margin: 10px 0; font-size: 11px;">
//           This is an automated message. Please do not reply to this email.
//         </p>
//       </div>
//     </div>
//   `,
//       });
//       this.logger.log(`Account creation email sent to ${email}`);
//     } catch (error) {
//       this.handleError(
//         error,
//         `Failed to send account creation email to ${email}`,
//       );
//       throw error;
//     }
//   }

//   async adminCreatedAccountEmail(
//     adminEmail: string,
//     adminUsername: string,
//     targetUsername: string,
//     accountNumber: string,
//   ) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [adminEmail],
//         subject: `Account ${accountNumber} Created Successfully`,
//         html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//       <div style="text-align: center; margin-bottom: 20px;">
//         <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//         <p style="color: #7f8c8d; margin-top: 0;">Admin: Account Creation Confirmation</p>
//       </div>

//       <p>Hello <strong>${adminUsername}</strong>,</p>

//       <p>You have successfully created a new bank account. Here are the details:</p>

//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Created For:</span>
//           <strong style="font-size: 16px;">${targetUsername}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Account Number:</span>
//           <strong style="font-size: 16px; color: #2c3e50;">${accountNumber}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Status:</span>
//           <strong style="font-size: 16px; color: #27ae60;">✅ Successfully Created</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Creation Date:</span>
//           <strong>${new Date().toLocaleDateString('en-PH', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//           })}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Created By:</span>
//           <strong>${adminUsername} (Admin)</strong>
//         </p>
//       </div>

//       <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
//         <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//           <strong>📋 Note:</strong> A notification email has been sent to the account holder (${targetUsername}) with their account details.
//         </p>
//       </div>

//       <div style="margin: 20px 0; padding: 15px; background-color: #fff8e1; border-radius: 6px; border-left: 4px solid #f39c12;">
//         <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//           <strong>🔒 Security Reminder:</strong> As an administrator, please ensure all account creation follows proper verification procedures.
//         </p>
//       </div>

//       <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//         <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//         <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//         <p style="margin: 5px 0;">
//           <a href="https://capitalbank.ph/admin" style="color: #3498db; text-decoration: none;">Admin Portal</a> |
//           <a href="https://capitalbank.ph/admin/audit" style="color: #3498db; text-decoration: none;">Audit Logs</a> |
//           <a href="https://capitalbank.ph/admin/support" style="color: #3498db; text-decoration: none;">Admin Support</a>
//         </p>
//         <p style="margin: 10px 0; font-size: 11px;">
//           This is an automated administrative message. Please do not reply to this email.
//         </p>
//         <p style="margin: 5px 0; font-size: 10px; color: #bdc3c7;">
//           Transaction ID: ADM-ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}
//         </p>
//       </div>
//     </div>
//   `,
//       });
//       this.logger.log(`Admin account creation email sent to ${adminEmail}`);
//     } catch (error) {
//       this.handleError(
//         error,
//         `Failed to send admin account creation email to ${adminEmail}`,
//       );
//       throw error;
//     }
//   }

//   async sendTransactionEmail(
//     email: string,
//     username: string,
//     amount: number,
//     newBalance: number,
//     transactionType: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER',
//     accountNumber?: string,
//   ) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: `${transactionType} Transaction Notification - Account ${accountNumber || ''}`,
//         html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//       <div style="text-align: center; margin-bottom: 20px;">
//         <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//         <p style="color: #7f8c8d; margin-top: 0;">Transaction Notification</p>
//       </div>

//       <p>Hello <strong>${username}</strong>,</p>

//       <p>A ${transactionType.toLowerCase()} transaction has been processed on your account.</p>

//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//         ${
//           accountNumber
//             ? `<p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Account Number:</span>
//           <strong style="font-size: 16px;">${accountNumber}</strong>
//         </p>`
//             : ''
//         }

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Transaction Type:</span>
//           <strong style="font-size: 16px; color: ${transactionType === 'DEPOSIT' ? '#27ae60' : '#e74c3c'}">
//             ${transactionType}
//           </strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount:</span>
//           <strong style="font-size: 16px;">$${amount.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
//           <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
//           <strong>${new Date().toLocaleDateString('en-PH', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//           })}</strong>
//         </p>
//       </div>

//       <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//         <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//         <p style="margin: 10px 0; font-size: 11px;">
//           This is an automated transaction notification. Please do not reply to this email.
//         </p>
//       </div>
//     </div>
//     `,
//       });
//       this.logger.log(`Transaction email sent to ${email}`);
//     } catch (error) {
//       this.handleError(error, `Failed to send transaction email to ${email}`);
//       throw error;
//     }
//   }

//   async withdrawTransactionEmail(
//     email: string,
//     username: string,
//     amount: number,
//     newBalance: number,
//     accountNumber?: string,
//   ) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: `Withdrawal Notification - Account ${accountNumber || ''}`,
//         html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//       <div style="text-align: center; margin-bottom: 20px;">
//         <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//         <p style="color: #7f8c8d; margin-top: 0;">Withdrawal Transaction Notification</p>
//       </div>

//       <p>Hello <strong>${username}</strong>,</p>

//       <p>A withdrawal transaction has been processed on your account.</p>

//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//         ${
//           accountNumber
//             ? `<p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Account Number:</span>
//           <strong style="font-size: 16px;">${accountNumber}</strong>
//         </p>`
//             : ''
//         }

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Transaction Type:</span>
//           <strong style="font-size: 16px; color: #e74c3c;">WITHDRAWAL</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount Withdrawn:</span>
//           <strong style="font-size: 16px;">$${amount.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
//           <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
//           <strong>${new Date().toLocaleDateString('en-PH', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//           })}</strong>
//         </p>
//       </div>

//       <div style="margin: 20px 0; padding: 15px; background-color: #fff8e1; border-radius: 6px; border-left: 4px solid #f39c12;">
//         <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//           <strong>🔒 Security Alert:</strong> If you did not initiate this withdrawal, please contact our support immediately.
//         </p>
//       </div>

//       <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//         <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//         <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//         <p style="margin: 10px 0; font-size: 11px;">
//           This is an automated transaction notification. Please do not reply to this email.
//         </p>
//       </div>
//     </div>
//     `,
//       });
//       this.logger.log(`Withdrawal email sent to ${email}`);
//     } catch (error) {
//       this.handleError(error, `Failed to send withdrawal email to ${email}`);
//       throw error;
//     }
//   }

//   async sendPinSetEmail(email: string, username: string) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: 'Transaction PIN Set',
//         html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//         <div style="text-align: center; margin-bottom: 20px;">
//           <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//           <p style="color: #7f8c8d; margin-top: 0;">Create-Pin Notification</p>
//         </div>

//         <p>Hello <strong>${username}</strong>,</p>

//         <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//           <p style="margin: 10px 0; font-size: 14px;">
//             <p>
//         Your transaction PIN has been set successfully.
//       </p>
//           </p>
//           <p style="margin: 10px 0; font-size: 14px;">
//             <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
//             <strong>${new Date().toLocaleDateString('en-PH', {
//               year: 'numeric',
//               month: 'long',
//               day: 'numeric',
//               hour: '2-digit',
//               minute: '2-digit',
//             })}</strong>
//           </p>
//         </div>

//         <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
//           <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//             <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
//           </p>
//         </div>

//         <p style="font-size: 14px; color: #7f8c8d;">
//           If you did not recognize this request, please contact support immediately.
//         </p>

//         <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

//         <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//           <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//           <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//           <p style="margin: 5px 0;">
//             <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
//             <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
//             <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
//           </p>
//           <p style="margin: 10px 0; font-size: 11px;">
//             This is an automated message. Please do not reply to this email.
//           </p>
//         </div>
//       </div>
//     `,
//       });
//       this.logger.log(`PIN set email sent to ${email}`);
//     } catch (error) {
//       this.handleError(error, `Failed to send PIN set email to ${email}`);
//       throw error;
//     }
//   }

//   async fromAccountEmail(
//     senderEmail: string,
//     senderUsername: string,
//     receiverUsername: string,
//     amount: number,
//     newBalance: number,
//     fromAccountNumber: string,
//     toAccountNumber: string,
//   ) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [senderEmail],
//         subject: `Transfer Sent - Reference: TR-${Date.now().toString().slice(-8)}`,
//         html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//       <div style="text-align: center; margin-bottom: 20px;">
//         <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//         <p style="color: #7f8c8d; margin-top: 0;">Transfer Confirmation - Sent</p>
//       </div>

//       <p>Hello <strong>${senderUsername}</strong>,</p>

//       <p>Your transfer has been successfully processed.</p>

//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">From Account:</span>
//           <strong style="font-size: 16px;">${fromAccountNumber}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">To Account:</span>
//           <strong style="font-size: 16px;">${toAccountNumber}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Recipient:</span>
//           <strong style="font-size: 16px;">${receiverUsername}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount Sent:</span>
//           <strong style="font-size: 16px; color: #e74c3c;">₱${amount.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
//           <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
//           <strong>${new Date().toLocaleDateString('en-PH', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//           })}</strong>
//         </p>
//       </div>

//       <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//         <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//         <p style="margin: 10px 0; font-size: 11px;">
//           This is an automated transaction notification. Please do not reply to this email.
//         </p>
//       </div>
//     </div>
//     `,
//       });
//       this.logger.log(`Transfer sent email sent to ${senderEmail}`);
//     } catch (error) {
//       this.handleError(
//         error,
//         `Failed to send transfer sent email to ${senderEmail}`,
//       );
//       throw error;
//     }
//   }

//   async toAccountEmail(
//     receiverEmail: string,
//     receiverUsername: string,
//     senderUsername: string,
//     amount: number,
//     newBalance: number,
//     toAccountNumber: string,
//     fromAccountNumber: string,
//   ) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [receiverEmail],
//         subject: `Transfer Received - Reference: TR-${Date.now().toString().slice(-8)}`,
//         html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//       <div style="text-align: center; margin-bottom: 20px;">
//         <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//         <p style="color: #7f8c8d; margin-top: 0;">Transfer Notification - Received</p>
//       </div>

//       <p>Hello <strong>${receiverUsername}</strong>,</p>

//       <p>You have received a transfer to your account.</p>

//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">From Account:</span>
//           <strong style="font-size: 16px;">${fromAccountNumber}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">To Account:</span>
//           <strong style="font-size: 16px;">${toAccountNumber}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Sender:</span>
//           <strong style="font-size: 16px;">${senderUsername}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount Received:</span>
//           <strong style="font-size: 16px; color: #27ae60;">₱${amount.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
//           <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
//           <strong>${new Date().toLocaleDateString('en-PH', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//           })}</strong>
//         </p>
//       </div>

//       <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//         <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//         <p style="margin: 10px 0; font-size: 11px;">
//           This is an automated transaction notification. Please do not reply to this email.
//         </p>
//       </div>
//     </div>
//     `,
//       });
//       this.logger.log(`Transfer received email sent to ${receiverEmail}`);
//     } catch (error) {
//       this.handleError(
//         error,
//         `Failed to send transfer received email to ${receiverEmail}`,
//       );
//       throw error;
//     }
//   }

//   async sendBalanceInquiryEmail(
//     email: string,
//     username: string,
//     balance: number,
//     accountId: number,
//   ) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: 'Balance Inquiry - Capital Bank',
//         html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//         <div style="text-align: center; margin-bottom: 20px;">
//           <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//           <p style="color: #7f8c8d; margin-top: 0;">Balance Inquiry Notification</p>
//         </div>

//         <p>Hello <strong>${username}</strong>,</p>

//         <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
//           <p style="margin: 10px 0; font-size: 14px;">
//             <span style="display: inline-block; width: 150px; color: #7f8c8d;">Account Number:</span>
//             <strong>#${accountId}</strong>
//           </p>
//           <p style="margin: 10px 0; font-size: 14px;">
//             <span style="display: inline-block; width: 150px; color: #7f8c8d;">Current Balance:</span>
//             <strong style="color: #27ae60; font-size: 18px;">$${balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
//           </p>
//           <p style="margin: 10px 0; font-size: 14px;">
//             <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
//             <strong>${new Date().toLocaleDateString('en-PH', {
//               year: 'numeric',
//               month: 'long',
//               day: 'numeric',
//               hour: '2-digit',
//               minute: '2-digit',
//             })}</strong>
//           </p>
//         </div>

//         <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
//           <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//             <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
//           </p>
//         </div>

//         <p style="font-size: 14px; color: #7f8c8d;">
//           If you did not request this balance inquiry, please contact our customer support immediately.
//         </p>

//         <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

//         <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//           <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//           <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//           <p style="margin: 5px 0;">
//             <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
//             <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
//             <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
//           </p>
//           <p style="margin: 10px 0; font-size: 11px;">
//             This is an automated message. Please do not reply to this email.
//           </p>
//         </div>
//       </div>
//     `,
//       });
//       this.logger.log(`Balance inquiry email sent to ${email}`);
//     } catch (error) {
//       this.handleError(
//         error,
//         `Failed to send balance inquiry email to ${email}`,
//       );
//       throw error;
//     }
//   }

//   async sendAccountClosedEmail(email: string, message: string) {
//     try {
//       await this.resend.emails.send({
//         from: this.getFromAddress(),
//         to: [email],
//         subject: 'Account Closure Notification - Capital Bank',
//         html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//       <div style="text-align: center; margin-bottom: 20px;">
//         <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
//         <p style="color: #7f8c8d; margin-top: 0;">Account Closure Notification</p>
//       </div>

//       <p><strong>Dear Valued Customer,</strong></p>

//       <p>This email is to confirm that your bank account has been closed as requested.</p>

//       <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
//         <p style="margin: 0 0 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 150px; color: #7f8c8d;">Status:</span>
//           <strong style="color: #e74c3c;">ACCOUNT CLOSED</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 150px; color: #7f8c8d;">Closure Date:</span>
//           <strong>${new Date().toLocaleDateString('en-PH', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//           })}</strong>
//         </p>

//         <p style="margin: 10px 0; font-size: 14px;">
//           <span style="display: inline-block; width: 150px; color: #7f8c8d;">Notification:</span>
//           <strong>${message}</strong>
//         </p>
//       </div>

//       <div style="background-color: #fff8e1; padding: 15px; border-radius: 6px; border-left: 4px solid #f39c12; margin: 20px 0;">
//         <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//           <strong>📋 Important Information:</strong>
//         </p>
//         <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #7f8c8d;">
//           <li>All scheduled transfers and recurring payments have been cancelled</li>
//           <li>Any remaining balance has been transferred as per your instructions</li>
//           <li>Your debit/credit cards linked to this account have been deactivated</li>
//           <li>Online banking access for this account has been terminated</li>
//         </ul>
//       </div>

//       <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
//         <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//           <strong>💡 Next Steps:</strong> You may want to:
//         </p>
//         <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #7f8c8d;">
//           <li>Update any automatic payment settings with other service providers</li>
//           <li>Keep this confirmation for your records</li>
//           <li>Contact us if you have any questions about tax documents</li>
//         </ul>
//       </div>

//       <div style="margin: 20px 0; padding: 15px; background-color: #f9f0f0; border-radius: 6px; border-left: 4px solid #c0392b;">
//         <p style="margin: 0; color: #2c3e50; font-size: 14px;">
//           <strong>⚠️ Final Reminder:</strong> This action is irreversible. If you did not request this account closure or notice any suspicious activity, please contact our security team immediately.
//         </p>
//       </div>

//       <p style="font-size: 14px; color: #7f8c8d;">
//         We're sorry to see you go. If there's anything we could have done better, please let us know through our feedback form.
//       </p>

//       <p style="font-size: 14px;">
//         Thank you for banking with us.<br>
//         <strong>Capital Bank Customer Service Team</strong>
//       </p>

//       <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

//       <div style="text-align: center; font-size: 12px; color: #95a5a6;">
//         <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
//         <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
//         <p style="margin: 5px 0;">
//           <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
//           <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
//           <a href="https://capitalbank.ph/feedback" style="color: #3498db; text-decoration: none;">Share Feedback</a>
//         </p>
//         <p style="margin: 10px 0; font-size: 11px;">
//           This is an automated message. Please do not reply to this email.<br>
//           Capital Bank is regulated by the Bangko Sentral ng Pilipinas.
//         </p>
//       </div>
//     </div>
//     `,
//       });
//       this.logger.log(`Account closed email sent to ${email}`);
//     } catch (error) {
//       this.handleError(
//         error,
//         `Failed to send account closed email to ${email}`,
//       );
//       throw error;
//     }
//   }
// }

import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendWelcomeEmail(email: string, username: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Capital-One Bank',
      // html: `
      //   <h2>Welcome, ${username}!</h2>
      //   <p>Your account was created successfully.</p>
      //   <p>Thank you for choosing Capital-One Bank.</p>
      //   <p>Have a great day!</p>
      // `,

      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
          <p style="color: #7f8c8d; margin-top: 0;">Account-Signup Notification</p>
        </div>

        <p>Hello<strong>Welcome, ${username}! </strong>,</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">

        <div>
        <p style="margin: 0px 0; font-size: 14px;">
            <strong style="font-size: 18px;">Your account was created successfully.</strong>
          </p>
        <p style="margin: 0px 0; font-size: 14px;">
            <strong style="font-size: 18px;">Thank you for choosing Capital-One Bank.</strong>
          </p>
        <p style="margin: 0px 0; font-size: 14px;">
            <strong style="font-size: 18px;">Have a great day!</strong>
          </p>
        </div>

          <p style="margin: 10px 0; font-size: 14px;">
            <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
            <strong>${new Date().toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</strong>
          </p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
          <p style="margin: 0; color: #2c3e50; font-size: 14px;">
            <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #7f8c8d;">
          If you did not request this action, please contact our customer support immediately.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div style="text-align: center; font-size: 12px; color: #95a5a6;">
          <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
          <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
          <p style="margin: 5px 0;">
            <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
            <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
            <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
          </p>
          <p style="margin: 10px 0; font-size: 11px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    });
  }

  async sendLoginAlert(email: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Login Alert',
      // html: `<p>You just logged into your account.</p>`,

      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
          <p style="color: #7f8c8d; margin-top: 0;">Logged-In Notification</p>
        </div>

        <p><strong>Hello... </strong>,</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">

        <div>
        <p style="margin: 0px 0; font-size: 14px;">
            <strong style="font-size: 18px;">You just logged into your account.</strong>
          </p>
        </div>

          <p style="margin: 10px 0; font-size: 14px;">
            <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
            <strong>${new Date().toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</strong>
          </p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
          <p style="margin: 0; color: #2c3e50; font-size: 14px;">
            <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #7f8c8d;">
          If you did not request this action, please contact our customer support immediately.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div style="text-align: center; font-size: 12px; color: #95a5a6;">
          <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
          <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
          <p style="margin: 5px 0;">
            <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
            <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
            <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
          </p>
          <p style="margin: 10px 0; font-size: 11px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    });
  }

  async createdAccountEmail(
    email: string,
    username: string,
    accountNumber?: string,
  ) {
    await this.mailer.sendMail({
      to: email,
      subject: accountNumber
        ? `Account ${accountNumber} Created`
        : 'Account Created',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
        <p style="color: #7f8c8d; margin-top: 0;">Account Creation Notification</p>
      </div>

      <p>Hello <strong>${username}</strong>,</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 150px; color: #7f8c8d;">Account Number:</span>
          <strong style="font-size: 18px;">${accountNumber || 'Pending'}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 60px; color: #7f8c8d;">Status:</span>
          <strong style="font-size: 18px; color: #27ae60;">Account Created Successfully</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; color: #7f8c8d;"></span>
          <strong style="font-size: 18px;">You can now make your first deposit.</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; color: #7f8c8d;"></span>
          <strong style="font-size: 18px;">Thank you for banking with us.</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 150px; color: #7f8c8d;">Creation Date:</span>
          <strong>${new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</strong>
        </p>
      </div>

      <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
        <p style="margin: 0; color: #2c3e50; font-size: 14px;">
          <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
        </p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
        <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
        <p style="margin: 5px 0;">
          <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
          <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
          <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
        </p>
        <p style="margin: 10px 0; font-size: 11px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  `,
    });
  }

  // In your MailService class
  async adminCreatedAccountEmail(
    adminEmail: string,
    adminUsername: string,
    targetUsername: string,
    accountNumber: string,
  ) {
    await this.mailer.sendMail({
      to: adminEmail,
      subject: `Account ${accountNumber} Created Successfully`,
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
        <p style="color: #7f8c8d; margin-top: 0;">Admin: Account Creation Confirmation</p>
      </div>

      <p>Hello <strong>${adminUsername}</strong>,</p>

      <p>You have successfully created a new bank account. Here are the details:</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Created For:</span>
          <strong style="font-size: 16px;">${targetUsername}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Account Number:</span>
          <strong style="font-size: 16px; color: #2c3e50;">${accountNumber}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Status:</span>
          <strong style="font-size: 16px; color: #27ae60;">✅ Successfully Created</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Creation Date:</span>
          <strong>${new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Created By:</span>
          <strong>${adminUsername} (Admin)</strong>
        </p>
      </div>

      <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
        <p style="margin: 0; color: #2c3e50; font-size: 14px;">
          <strong>📋 Note:</strong> A notification email has been sent to the account holder (${targetUsername}) with their account details.
        </p>
      </div>

      <div style="margin: 20px 0; padding: 15px; background-color: #fff8e1; border-radius: 6px; border-left: 4px solid #f39c12;">
        <p style="margin: 0; color: #2c3e50; font-size: 14px;">
          <strong>🔒 Security Reminder:</strong> As an administrator, please ensure all account creation follows proper verification procedures.
        </p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
        <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
        <p style="margin: 5px 0;">
          <a href="https://capitalbank.ph/admin" style="color: #3498db; text-decoration: none;">Admin Portal</a> |
          <a href="https://capitalbank.ph/admin/audit" style="color: #3498db; text-decoration: none;">Audit Logs</a> |
          <a href="https://capitalbank.ph/admin/support" style="color: #3498db; text-decoration: none;">Admin Support</a>
        </p>
        <p style="margin: 10px 0; font-size: 11px;">
          This is an automated administrative message. Please do not reply to this email.
        </p>
        <p style="margin: 5px 0; font-size: 10px; color: #bdc3c7;">
          Transaction ID: ADM-ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}
        </p>
      </div>
    </div>
  `,
    });
  }

  // In your MailService
  async sendTransactionEmail(
    email: string,
    username: string,
    amount: number,
    newBalance: number,
    transactionType: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER',
    accountNumber?: string,
  ) {
    await this.mailer.sendMail({
      to: email,
      subject: `${transactionType} Transaction Notification - Account ${accountNumber || ''}`,
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
        <p style="color: #7f8c8d; margin-top: 0;">Transaction Notification</p>
      </div>

      <p>Hello <strong>${username}</strong>,</p>

      <p>A ${transactionType.toLowerCase()} transaction has been processed on your account.</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        ${
          accountNumber
            ? `<p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Account Number:</span>
          <strong style="font-size: 16px;">${accountNumber}</strong>
        </p>`
            : ''
        }

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Transaction Type:</span>
          <strong style="font-size: 16px; color: ${transactionType === 'DEPOSIT' ? '#27ae60' : '#e74c3c'}">
            ${transactionType}
          </strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount:</span>
          <strong style="font-size: 16px;">$${amount.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
          <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
          <strong>${new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</strong>
        </p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
        <p style="margin: 10px 0; font-size: 11px;">
          This is an automated transaction notification. Please do not reply to this email.
        </p>
      </div>
    </div>
    `,
    });
  }

  async withdrawTransactionEmail(
    email: string,
    username: string,
    amount: number,
    newBalance: number,
    accountNumber?: string,
  ) {
    await this.mailer.sendMail({
      to: email,
      subject: `Withdrawal Notification - Account ${accountNumber || ''}`,
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
        <p style="color: #7f8c8d; margin-top: 0;">Withdrawal Transaction Notification</p>
      </div>

      <p>Hello <strong>${username}</strong>,</p>

      <p>A withdrawal transaction has been processed on your account.</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        ${
          accountNumber
            ? `<p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Account Number:</span>
          <strong style="font-size: 16px;">${accountNumber}</strong>
        </p>`
            : ''
        }

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Transaction Type:</span>
          <strong style="font-size: 16px; color: #e74c3c;">WITHDRAWAL</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount Withdrawn:</span>
          <strong style="font-size: 16px;">$${amount.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
          <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
          <strong>${new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</strong>
        </p>
      </div>

      <div style="margin: 20px 0; padding: 15px; background-color: #fff8e1; border-radius: 6px; border-left: 4px solid #f39c12;">
        <p style="margin: 0; color: #2c3e50; font-size: 14px;">
          <strong>🔒 Security Alert:</strong> If you did not initiate this withdrawal, please contact our support immediately.
        </p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
        <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
        <p style="margin: 10px 0; font-size: 11px;">
          This is an automated transaction notification. Please do not reply to this email.
        </p>
      </div>
    </div>
    `,
    });
  }

  async sendPinSetEmail(email: string, username: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Transaction PIN Set',
      //   html: `
      //   <h2>Hello ${username}!</h2>
      //   <p>Your transaction PIN has been set successfully.</p>
      // `,

      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
          <p style="color: #7f8c8d; margin-top: 0;">Create-Pin Notification</p>
        </div>

        <p>Hello <strong>${username}</strong>,</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 10px 0; font-size: 14px;">
            <p>
        Your transaction PIN has been set successfully.
      </p>
          </p>
          <p style="margin: 10px 0; font-size: 14px;">
            <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
            <strong>${new Date().toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</strong>
          </p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
          <p style="margin: 0; color: #2c3e50; font-size: 14px;">
            <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #7f8c8d;">
          If you did not recognize this request, please contact support immediately.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div style="text-align: center; font-size: 12px; color: #95a5a6;">
          <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
          <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
          <p style="margin: 5px 0;">
            <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
            <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
            <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
          </p>
          <p style="margin: 10px 0; font-size: 11px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    });
  }

  async fromAccountEmail(
    senderEmail: string,
    senderUsername: string,
    receiverUsername: string,
    amount: number,
    newBalance: number,
    fromAccountNumber: string,
    toAccountNumber: string,
  ) {
    await this.mailer.sendMail({
      to: senderEmail,
      subject: `Transfer Sent - Reference: TR-${Date.now().toString().slice(-8)}`,
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
        <p style="color: #7f8c8d; margin-top: 0;">Transfer Confirmation - Sent</p>
      </div>

      <p>Hello <strong>${senderUsername}</strong>,</p>

      <p>Your transfer has been successfully processed.</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">From Account:</span>
          <strong style="font-size: 16px;">${fromAccountNumber}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">To Account:</span>
          <strong style="font-size: 16px;">${toAccountNumber}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Recipient:</span>
          <strong style="font-size: 16px;">${receiverUsername}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount Sent:</span>
          <strong style="font-size: 16px; color: #e74c3c;">₱${amount.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
          <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
          <strong>${new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</strong>
        </p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
        <p style="margin: 10px 0; font-size: 11px;">
          This is an automated transaction notification. Please do not reply to this email.
        </p>
      </div>
    </div>
    `,
    });
  }

  async toAccountEmail(
    receiverEmail: string,
    receiverUsername: string,
    senderUsername: string,
    amount: number,
    newBalance: number,
    toAccountNumber: string,
    fromAccountNumber: string,
  ) {
    await this.mailer.sendMail({
      to: receiverEmail,
      subject: `Transfer Received - Reference: TR-${Date.now().toString().slice(-8)}`,
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
        <p style="color: #7f8c8d; margin-top: 0;">Transfer Notification - Received</p>
      </div>

      <p>Hello <strong>${receiverUsername}</strong>,</p>

      <p>You have received a transfer to your account.</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">From Account:</span>
          <strong style="font-size: 16px;">${fromAccountNumber}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">To Account:</span>
          <strong style="font-size: 16px;">${toAccountNumber}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Sender:</span>
          <strong style="font-size: 16px;">${senderUsername}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Amount Received:</span>
          <strong style="font-size: 16px; color: #27ae60;">₱${amount.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">New Balance:</span>
          <strong style="font-size: 16px;">$${newBalance.toFixed(2)}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 180px; color: #7f8c8d;">Date & Time:</span>
          <strong>${new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</strong>
        </p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
        <p style="margin: 10px 0; font-size: 11px;">
          This is an automated transaction notification. Please do not reply to this email.
        </p>
      </div>
    </div>
    `,
    });
  }

  async sendBalanceInquiryEmail(
    email: string,
    username: string,
    balance: number,
    accountId: number,
  ) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Balance Inquiry - Capital Bank',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
          <p style="color: #7f8c8d; margin-top: 0;">Balance Inquiry Notification</p>
        </div>

        <p>Hello <strong>${username}</strong>,</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 10px 0; font-size: 14px;">
            <span style="display: inline-block; width: 150px; color: #7f8c8d;">Account Number:</span>
            <strong>#${accountId}</strong>
          </p>
          <p style="margin: 10px 0; font-size: 14px;">
            <span style="display: inline-block; width: 150px; color: #7f8c8d;">Current Balance:</span>
            <strong style="color: #27ae60; font-size: 18px;">$${balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </p>
          <p style="margin: 10px 0; font-size: 14px;">
            <span style="display: inline-block; width: 150px; color: #7f8c8d;">Inquiry Date:</span>
            <strong>${new Date().toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</strong>
          </p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
          <p style="margin: 0; color: #2c3e50; font-size: 14px;">
            <strong>💡 Security Tip:</strong> For your security, never share your account details, PIN, or password with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #7f8c8d;">
          If you did not request this balance inquiry, please contact our customer support immediately.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div style="text-align: center; font-size: 12px; color: #95a5a6;">
          <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
          <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
          <p style="margin: 5px 0;">
            <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
            <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
            <a href="https://capitalbank.ph/security" style="color: #3498db; text-decoration: none;">Security Center</a>
          </p>
          <p style="margin: 10px 0; font-size: 11px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    });
  }

  async sendAccountClosedEmail(email: string, message: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Account Closure Notification - Capital Bank',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Capital Bank</h2>
        <p style="color: #7f8c8d; margin-top: 0;">Account Closure Notification</p>
      </div>

      <p><strong>Dear Valued Customer,</strong></p>

      <p>This email is to confirm that your bank account has been closed as requested.</p>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 150px; color: #7f8c8d;">Status:</span>
          <strong style="color: #e74c3c;">ACCOUNT CLOSED</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 150px; color: #7f8c8d;">Closure Date:</span>
          <strong>${new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</strong>
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <span style="display: inline-block; width: 150px; color: #7f8c8d;">Notification:</span>
          <strong>${message}</strong>
        </p>
      </div>

      <div style="background-color: #fff8e1; padding: 15px; border-radius: 6px; border-left: 4px solid #f39c12; margin: 20px 0;">
        <p style="margin: 0; color: #2c3e50; font-size: 14px;">
          <strong>📋 Important Information:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #7f8c8d;">
          <li>All scheduled transfers and recurring payments have been cancelled</li>
          <li>Any remaining balance has been transferred as per your instructions</li>
          <li>Your debit/credit cards linked to this account have been deactivated</li>
          <li>Online banking access for this account has been terminated</li>
        </ul>
      </div>

      <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
        <p style="margin: 0; color: #2c3e50; font-size: 14px;">
          <strong>💡 Next Steps:</strong> You may want to:
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #7f8c8d;">
          <li>Update any automatic payment settings with other service providers</li>
          <li>Keep this confirmation for your records</li>
          <li>Contact us if you have any questions about tax documents</li>
        </ul>
      </div>

      <div style="margin: 20px 0; padding: 15px; background-color: #f9f0f0; border-radius: 6px; border-left: 4px solid #c0392b;">
        <p style="margin: 0; color: #2c3e50; font-size: 14px;">
          <strong>⚠️ Final Reminder:</strong> This action is irreversible. If you did not request this account closure or notice any suspicious activity, please contact our security team immediately.
        </p>
      </div>

      <p style="font-size: 14px; color: #7f8c8d;">
        We're sorry to see you go. If there's anything we could have done better, please let us know through our feedback form.
      </p>

      <p style="font-size: 14px;">
        Thank you for banking with us.<br>
        <strong>Capital Bank Customer Service Team</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <div style="text-align: center; font-size: 12px; color: #95a5a6;">
        <p style="margin: 5px 0;">Capital Bank • 123 Financial District, Makati City</p>
        <p style="margin: 5px 0;">Customer Service: (02) 8888-9999 • Email: support@capitalbank.ph</p>
        <p style="margin: 5px 0;">
          <a href="https://capitalbank.ph" style="color: #3498db; text-decoration: none;">Visit our website</a> |
          <a href="https://capitalbank.ph/contact" style="color: #3498db; text-decoration: none;">Contact Us</a> |
          <a href="https://capitalbank.ph/feedback" style="color: #3498db; text-decoration: none;">Share Feedback</a>
        </p>
        <p style="margin: 10px 0; font-size: 11px;">
          This is an automated message. Please do not reply to this email.<br>
          Capital Bank is regulated by the Bangko Sentral ng Pilipinas.
        </p>
      </div>
    </div>
    `,
    });
  }
}
