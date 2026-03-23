import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

interface PaymentConfirmationData {
  userEmail: string
  userName: string
  eventTitle: string
  ticketName: string
  price: number
  eventDate: string
  eventLocation?: string
  organizationName?: string
  paymentIntentId: string
}

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter
  private readonly logger = new Logger(EmailService.name)

  constructor() {}

  async onModuleInit() {
    await this.initializeTransporter()
  }

  private async initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpFrom = process.env.SMTP_FROM_EMAIL

    if(!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
      this.logger.error('❌ Missing SMTP configuration!')
      this.logger.error(`   SMTP_HOST: ${smtpHost ? 'Y' : 'N'}`)
      this.logger.error(`   SMTP_PORT: ${smtpPort ? 'Y' : 'N'}`)
      this.logger.error(`   SMTP_USER: ${smtpUser ? 'Y' : 'N'}`)
      this.logger.error(`   SMTP_PASS: ${smtpPass ? 'Y' : 'N'}`)
      this.logger.error(`   SMTP_FROM_EMAIL: ${smtpFrom ? 'Y' : 'N'}`)
      throw new Error('Email service not properly configured')
    }

    try {
      const port = parseInt(smtpPort)
      const isSecure = port === 465

      this.logger.log(`🔧 Configuring email with Gmail (${smtpHost}:${port})...`)

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      await this.transporter.verify()

      this.logger.log(`Email transporter successfully connected to Gmail!`)
      this.logger.log(`From: ${smtpFrom}`)
      this.logger.log(`Using Gmail App Password (16 characters)`)
    } catch(error) {
      this.logger.error(`Failed to initialize email transporter: ${error.message}`)
      this.logger.error(`   This usually means Gmail credentials are invalid`)
      this.logger.error(`   Check SMTP_USER and SMTP_PASS in .env`)
      throw error
    }
  }

  async sendPaymentConfirmation(data: PaymentConfirmationData) {
    try {
      const htmlTemplate = this.generatePaymentConfirmationTemplate(data)

      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || 'noreply@uevent.app',
        to: data.userEmail,
        subject: `Payment Confirmed - ${data.eventTitle} Ticket`,
        html: htmlTemplate,
        text: this.generatePlainTextTemplate(data),
      }

      this.logger.log(`Sending payment confirmation email...`)
      this.logger.log(`   To: ${data.userEmail}`)
      this.logger.log(`   Subject: ${mailOptions.subject}`)

      const result = await this.transporter.sendMail(mailOptions)

      this.logger.log(`Email sent successfully!`)
      this.logger.log(`   Message ID: ${result.messageId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.userEmail}`)
      this.logger.error(`   Error: ${error.message}`)
      return null
    }
  }

  private generatePaymentConfirmationTemplate(data: PaymentConfirmationData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px 20px; }
    .success-badge { display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 10px; }
    .ticket-info { background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
    .ticket-info p { margin: 8px 0; font-size: 14px; color: #333; display: flex; justify-content: space-between; }
    .ticket-info .label { color: #666; font-weight: 500; }
    .ticket-info .value { color: #333; font-weight: 600; }
    .price-container { background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .price { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
    .price-label { font-size: 14px; color: #666; }
    .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .detail-box { background-color: #f9fafb; padding: 15px; border-radius: 8px; }
    .detail-box .icon { font-size: 20px; margin-bottom: 10px; }
    .detail-box .label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .detail-box .value { font-size: 14px; font-weight: 600; color: #333; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; font-size: 12px; color: #666; }
    .footer a { color: #667eea; text-decoration: none; }
    .divider { height: 1px; background-color: #e5e7eb; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Payment Confirmed</h1>
    </div>
    
    <div class="content">
      <p>Hi <strong>${data.userName}</strong>,</p>
      <p>Your payment has been successfully processed. Your ticket is now confirmed!</p>
      
      <div class="success-badge">Payment ID: ${data.paymentIntentId.substring(0, 20)}...</div>
      
      <div class="divider"></div>
      
      <div class="section">
        <div class="section-title">📌 Event</div>
        <div class="ticket-info">
          <p><span class="label">Event Name:</span> <span class="value">${data.eventTitle}</span></p>
          <p><span class="label">Ticket Type:</span> <span class="value">${data.ticketName}</span></p>
          ${data.organizationName ? `<p><span class="label">Organizer:</span> <span class="value">${data.organizationName}</span></p>` : ''}
          ${data.eventDate ? `<p><span class="label">Date & Time:</span> <span class="value">${data.eventDate}</span></p>` : ''}
          ${data.eventLocation ? `<p><span class="label">Location:</span> <span class="value">${data.eventLocation}</span></p>` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">💳 Payment Details</div>
        <div class="price-container">
          <div class="price-label">Amount Paid</div>
          <div class="price">$${data.price.toFixed(2)}</div>
          <div class="price-label">USD</div>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="section">
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          <strong>Next Steps:</strong><br>
          Check your account at uevent.app to view your ticket. You may receive a QR code or ticket details closer to the event date.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>UEVENT</strong></p>
      <p>Event Management Platform</p>
      <p><a href="https://uevent.app">Visit Website</a> | <a href="https://uevent.app/support">Support</a></p>
      <p style="margin-top: 10px; color: #999;">This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private generatePlainTextTemplate(data: PaymentConfirmationData): string {
    return `
Payment Confirmed!

Hi ${data.userName},

Your payment has been successfully processed. Your ticket is now confirmed!

---
EVENT DETAILS
---
Event: ${data.eventTitle}
Ticket Type: ${data.ticketName}
${data.organizationName ? `Organizer: ${data.organizationName}\n` : ''}${data.eventDate ? `Date & Time: ${data.eventDate}\n` : ''}${data.eventLocation ? `Location: ${data.eventLocation}\n` : ''}

---
PAYMENT DETAILS
---
Amount Paid: $${data.price.toFixed(2)} USD
Payment ID: ${data.paymentIntentId}

---
NEXT STEPS
---
Check your account at uevent.app to view your ticket.

For support, visit: https://uevent.app/support

This is an automated email. Please do not reply to this message.

---
UEVENT Team
Event Management Platform
    `
  }
}
