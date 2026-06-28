const nodemailer = require('nodemailer');
const dns = require('dns');
const escapeHtml = require('./escapeHtml');
const logger = require('./logger');

// ---------------------------------------------------------------------------
// SMTP Configuration (production-safe: never log SMTP_PASS)
// ---------------------------------------------------------------------------
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 587;

if (!smtpUser || !smtpPass) {
  logger.warn('[EMAIL CONFIG] SMTP_USER or SMTP_PASS environment variables are not set.');
} else {
  logger.info('[EMAIL CONFIG] SMTP configured — host=%s port=%d user=%s', smtpHost, smtpPort, smtpUser);
}

// ---------------------------------------------------------------------------
// Production-grade Nodemailer Transporter
// - Pooled connections for throughput
// - Explicit timeouts to prevent hanging on Render cold-starts
// - secure auto-detected from port (465 → true, else false)
// - TLS hardened for production
// - NO startup transporter.verify() — it causes false timeout errors on
//   free-tier hosts and delays boot for no production benefit
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,

  // Force IPv4 by providing a custom DNS resolver lookup
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },

  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
});

// ---------------------------------------------------------------------------
// Structured SMTP Error Logger (production-safe — never logs credentials)
// ---------------------------------------------------------------------------
function logSmtpError(context, error, recipient) {
  logger.error('[SMTP ERROR] %s', context, {
    message: error.message,
    code: error.code || 'UNKNOWN',
    responseCode: error.responseCode || null,
    response: error.response || null,
    command: error.command || null,
    hostname: smtpHost,
    port: smtpPort,
    recipient: recipient || 'N/A',
    stack: error.stack,
  });
}

// ---------------------------------------------------------------------------
// safeSendEmail — centralised, retry-capable email dispatcher
//
// Every email in the project (invoice, OTP, inquiry, future) MUST use this.
//
// Retry policy: up to 3 attempts with exponential backoff (1 s, 2 s, 4 s).
// Returns a structured result object — never throws.
// ---------------------------------------------------------------------------
const RETRY_DELAYS = [500, 1000, 2000]; // ms between retries

async function safeSendEmail(mailOptions, meta = {}) {
  const startTime = Date.now();
  const recipient = mailOptions.to;
  const context = meta.context || 'GENERIC';

  logger.info('[EMAIL] Sending %s email — to=%s subject="%s"', context, recipient, mailOptions.subject);

  for (let attempt = 1; attempt <= RETRY_DELAYS.length + 1; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      const durationMs = Date.now() - startTime;

      logger.info('[EMAIL SUCCESS] %s — messageId=%s accepted=%j rejected=%j duration=%dms',
        context, info.messageId, info.accepted, info.rejected, durationMs);

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      logSmtpError(`${context} attempt ${attempt}/${RETRY_DELAYS.length + 1}`, error, recipient);

      // If we have retries left, wait and try again
      if (attempt <= RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt - 1];
        logger.info('[EMAIL RETRY] %s — retrying in %dms (attempt %d/%d)',
          context, delay, attempt + 1, RETRY_DELAYS.length + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // All retries exhausted
        const durationMs = Date.now() - startTime;
        logger.error('[EMAIL FAILED] %s — all %d attempts exhausted, duration=%dms',
          context, RETRY_DELAYS.length + 1, durationMs);

        return {
          success: false,
          error: error.message,
          code: error.code || 'UNKNOWN',
          responseCode: error.responseCode || null,
        };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// getEmailHealthStatus — safe config check for the /email-health endpoint
// ---------------------------------------------------------------------------
function getEmailHealthStatus() {
  return {
    smtpConfigured: !!(smtpUser && smtpPass),
    host: smtpHost,
    port: smtpPort,
    userConfigured: !!smtpUser,
    recipientConfigured: !!(process.env.CONTACT_INQUIRY_RECIPIENT || smtpUser),
  };
}

// ---------------------------------------------------------------------------
// sendInvoiceEmail — booking confirmation & invoice
// ---------------------------------------------------------------------------
async function sendInvoiceEmail(ride) {
  try {
    const to = ride.passengerDetails.email;
    const isPaid = ride.paymentStatus === 'paid';
    const totalAmount = ride.fare;

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(totalAmount);

    const bookingId = ride._id.toString().substring(18, 24).toUpperCase();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - DMS Cab Services Booking #${bookingId}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 20px 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid rgba(0, 56, 147, 0.15);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 56, 147, 0.05);
          }
          .header {
            background-color: #003893;
            padding: 40px;
            text-align: center;
            border-bottom: 4px solid #F8C301;
          }
          .header h1 {
            color: #ffffff;
            font-family: 'Georgia', serif;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
            font-size: 28px;
          }
          .header p {
            color: #F8C301;
            font-size: 12px;
            letter-spacing: 2px;
            margin: 5px 0 0;
            text-transform: uppercase;
            font-weight: bold;
          }
          .content {
            padding: 40px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .badge-paid {
            background-color: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .badge-pending {
            background-color: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
          }
          .grid {
            margin: 20px 0;
            width: 100%;
          }
          .grid-table {
            width: 100%;
            border-collapse: collapse;
          }
          .grid-table td {
            padding: 8px 0;
            font-size: 14px;
          }
          .label {
            color: #64748b;
            width: 35%;
          }
          .val {
            color: #0f172a;
            font-weight: bold;
          }
          .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 25px 0;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th {
            text-align: left;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .table td {
            padding: 15px 0;
            font-size: 14px;
            border-bottom: 1px solid #f1f5f9;
          }
          .price-block {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
            border: 1px solid rgba(0, 56, 147, 0.08);
          }
          .price-row {
            margin-bottom: 10px;
            font-size: 14px;
            overflow: auto;
          }
          .price-label {
            float: left;
            color: #64748b;
          }
          .price-value {
            float: right;
            color: #0f172a;
            font-weight: bold;
          }
          .price-row-total {
            border-top: 1px solid rgba(0, 56, 147, 0.2);
            padding-top: 15px;
            margin-top: 15px;
            font-size: 18px;
            font-family: 'Georgia', serif;
            overflow: auto;
          }
          .price-value-total {
            float: right;
            color: #003893;
            font-weight: bold;
          }
          .footer {
            background-color: #0f172a;
            padding: 30px 40px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid rgba(0, 56, 147, 0.1);
          }
          .footer a {
            color: #F8C301;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DMS Cab Services</h1>
            <p>Pinnacle Chauffeur Reservation</p>
          </div>
          <div class="content">
            <table style="width: 100%; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
              <tr>
                <td>
                  <h2 style="margin: 0; font-family: 'Georgia', serif; font-size: 22px; color: #003893;">Booking Invoice</h2>
                </td>
                <td style="text-align: right;">
                  <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'Paid' : 'Pay to Chauffeur'}</span>
                </td>
              </tr>
            </table>
            
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-top: 0;">
              Dear ${escapeHtml(ride.passengerDetails.fullName)},<br><br>
              Thank you for reserving a luxury journey with DMS Cab Services. Your reservation details and billing statement are verified below.
            </p>

            <div class="grid">
              <table class="grid-table">
                <tr>
                  <td class="label">Invoice ID</td>
                  <td class="val">#INV-${bookingId}-${ride._id.toString().substring(0, 4).toUpperCase()}</td>
                </tr>
                <tr>
                  <td class="label">Booking Date</td>
                  <td class="val">${ride.pickupDate}</td>
                </tr>
                <tr>
                  <td class="label">Pickup Time</td>
                  <td class="val">${ride.pickupTime}</td>
                </tr>
                <tr>
                  <td class="label">Payment Method</td>
                  <td class="val" style="text-transform: uppercase;">${ride.paymentMethod}</td>
                </tr>
              </table>
            </div>

            <div class="divider"></div>

            <h3 style="font-family: 'Georgia', serif; font-size: 16px; color: #003893; margin-bottom: 15px; margin-top: 0;">Route & Chauffeur Details</h3>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50%;">Pickup Location</th>
                  <th style="width: 50%;">Dropoff Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color: #0f172a; line-height: 1.4; vertical-align: top; padding-right: 15px;">${escapeHtml(ride.pickupLocation)}</td>
                  <td style="color: #0f172a; line-height: 1.4; vertical-align: top;">${escapeHtml(ride.dropoffLocation)}</td>
                </tr>
              </tbody>
            </table>

            <table class="table" style="margin-top: 10px;">
              <thead>
                <tr>
                  <th style="width: 50%;">Vehicle Type</th>
                  <th style="width: 50%;">Special Instructions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color: #0f172a; line-height: 1.4; vertical-align: top; padding-right: 15px; font-weight: bold;">${escapeHtml(ride.vehicleType)}</td>
                  <td style="color: #475569; line-height: 1.4; vertical-align: top; font-style: italic;">${escapeHtml(ride.passengerDetails.specialInstructions || 'None')}</td>
                </tr>
              </tbody>
            </table>

            <div class="price-block">
              <div class="price-row">
                <span class="price-label">Base Luxury Fare</span>
                <span class="price-value">${formattedAmount}</span>
              </div>
              <div class="price-row">
                <span class="price-label">GST & Toll Cover (Inc.)</span>
                <span class="price-value">₹0.00</span>
              </div>
              <div class="price-row-total">
                <span class="price-label" style="color: #0f172a; float: left;">Grand Total</span>
                <span class="price-value-total">${formattedAmount}</span>
              </div>
            </div>
            
            <p style="font-size: 11px; color: #64748b; line-height: 1.6; margin-top: 25px; text-align: center;">
              This is a digital transaction invoice. For any inquiries, please contact our Elite Chauffeur Support team.
            </p>
          </div>
          <div class="footer">
            <p>DMS Cab Services Chauffeurs | Kolkata, West Bengal</p>
            <p style="margin-top: 5px;">Need help? Email us at <a href="mailto:engineering@devqor.in">engineering@devqor.in</a></p>
          </div>
        </div>
      </body>
    </html>
    `;

    const mailOptions = {
      from: `"DMS Cab Services" <${smtpUser}>`,
      to,
      subject: `Luxury Booking Invoice - #${bookingId} [DMS Cab Services]`,
      html: htmlContent,
    };

    const result = await safeSendEmail(mailOptions, { context: 'INVOICE' });
    return result.success;
  } catch (error) {
    logSmtpError('INVOICE_BUILD', error, ride?.passengerDetails?.email);
    return false;
  }
}

// ---------------------------------------------------------------------------
// sendOtpEmail — ride start verification code
// ---------------------------------------------------------------------------
async function sendOtpEmail(ride, otp, driverName) {
  try {
    const to = ride.passengerDetails.email;
    const bookingId = ride._id.toString().substring(18, 24).toUpperCase();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ride Verification Code - DMS Cab Services</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 20px 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border: 1px solid rgba(0, 56, 147, 0.15);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 56, 147, 0.05);
          }
          .header {
            background-color: #003893;
            padding: 30px;
            text-align: center;
            border-bottom: 4px solid #F8C301;
          }
          .header h1 {
            color: #ffffff;
            font-family: 'Georgia', serif;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
            font-size: 24px;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .otp-box {
            background-color: #003893;
            border: 1px solid #002c6c;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 38px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #F8C301;
            margin: 0;
            font-family: monospace;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .warning {
            background-color: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            padding: 15px;
            color: #ef4444;
            font-size: 13px;
            margin-top: 20px;
            text-align: center;
          }
          .footer {
            background-color: #0f172a;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid rgba(0, 56, 147, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DMS Cab Services</h1>
          </div>
          <div class="content">
            <h2 style="font-family: 'Georgia', serif; color: #003893; margin-top: 0; font-size: 20px;">Your Ride Start OTP</h2>
            <p style="color: #475569; font-size: 14px;">
              Hello ${escapeHtml(ride.passengerDetails.fullName)},<br><br>
              Chauffeur <strong>${escapeHtml(driverName)}</strong> has been assigned to your booking <strong>#RD-${bookingId}</strong>.
            </p>
            
            <div class="otp-box">
              <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 2px;">Verification Code</p>
              <h3 class="otp-code">${otp}</h3>
              <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0;">Valid for 15 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ SECURITY WARNING:</strong> Do not share this OTP with your chauffeur until they have arrived at your pickup location and you are ready to begin the journey.
            </div>
          </div>
          <div class="footer">
            <p>DMS Cab Services Chauffeurs | Kolkata, West Bengal</p>
          </div>
        </div>
      </body>
    </html>
    `;

    const mailOptions = {
      from: `"DMS Cab Services" <${smtpUser}>`,
      to,
      subject: `Ride Verification Code - DMS Cab Services`,
      html: htmlContent,
    };

    const result = await safeSendEmail(mailOptions, { context: 'OTP' });
    return result.success;
  } catch (error) {
    logSmtpError('OTP_BUILD', error, ride?.passengerDetails?.email);
    return false;
  }
}

// ---------------------------------------------------------------------------
// sendInquiryEmail — contact form submission to admin
//
// Returns structured result (not boolean) so the controller can report
// real delivery status to the frontend.
// ---------------------------------------------------------------------------
async function sendInquiryEmail({ firstName, lastName, email, phone, subject, message }) {
  const recipientEnv = process.env.CONTACT_INQUIRY_RECIPIENT;
  const to = recipientEnv || smtpUser;
  const fullName = `${firstName} ${lastName}`;

  logger.info('[INQUIRY] Incoming inquiry — from=%s recipient=%s (source=%s)',
    email, to, recipientEnv ? 'CONTACT_INQUIRY_RECIPIENT' : 'SMTP_USER fallback');

  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Inquiry - DMS Cab Services</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 20px 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border: 1px solid rgba(0, 56, 147, 0.15);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 56, 147, 0.05);
          }
          .header {
            background-color: #003893;
            padding: 30px;
            text-align: center;
            border-bottom: 4px solid #F8C301;
          }
          .header h1 {
            color: #ffffff;
            font-family: 'Georgia', serif;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
            font-size: 24px;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid rgba(0, 56, 147, 0.08);
          }
          .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            color: #0f172a;
          }
          .info-table td.label {
            color: #64748b;
            font-weight: bold;
            width: 30%;
          }
          .info-table td.value {
            color: #0f172a;
            font-weight: bold;
          }
          .message-box {
            background-color: #f8fafc;
            border-left: 3px solid #003893;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
            color: #334155;
          }
          .footer {
            background-color: #0f172a;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid rgba(0, 56, 147, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DMS Cab Services</h1>
            <p style="color: #F8C301; font-size: 11px; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">New Contact Inquiry</p>
          </div>
          <div class="content">
            <h2 style="font-family: 'Georgia', serif; color: #003893; margin-top: 0; font-size: 20px; text-align: center;">Inquiry Details</h2>
            
            <table class="info-table">
              <tr>
                <td class="label">Client Name</td>
                <td class="value">${fullName}</td>
              </tr>
              <tr>
                <td class="label">Email Address</td>
                <td class="value">${email}</td>
              </tr>
              <tr>
                <td class="label">Phone Number</td>
                <td class="value">${phone || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Service Interest</td>
                <td class="value" style="text-transform: capitalize;">${subject}</td>
              </tr>
            </table>

            <h3 style="font-family: 'Georgia', serif; color: #003893; font-size: 16px; margin-bottom: 10px;">Message:</h3>
            <div class="message-box">
              ${escapeHtml(message).replace(/\n/g, '<br>')}
            </div>
          </div>
          <div class="footer">
            <p>DMS Cab Services Chauffeurs | Kolkata, West Bengal</p>
          </div>
        </div>
      </body>
    </html>
    `;

    const mailOptions = {
      from: `"${fullName} via DMS Cab Services" <${smtpUser}>`,
      to,
      replyTo: email,
      subject: `New Inquiry: ${subject.toUpperCase()} from ${fullName}`,
      html: htmlContent,
    };

    return await safeSendEmail(mailOptions, { context: 'INQUIRY' });
  } catch (error) {
    logSmtpError('INQUIRY_BUILD', error, email);
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN',
      responseCode: null,
    };
  }
}

// ---------------------------------------------------------------------------
// sendEmail — generic email sender helper mapping to safeSendEmail
// ---------------------------------------------------------------------------
async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: `"DMS Cab Services" <${smtpUser}>`,
    to,
    subject,
    html,
    text,
  };
  const result = await safeSendEmail(mailOptions, { context: 'GENERIC' });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }
  return result;
}

// ---------------------------------------------------------------------------
// testSmtpConnection — verifies SMTP connection
// ---------------------------------------------------------------------------
async function testSmtpConnection() {
  return new Promise((resolve) => {
    transporter.verify((error, success) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  safeSendEmail,
  sendEmail,
  sendInvoiceEmail,
  sendOtpEmail,
  sendInquiryEmail,
  getEmailHealthStatus,
  testSmtpConnection,
};

