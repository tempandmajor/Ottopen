/**
 * SendGrid Email Service
 *
 * Use this for application-level emails (NOT auth emails - those use Resend via Supabase)
 *
 * Use cases:
 * - Contact form submissions
 * - Customer inquiry notifications
 * - User notifications (messages, mentions, etc.)
 * - Referral program emails
 * - Marketing/newsletter emails
 */

import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set. SendGrid emails will fail.')
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

/**
 * Email template types
 */
export type EmailTemplate =
  | 'contact-form'
  | 'customer-inquiry'
  | 'new-message-notification'
  | 'referral-reward'
  | 'welcome-after-signup'

/**
 * Send an email via SendGrid
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from = process.env.SENDGRID_FROM_EMAIL || 'notifications@ottopen.com',
  replyTo,
}: {
  to: string | string[]
  subject: string
  text: string
  html?: string
  from?: string
  replyTo?: string
}) {
  try {
    const msg = {
      to,
      from,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
      replyTo,
    }

    const result = await sgMail.send(msg)
    console.log('✅ SendGrid email sent:', {
      to,
      subject,
      messageId: result[0].headers['x-message-id'],
    })
    return { success: true, messageId: result[0].headers['x-message-id'] }
  } catch (error: any) {
    console.error('❌ SendGrid email failed:', error.response?.body || error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

/**
 * Send contact form submission notification to admin
 */
export async function sendContactFormNotification({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'hello@ottopen.com'

  return sendEmail({
    to: adminEmail,
    subject: `[Contact Form] ${subject}`,
    text: `
New contact form submission:

From: ${name} (${email})
Subject: ${subject}

Message:
${message}

---
Sent from Ottopen Contact Form
    `.trim(),
    replyTo: email,
  })
}

/**
 * Send customer inquiry notification
 */
export async function sendCustomerInquiry({
  customerEmail,
  customerName,
  inquiryType,
  message,
}: {
  customerEmail: string
  customerName: string
  inquiryType: string
  message: string
}) {
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@ottopen.com'

  return sendEmail({
    to: supportEmail,
    subject: `[Customer Inquiry] ${inquiryType}`,
    text: `
New customer inquiry:

Customer: ${customerName} (${customerEmail})
Type: ${inquiryType}

Message:
${message}

---
Sent from Ottopen Customer Support System
    `.trim(),
    replyTo: customerEmail,
  })
}

/**
 * Send new message notification to user
 */
export async function sendMessageNotification({
  recipientEmail,
  recipientName,
  senderName,
  messagePreview,
  messageUrl,
}: {
  recipientEmail: string
  recipientName: string
  senderName: string
  messagePreview: string
  messageUrl: string
}) {
  return sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderName}`,
    text: `
Hi ${recipientName},

${senderName} sent you a message:

"${messagePreview}"

Click here to read and reply: ${messageUrl}

---
Ottopen
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .message-box { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>New message from ${senderName}</h2>
    <p>Hi ${recipientName},</p>
    <div class="message-box">
      <p><em>"${messagePreview}"</em></p>
    </div>
    <p>
      <a href="${messageUrl}" class="button">Read and Reply</a>
    </p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
    <p style="color: #666; font-size: 12px;">Ottopen</p>
  </div>
</body>
</html>
    `.trim(),
  })
}

/**
 * Send referral reward notification
 */
export async function sendReferralRewardNotification({
  userEmail,
  userName,
  rewardAmount,
  referredUserName,
}: {
  userEmail: string
  userName: string
  rewardAmount: number
  referredUserName: string
}) {
  return sendEmail({
    to: userEmail,
    subject: `🎉 You earned $${rewardAmount} from your referral!`,
    text: `
Hi ${userName},

Great news! ${referredUserName} just subscribed to Ottopen using your referral link.

You've earned: $${rewardAmount}

Your referral rewards will be paid out at the end of the month.

Keep sharing! The more friends you refer, the more you earn.

---
Ottopen
    `.trim(),
  })
}

/**
 * Send batch emails (for newsletters, announcements, etc.)
 */
export async function sendBatchEmails({
  recipients,
  subject,
  text,
  html,
}: {
  recipients: string[]
  subject: string
  text: string
  html?: string
}) {
  const results = await Promise.allSettled(
    recipients.map(to => sendEmail({ to, subject, text, html }))
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`📧 Batch email complete: ${successful} sent, ${failed} failed`)

  return { successful, failed, total: recipients.length }
}
