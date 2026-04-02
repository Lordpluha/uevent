import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {type Transporter, createTransport} from 'nodemailer'
import { toDataURL } from 'qrcode'
import { ApiConfigService } from '../../config/api-config.service'

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
  private transporter: Transporter | undefined
  private readonly logger = new Logger(EmailService.name)
  private static readonly SMTP_VERIFY_TIMEOUT_MS = 5000

  constructor(private readonly apiConfig: ApiConfigService) {}

  private get paymentCurrencyCode(): string {
    return this.apiConfig.paymentCurrency.toUpperCase()
  }

  private get paymentCurrencySymbol(): string {
    return this.apiConfig.paymentCurrencySymbol
  }

  private formatCurrencyLine(amount: number): string {
    return `${this.paymentCurrencySymbol}${amount.toFixed(2)} ${this.paymentCurrencyCode}`
  }

  async onModuleInit() {
    await this.initializeTransporter()
  }

  private async initializeTransporter() {
    const { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass, fromEmail: smtpFrom } = this.apiConfig.smtpConfig

    if(!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
      this.logger.warn('Missing SMTP configuration — email sending disabled.')
      this.logger.warn(`   SMTP_HOST: ${smtpHost ? 'Y' : 'N'}`)
      this.logger.warn(`   SMTP_PORT: ${smtpPort ? 'Y' : 'N'}`)
      this.logger.warn(`   SMTP_USER: ${smtpUser ? 'Y' : 'N'}`)
      this.logger.warn(`   SMTP_PASS: ${smtpPass ? 'Y' : 'N'}`)
      this.logger.warn(`   SMTP_FROM_EMAIL: ${smtpFrom ? 'Y' : 'N'}`)
      return
    }

    try {
      const port = parseInt(smtpPort)
      const isSecure = port === 465

      this.logger.log(`🔧 Configuring email with Gmail (${smtpHost}:${port})...`)

      this.transporter = createTransport({
        host: smtpHost,
        port: port,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: EmailService.SMTP_VERIFY_TIMEOUT_MS,
        greetingTimeout: EmailService.SMTP_VERIFY_TIMEOUT_MS,
        socketTimeout: EmailService.SMTP_VERIFY_TIMEOUT_MS,
      })

      await Promise.race([
        this.transporter.verify(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('SMTP verify timeout')), EmailService.SMTP_VERIFY_TIMEOUT_MS)
        }),
      ])

      this.logger.log(`Email transporter successfully connected to Gmail!`)
      this.logger.log(`From: ${smtpFrom}`)
      this.logger.log(`Using Gmail App Password (16 characters)`)
    } catch(error) {
      this.logger.error(`Failed to initialize email transporter: ${error.message}`)
      this.logger.error(`   This usually means Gmail credentials are invalid`)
      this.logger.error(`   Check SMTP_USER and SMTP_PASS in .env`)
      this.transporter = undefined
    }
  }

  async sendPaymentConfirmation(data: PaymentConfirmationData) {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured — skipping payment confirmation email.')
      return null
    }
    try {

      // generating QR code with info
      const qrCodeDataUrl = await this.generateQRCode(data)

      const htmlTemplate = this.generatePaymentConfirmationTemplate(data, qrCodeDataUrl)

      const mailOptions = {
        from: this.apiConfig.smtpConfig.fromEmail,
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
    } catch(error) {
      this.logger.error(`Failed to send email to ${data.userEmail}`)
      this.logger.error(`   Error: ${error.message}`)
      return null
    }
  }

  private async generateQRCode(data: PaymentConfirmationData): Promise<string> {
    try {
      const ticketInfo = [
        '----------------------------',
        'UEVENT TICKET VERIFICATION',
        '---------------------------',
        `Event: ${data.eventTitle}`,
        '----------------------------',
        `Ticket: ${data.ticketName}`,
        '----------------------------',
        `Buyer: ${data.userName}`,
        '----------------------------',
        `Email: ${data.userEmail}`,
        '----------------------------',
        `Price: ${this.formatCurrencyLine(data.price)}`,
        '----------------------------',
        `Payment ID: ${data.paymentIntentId}`,
        '----------------------------',
        `Purchased: ${new Date().toLocaleDateString()}`,
        '----------------------------',
        'Scan this code at event entrance'
      ].join('\n')

      const qrCodeUrl = await toDataURL(ticketInfo, {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      return qrCodeUrl
    } catch(error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`)
      return ''
    }
  }

  private generatePaymentConfirmationTemplate(data: PaymentConfirmationData, qrCodeUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0a0a0a;
      color: #f5f5f5;
      line-height: 1.6;
    }

    .wrapper { background-color: #0a0a0a; padding: 20px; }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #2d2d44;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      position: relative;
      z-index: 1;
      margin-bottom: 8px;
    }

    .header-subtitle {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    .content {
      padding: 40px 30px;
    }

    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #e5e5e5;
    }

    .greeting strong { color: #7c3aed; }

    .success-message {
      background: rgba(16, 185, 129, 0.1);
      border-left: 4px solid #10b981;
      padding: 16px;
      margin-bottom: 30px;
      border-radius: 4px;
      font-size: 14px;
      color: #a0f4c3;
    }

    .qr-section {
      background: rgba(124, 58, 237, 0.08);
      border: 2px dashed #7c3aed;
      padding: 24px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
    }

    .qr-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 1px;
      margin-bottom: 16px;
      font-weight: 600;
    }

    .qr-code {
      display: inline-block;
      background: white;
      padding: 8px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .qr-code img {
      width: 220px;
      height: 220px;
      display: block;
    }

    .qr-info {
      font-size: 12px;
      color: #a0a0b0;
      margin-top: 12px;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 4px;
      background: #7c3aed;
      border-radius: 50%;
      margin-right: 8px;
    }

    .info-box {
      background-color: #242835;
      padding: 18px;
      border-radius: 8px;
      border: 1px solid #3d3d52;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #3d3d52;
      font-size: 14px;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-row:first-child {
      padding-top: 0;
    }

    .info-label {
      color: #9ca3af;
      font-weight: 500;
    }

    .info-value {
      color: #f5f5f5;
      font-weight: 600;
    }

    .price-section {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(106, 40, 217, 0.15) 100%);
      border: 1px solid rgba(124, 58, 237, 0.3);
      padding: 24px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 28px;
    }

    .price-label {
      font-size: 12px;
      color: #a0a0b0;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .price {
      font-size: 42px;
      font-weight: 700;
      color: #7c3aed;
      margin: 12px 0;
      line-height: 1;
    }

    .currency {
      font-size: 18px;
      color: #a0a0b0;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #3d3d52, transparent);
      margin: 24px 0;
    }

    .next-steps {
      background-color: #242835;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #7c3aed;
      font-size: 14px;
      color: #d5d5e5;
      line-height: 1.8;
    }

    .next-steps strong { color: #7c3aed; }

    .footer {
      background-color: #0f0f1a;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #2d2d44;
    }

    .footer-brand {
      font-weight: 700;
      font-size: 16px;
      color: #7c3aed;
      margin-bottom: 8px;
    }

    .footer-tagline {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    .footer-links {
      font-size: 12px;
      color: #7c3aed;
      margin-bottom: 16px;
    }

    .footer-links a {
      color: #7c3aed;
      text-decoration: none;
      margin: 0 12px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    .footer-disclaimer {
      font-size: 11px;
      color: #6b7280;
      margin-top: 12px;
    }

    .icon { display: inline-block; margin-right: 6px; }

  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>! Payment Confirmed !</h1>
        <p class="header-subtitle">Your ticket is ready!</p>
      </div>

      <div class="content">
        <p class="greeting">Hey <strong>${data.userName}</strong>,</p>

        <div class="success-message">
          Your payment has been successfully processed. Your ticket is now confirmed!
        </div>

        <div class="section">
          <div class="section-title">📍 Your Ticket QR Code</div>
          <div class="qr-section">
            <div class="qr-label">Scan to verify and view details</div>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="Ticket QR Code" />
            </div>
            <div class="qr-info">
              Keep this code safe. You may need to present it at the event.
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🎫 Event Details</div>
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Event</span>
              <span class="info-value">${data.eventTitle}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Ticket Type</span>
              <span class="info-value">${data.ticketName}</span>
            </div>

            ${data.organizationName ? `
            <div class="info-row">
              <span class="info-label">Organizer</span>
              <span class="info-value">${data.organizationName}</span>
            </div>
            ` : ''}

            ${data.eventDate ? `
            <div class="info-row">
              <span class="info-label">Date & Time</span>
              <span class="info-value">${data.eventDate}</span>
            </div>
            ` : ''}

            ${data.eventLocation ? `
            <div class="info-row">
              <span class="info-label">Location</span>
              <span class="info-value">${data.eventLocation}</span>
            </div>
            ` : ''}

            <div class="info-row">
              <span class="info-label">Payment ID</span>
              <span class="info-value" style="font-size: 12px;">${data.paymentIntentId.substring(0, 20)}...</span>
            </div>

          </div>
        </div>

        <div class="section">
          <div class="section-title">💳 Payment Summary</div>
          <div class="price-section">
            <div class="price-label">Amount Paid</div>
            <div>
              <span class="price">${this.paymentCurrencySymbol}${data.price.toFixed(2)}</span>
              <span class="currency">${this.paymentCurrencyCode}</span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="next-steps">
          <strong>What's Next?</strong><br><br>
          1. Save or screenshot your QR code<br>
          2. Check your account at <strong>${this.apiConfig.clientUrl}</strong> for your ticket<br>
          3. You may need to present the QR code at the event<br><br>
          For any questions, visit our support center.
        </div>
      </div>

      <div class="footer">
        <div class="footer-brand">UEVENT</div>
        <div class="footer-tagline">Event Management Platform</div>
        <div class="footer-links">
          <a href="${this.apiConfig.clientUrl}">Website</a> |
          <a href="${this.apiConfig.clientUrl}/support">Support</a> |
          <a href="${this.apiConfig.clientUrl}/faq">FAQ</a>
        </div>
        <div class="footer-disclaimer">
          This is an automated email. Please do not reply to this message.<br>
          © ${new Date().getFullYear()} UEVENT. All rights reserved.
        </div>
      </div>
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
Amount Paid: ${this.formatCurrencyLine(data.price)}
Payment ID: ${data.paymentIntentId}

---
NEXT STEPS
---
Check your account at ${this.apiConfig.clientUrl} to view your ticket.

For support, visit: ${this.apiConfig.clientUrl}/support

This is an automated email. Please do not reply to this message.

---
UEVENT Team
Event Management Platform
    `
  }

  async sendPaymentFailedEmail(userEmail: string, userName: string, eventTitle: string, ticketName: string, failureReason: string, paymentIntentId: string) {
    if (!this.transporter) return null
    try {
      const htmlTemplate = this.generatePaymentFailedTemplate({ userEmail, userName, eventTitle, ticketName, failureReason, paymentIntentId })

      const mailOptions = {
        from: this.apiConfig.smtpConfig.fromEmail,
        to: userEmail,
        subject: `Payment Failed - ${eventTitle} Ticket`,
        html: htmlTemplate,
        text: this.generatePaymentFailedPlainText({ userEmail, userName, eventTitle, ticketName, failureReason, paymentIntentId }),
      }

      this.logger.log(`Sending payment failed email to ${userEmail}`)
      const result = await this.transporter.sendMail(mailOptions)

      this.logger.log(`Payment failed email sent to ${userEmail}`)
      return result
    } catch(error) {
      this.logger.error(`Failed to send payment failed email: ${error.message}`)
      return null
    }
  }

  async sendRefundEmail(userEmail: string, userName: string, eventTitle: string, ticketName: string, amount: number, paymentIntentId: string) {
    if (!this.transporter) return null
    try {
      const htmlTemplate = this.generateRefundTemplate({ userEmail, userName, eventTitle, ticketName, amount, paymentIntentId })

      const mailOptions = {
        from: this.apiConfig.smtpConfig.fromEmail,
        to: userEmail,
        subject: `Refund Processed - ${eventTitle}`,
        html: htmlTemplate,
        text: this.generateRefundPlainText({ userEmail, userName, eventTitle, ticketName, amount, paymentIntentId }),
      }

      this.logger.log(`Sending refund email to ${userEmail}`)
      const result = await this.transporter.sendMail(mailOptions)

      this.logger.log(`Refund email sent to ${userEmail}`)
      return result
    } catch(error) {
      this.logger.error(`Failed to send refund email: ${error.message}`)
      return null
    }
  }

  private generatePaymentFailedTemplate(data: { userEmail: string; userName: string; eventTitle: string; ticketName: string; failureReason: string; paymentIntentId: string }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0a0a0a;
      color: #f5f5f5;
      line-height: 1.6;
    }

    .wrapper { background-color: #0a0a0a; padding: 20px; }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #2d2d44;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    .header {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      position: relative;
      z-index: 1;
      margin-bottom: 8px;
    }

    .header-subtitle {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    .content {
      padding: 40px 30px;
    }

    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #e5e5e5;
    }

    .greeting strong { color: #dc2626; }
    .error-message {
      background: rgba(220, 38, 38, 0.1);
      border-left: 4px solid #dc2626;
      padding: 16px;
      margin-bottom: 30px;
      border-radius: 4px;
      font-size: 14px;
      color: #fca5a5;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 4px;
      background: #dc2626;
      border-radius: 50%;
      margin-right: 8px;
    }

    .info-box {
      background-color: #242835;
      padding: 18px;
      border-radius: 8px;
      border: 1px solid #3d3d52;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #3d3d52;
      font-size: 14px;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-row:first-child {
      padding-top: 0;
    }

    .info-label {
      color: #9ca3af;
      font-weight: 500;
    }

    .info-value {
      color: #f5f5f5;
      font-weight: 600;
    }

    .failure-box {
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(153, 27, 27, 0.15) 100%);
      border: 1px solid rgba(220, 38, 38, 0.3);
      padding: 24px;
      border-radius: 8px;
      margin: 20px 0;
    }

    .failure-label {
      font-size: 12px;
      color: #fca5a5;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .failure-reason {
      font-size: 14px;
      color: #fecaca;
      line-height: 1.6;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #3d3d52, transparent);
      margin: 24px 0;
    }

    .action-box {
      background-color: #242835;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
      font-size: 14px;
      color: #d5d5e5;
      line-height: 1.8;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 12px;
    }

    .footer {
      background-color: #0f0f1a;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #2d2d44;
    }

    .footer-brand {
      font-weight: 700;
      font-size: 16px;
      color: #dc2626;
      margin-bottom: 8px;
    }

    .footer-tagline {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    .footer-links {
      font-size: 12px;
      color: #dc2626;
      margin-bottom: 16px;
    }

    .footer-links a {
      color: #dc2626;
      text-decoration: none;
      margin: 0 12px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    .footer-disclaimer {
      font-size: 11px;
      color: #6b7280;
      margin-top: 12px;
    }

  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>✕ Payment Failed</h1>
        <p class="header-subtitle">We couldn't process your payment</p>
      </div>

      <div class="content">
        <p class="greeting">Hi <strong>${data.userName}</strong>,</p>

        <div class="error-message">
          Unfortunately, your payment for <strong>${data.eventTitle}</strong> could not be processed.
        </div>

        <div class="section">
          <div class="section-title">📋 Transaction Details</div>
          <div class="info-box">

            <div class="info-row">
              <span class="info-label">Event</span>
              <span class="info-value">${data.eventTitle}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Ticket Type</span>
              <span class="info-value">${data.ticketName}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Payment ID</span>
              <span class="info-value" style="font-size: 12px;">${data.paymentIntentId.substring(0, 20)}...</span>
            </div>

          </div>
        </div>

        <div class="failure-box">
          <div class="failure-label">Failure Reason</div>
          <div class="failure-reason">${data.failureReason}</div>
        </div>

        <div class="divider"></div>

        <div class="action-box">
          <strong>What Now?</strong><br><br>
            Check your payment method details<br>
            Ensure your card has sufficient funds<br>
            Try a different payment method<br>
            Contact your bank if the issue persists<br><br>
          <a href="${this.apiConfig.clientUrl}/checkout" class="cta-button">Try Again</a>
        </div>
      </div>

      <div class="footer">
        <div class="footer-brand">UEVENT</div>
        <div class="footer-tagline">Event Management Platform</div>
        <div class="footer-links">
          <a href="${this.apiConfig.clientUrl}">Website</a> |
          <a href="${this.apiConfig.clientUrl}/support">Support</a> |
          <a href="${this.apiConfig.clientUrl}/faq">FAQ</a>
        </div>
        <div class="footer-disclaimer">
          This is an automated email. Please do not reply to this message.<br>
          © ${new Date().getFullYear()} UEVENT. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `
  }

  private generatePaymentFailedPlainText(data: { userEmail: string; userName: string; eventTitle: string; ticketName: string; failureReason: string; paymentIntentId: string }): string {
    return `
Payment Failed

Hi ${data.userName},

Unfortunately, your payment for ${data.eventTitle} could not be processed.

---
TRANSACTION DETAILS
---
Event: ${data.eventTitle}
Ticket Type: ${data.ticketName}
Payment ID: ${data.paymentIntentId}

---
FAILURE REASON
---
${data.failureReason}

---
WHAT NOW?
---
✓ Check your payment method details
✓ Ensure your card has sufficient funds
✓ Try a different payment method
✓ Contact your bank if the issue persists

Try again: ${this.apiConfig.clientUrl}/checkout

For support, visit: ${this.apiConfig.clientUrl}/support

This is an automated email. Please do not reply to this message.

---
UEVENT Team
Event Management Platform
    `
  }

  private generateRefundTemplate(data: { userEmail: string; userName: string; eventTitle: string; ticketName: string; amount: number; paymentIntentId: string }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0a0a0a;
      color: #f5f5f5;
      line-height: 1.6;
    }

    .wrapper { background-color: #0a0a0a; padding: 20px; }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #2d2d44;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      position: relative;
      z-index: 1;
      margin-bottom: 8px;
    }

    .header-subtitle {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    .content {
      padding: 40px 30px;
    }

    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #e5e5e5;
    }

    .greeting strong { color: #10b981; }

    .success-message {
      background: rgba(16, 185, 129, 0.1);
      border-left: 4px solid #10b981;
      padding: 16px;
      margin-bottom: 30px;
      border-radius: 4px;
      font-size: 14px;
      color: #a0f4c3;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 4px;
      background: #10b981;
      border-radius: 50%;
      margin-right: 8px;
    }

    .info-box {
      background-color: #242835;
      padding: 18px;
      border-radius: 8px;
      border: 1px solid #3d3d52;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #3d3d52;
      font-size: 14px;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-row:first-child {
      padding-top: 0;
    }

    .info-label {
      color: #9ca3af;
      font-weight: 500;
    }

    .info-value {
      color: #f5f5f5;
      font-weight: 600;
    }

    .refund-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 150, 105, 0.15) 100%);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 24px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }

    .refund-label {
      font-size: 12px;
      color: #86efac;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .refund-amount {
      font-size: 42px;
      font-weight: 700;
      color: #10b981;
      margin: 12px 0;
      line-height: 1;
    }

    .refund-info {
      font-size: 12px;
      color: #a0f4c3;
      margin-top: 12px;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #3d3d52, transparent);
      margin: 24px 0;
    }

    .info-text {
      background-color: #242835;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #10b981;
      font-size: 14px;
      color: #d5d5e5;
      line-height: 1.8;
    }

    .footer {
      background-color: #0f0f1a;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #2d2d44;
    }

    .footer-brand {
      font-weight: 700;
      font-size: 16px;
      color: #10b981;
      margin-bottom: 8px;
    }

    .footer-tagline {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    .footer-links {
      font-size: 12px;
      color: #10b981;
      margin-bottom: 16px;
    }

    .footer-links a {
      color: #10b981;
      text-decoration: none;
      margin: 0 12px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    .footer-disclaimer {
      font-size: 11px;
      color: #6b7280;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>✓ Refund Processed</h1>
        <p class="header-subtitle">Your refund has been approved</p>
      </div>

      <div class="content">
        <p class="greeting">Hi <strong>${data.userName}</strong>,</p>

        <div class="success-message">
          Your refund for <strong>${data.eventTitle}</strong> has been successfully processed.
        </div>

        <div class="section">
          <div class="section-title">📋 Refund Details</div>
          <div class="info-box">

            <div class="info-row">
              <span class="info-label">Event</span>
              <span class="info-value">${data.eventTitle}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Ticket Type</span>
              <span class="info-value">${data.ticketName}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Payment ID</span>
              <span class="info-value" style="font-size: 12px;">${data.paymentIntentId.substring(0, 20)}...</span>
            </div>

          </div>
        </div>

        <div class="refund-box">
          <div class="refund-label">Refund Amount</div>
          <div class="refund-amount">$${data.amount.toFixed(2)}</div>
          <div class="refund-info">Will appear in your account within 3-5 business days</div>
        </div>

        <div class="divider"></div>

        <div class="info-text">
          <strong>What happens next?</strong><br><br>
          The refund has been initiated and will return to your original payment method within 3-5 business days. Some banks may take longer to process the refund.<br><br>
          If you have any questions, please contact our support team.
        </div>
      </div>

      <div class="footer">
        <div class="footer-brand">UEVENT</div>
        <div class="footer-tagline">Event Management Platform</div>
        <div class="footer-links">
          <a href="${this.apiConfig.clientUrl}">Website</a> |
          <a href="${this.apiConfig.clientUrl}/support">Support</a> |
          <a href="${this.apiConfig.clientUrl}/faq">FAQ</a>
        </div>
        <div class="footer-disclaimer">
          This is an automated email. Please do not reply to this message.<br>
          © ${new Date().getFullYear()} UEVENT. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `
  }

  private generateRefundPlainText(data: { userEmail: string; userName: string; eventTitle: string; ticketName: string; amount: number; paymentIntentId: string }): string {
    return `
Refund Processed

Hi ${data.userName},

Your refund for ${data.eventTitle} has been successfully processed.

---
REFUND DETAILS
---
Event: ${data.eventTitle}
Ticket Type: ${data.ticketName}
Payment ID: ${data.paymentIntentId}
Refund Amount: ${this.formatCurrencyLine(data.amount)}

---
WHAT'S NEXT?
---
The refund has been initiated and will return to your original payment method within 3-5 business days. Some banks may take longer to process the refund.

If you have any questions, please contact our support team at: ${this.apiConfig.clientUrl}/support

This is an automated email. Please do not reply to this message.

---
UEVENT Team
Event Management Platform
    `
  }

  async sendLoginNotification(
    userEmail: string,
    userName: string,
    ipAddress: string,
    userAgent: string,
    loginTime: Date,
  ) {
    if (!this.transporter) return null
    try {
      const formattedTime = loginTime.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })

      const htmlTemplate = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
    <h1 style="color: #1a1a1a; margin: 0;">UEVENT</h1>
  </div>
  <div style="padding: 30px 0;">
    <h2 style="color: #1a1a1a;">New Login Detected</h2>
    <p>Hello ${userName},</p>
    <p>A new login to your account was detected:</p>
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Time:</strong> ${formattedTime}</p>
      <p style="margin: 4px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
      <p style="margin: 4px 0;"><strong>Device:</strong> ${userAgent}</p>
    </div>
    <p>If this was you, no action is needed. If you don't recognize this login, please change your password immediately.</p>
  </div>
  <div style="text-align: center; padding: 20px 0; border-top: 2px solid #f0f0f0; color: #666; font-size: 12px;">
    <p>UEVENT Team &bull; Event Management Platform</p>
  </div>
</body>
</html>`

      const mailOptions = {
        from: this.apiConfig.smtpConfig.fromEmail,
        to: userEmail,
        subject: 'New Login to Your UEVENT Account',
        html: htmlTemplate,
        text: `Hello ${userName},\n\nA new login to your account was detected:\n\nTime: ${formattedTime}\nIP Address: ${ipAddress}\nDevice: ${userAgent}\n\nIf this was you, no action is needed. If you don't recognize this login, please change your password immediately.\n\nUEVENT Team`,
      }

      this.logger.log(`Sending login notification email to ${userEmail}`)
      const result = await this.transporter.sendMail(mailOptions)
      this.logger.log(`Login notification email sent to ${userEmail}`)
      return result
    } catch(error) {
      this.logger.error(`Failed to send login notification email: ${error.message}`)
    }
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, code: string) {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured — skipping password reset email.')
      return null
    }
    try {
      const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; margin-bottom: 16px;">Hello ${userName},</p>
      <p style="color: #374151; margin-bottom: 24px;">Use the code below to reset your password. This code expires in 15 minutes.</p>
      <div style="background: #f3f0ff; border: 2px dashed #7c3aed; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #7c3aed; margin: 0;">${code}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div style="text-align: center; padding: 20px; border-top: 1px solid #f0f0f0; color: #9ca3af; font-size: 12px;">
      <p>UEVENT Team &bull; Event Management Platform</p>
    </div>
  </div>
</body>
</html>`

      const mailOptions = {
        from: this.apiConfig.smtpConfig.fromEmail,
        to: userEmail,
        subject: 'Password Reset Code — UEVENT',
        html: htmlTemplate,
        text: `Hello ${userName},\n\nYour password reset code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\nUEVENT Team`,
      }

      this.logger.log(`Sending password reset email to ${userEmail}`)
      const result = await this.transporter.sendMail(mailOptions)
      this.logger.log(`Password reset email sent to ${userEmail}`)
      return result
    } catch(error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`)
      return null
    }
  }
}