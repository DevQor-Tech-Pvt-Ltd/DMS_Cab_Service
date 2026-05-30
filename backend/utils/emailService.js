const nodemailer = require('nodemailer');

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
  console.warn('Warning: SMTP_USER or SMTP_PASS environment variables are not set.');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[SMTP VERIFICATION ERROR] Connection failed:', error);
  } else {
    console.log('[SMTP VERIFICATION SUCCESS] Server is ready to take our messages');
  }
});

/**
 * Send booking confirmation and invoice email to client
 */
exports.sendInvoiceEmail = async (ride) => {
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
            background-color: #060a11;
            color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0f18;
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .header {
            background-color: #060a11;
            padding: 40px;
            text-align: center;
            border-bottom: 2px solid #d4af37;
          }
          .header h1 {
            color: #d4af37;
            font-family: 'Georgia', serif;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
            font-size: 28px;
          }
          .header p {
            color: #8f9cae;
            font-size: 12px;
            letter-spacing: 2px;
            margin: 5px 0 0;
            text-transform: uppercase;
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
            color: #8f9cae;
            width: 35%;
          }
          .val {
            color: #ffffff;
            font-weight: bold;
          }
          .divider {
            height: 1px;
            background-color: rgba(255, 255, 255, 0.1);
            margin: 25px 0;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th {
            text-align: left;
            color: #8f9cae;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .table td {
            padding: 15px 0;
            font-size: 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .price-block {
            background-color: #060a11;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .price-row {
            margin-bottom: 10px;
            font-size: 14px;
            overflow: auto;
          }
          .price-label {
            float: left;
            color: #8f9cae;
          }
          .price-value {
            float: right;
            color: #ffffff;
            font-weight: bold;
          }
          .price-row-total {
            border-top: 1px solid rgba(212, 175, 55, 0.3);
            padding-top: 15px;
            margin-top: 15px;
            font-size: 18px;
            font-family: 'Georgia', serif;
            overflow: auto;
          }
          .price-value-total {
            float: right;
            color: #d4af37;
            font-weight: bold;
          }
          .footer {
            background-color: #060a11;
            padding: 30px 40px;
            text-align: center;
            font-size: 12px;
            color: #5b687a;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .footer a {
            color: #d4af37;
            text-decoration: none;
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
            <table style="width: 100%; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 15px; margin-bottom: 20px;">
              <tr>
                <td>
                  <h2 style="margin: 0; font-family: 'Georgia', serif; font-size: 22px; color: #ffffff;">Booking Invoice</h2>
                </td>
                <td style="text-align: right;">
                  <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'Paid' : 'Pay to Chauffeur'}</span>
                </td>
              </tr>
            </table>
            
            <p style="font-size: 14px; color: #8f9cae; line-height: 1.6; margin-top: 0;">
              Dear ${ride.passengerDetails.fullName},<br><br>
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

            <h3 style="font-family: 'Georgia', serif; font-size: 16px; color: #d4af37; margin-bottom: 15px; margin-top: 0;">Route & Chauffeur Details</h3>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50%;">Pickup Location</th>
                  <th style="width: 50%;">Dropoff Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color: #ffffff; line-height: 1.4; vertical-align: top; padding-right: 15px;">${ride.pickupLocation}</td>
                  <td style="color: #ffffff; line-height: 1.4; vertical-align: top;">${ride.dropoffLocation}</td>
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
                  <td style="color: #ffffff; line-height: 1.4; vertical-align: top; padding-right: 15px; font-weight: bold;">${ride.vehicleType}</td>
                  <td style="color: #8f9cae; line-height: 1.4; vertical-align: top; font-style: italic;">${ride.passengerDetails.specialInstructions || 'None'}</td>
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
                <span class="price-label" style="color: #ffffff; float: left;">Grand Total</span>
                <span class="price-value-total">${formattedAmount}</span>
              </div>
            </div>
            
            <p style="font-size: 11px; color: #5b687a; line-height: 1.6; margin-top: 25px; text-align: center;">
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Invoice sent for ride: ${ride._id}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to dispatch invoice email:', error);
    return false;
  }
};

/**
 * Generic reusable sendEmail helper
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"DMS Cab Services" <${smtpUser}>`,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('[GENERIC EMAIL ERROR]:', error);
    throw error;
  }
};

/**
 * Send secure Ride Start OTP to client
 */
exports.sendOtpEmail = async (ride, otp, driverName) => {
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
            background-color: #060a11;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #0a0f18;
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 12px;
            overflow: hidden;
          }
          .header {
            background-color: #060a11;
            padding: 30px;
            text-align: center;
            border-bottom: 2px solid #d4af37;
          }
          .header h1 {
            color: #d4af37;
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
            background-color: #060a11;
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #d4af37;
            margin: 0;
            font-family: monospace;
          }
          .warning {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            padding: 15px;
            color: #ef4444;
            font-size: 13px;
            margin-top: 20px;
            text-align: center;
          }
          .footer {
            background-color: #060a11;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #5b687a;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DMS Cab Services</h1>
          </div>
          <div class="content">
            <h2 style="font-family: 'Georgia', serif; color: #ffffff; margin-top: 0; font-size: 20px;">Your Ride Start OTP</h2>
            <p style="color: #8f9cae; font-size: 14px;">
              Hello ${ride.passengerDetails.fullName},<br><br>
              Chauffeur <strong>${driverName}</strong> has been assigned to your booking <strong>#RD-${bookingId}</strong>.
            </p>
            
            <div class="otp-box">
              <p style="color: #8f9cae; font-size: 12px; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 2px;">Verification Code</p>
              <h3 class="otp-code">${otp}</h3>
              <p style="color: #5b687a; font-size: 11px; margin: 10px 0 0;">Valid for 15 minutes</p>
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

    await exports.sendEmail({
      to,
      subject: `Ride Verification Code - DMS Cab Services`,
      html: htmlContent,
    });
    console.log(`[OTP EMAIL SUCCESS] Sent to client: ${to}`);
    return true;
  } catch (error) {
    console.error('[OTP EMAIL ERROR]:', error);
    return false;
  }
};

/**
 * Send inquiry detail email to admin/reservations email
 */
exports.sendInquiryEmail = async ({ firstName, lastName, email, phone, subject, message }) => {
  try {
    const to = `pritam.mondal@devqor.in, ${smtpUser}`;
    const fullName = `${firstName} ${lastName}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Inquiry - DMS Cab Services</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #060a11;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #0a0f18;
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 12px;
            overflow: hidden;
          }
          .header {
            background-color: #060a11;
            padding: 30px;
            text-align: center;
            border-bottom: 2px solid #d4af37;
          }
          .header h1 {
            color: #d4af37;
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
            background-color: #060a11;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 14px;
          }
          .info-table td.label {
            color: #8f9cae;
            font-weight: bold;
            width: 30%;
          }
          .info-table td.value {
            color: #ffffff;
          }
          .message-box {
            background-color: #060a11;
            border-left: 3px solid #d4af37;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
            color: #d3d3d3;
          }
          .footer {
            background-color: #060a11;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #5b687a;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DMS Cab Services</h1>
            <p style="color: #8f9cae; font-size: 11px; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 2px;">New Contact Inquiry</p>
          </div>
          <div class="content">
            <h2 style="font-family: 'Georgia', serif; color: #ffffff; margin-top: 0; font-size: 20px; text-align: center;">Inquiry Details</h2>
            
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

            <h3 style="font-family: 'Georgia', serif; color: #d4af37; font-size: 16px; margin-bottom: 10px;">Message:</h3>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Inquiry email sent to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send inquiry email:', error);
    return false;
  }
};
