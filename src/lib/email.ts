import nodemailer from "nodemailer";

// Create Brevo transporter
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
  secure: false, // TLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

// Verify connection (optional but recommended)
transporter.verify((error, success) => {
  if (error) {
    console.error("Brevo SMTP connection error:", error);
  } else if (success) {
    console.log("Brevo SMTP connection successful");
  }
});

/**
 * Send verification email using Brevo SMTP
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  try {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, sans-serif;
      color: #333;
    }

    .wrapper {
      width: 100%;
      padding: 20px 0;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
    }

    .header {
      background: #111827;
      text-align: center;
      padding: 20px;
    }

    .logo {
      width: 100px;
      margin-bottom: 10px;
    }

    .header-title {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
    }

    .sub-title {
      color: #d1d5db;
      font-size: 13px;
      margin-top: 5px;
    }

    .content {
      padding: 30px;
    }

    .content p {
      font-size: 14px;
      line-height: 1.6;
      margin: 10px 0;
    }

    .code {
      font-size: 28px;
      font-weight: bold;
      color: #16a34a;
      text-align: center;
      letter-spacing: 6px;
      margin: 25px 0;
      padding: 15px;
      background: #f0fdf4;
      border-radius: 8px;
    }

    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="container">

      <!-- Header with Logo -->
      <div class="header">
        <img src="https://res.cloudinary.com/dunjk3dzt/image/upload/v1776183431/logo_ox4gir.png" alt="Logo" class="logo"  style="width:100px; border-radius:10px;" />
      </div>

      <!-- Content -->
      <div class="content">
        <p>Hello,</p>

        <p>
          Thank you for creating an account. Please use the verification code below to confirm your email address.
        </p>

        <div class="code">${code}</div>

        <p>This code is valid for 5 minutes.</p>

        <p>
          If you did not request this, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        © 2026 Ananta Hikes. All rights reserved.
      </div>

    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.BREVO_FROM_NAME} <${process.env.BREVO_FROM_EMAIL}>`,
      to: email,
      subject: "Email Verification Code - Hike Booking System",
      html: htmlTemplate,
      text: `Your verification code is: ${code}\n\nThis code will expire in 5 minutes.`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Verification code sent to ${email}:`, result.messageId);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send verification email to ${email}:`, error);
    throw error;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(
  email: string,
  bookingData: {
    bookingId: string;
    mountainName: string;
    hikeType: string;
    date: string;
    participants: number;
    totalPrice: number;
  }
): Promise<void> {
  try {
    const htmlTemplate = `
     <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>

<body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#111827; padding:20px;">
              <img src="https://res.cloudinary.com/dunjk3dzt/image/upload/v1776183431/logo_ox4gir.png"
                   alt="Logo"
                   style="width:90px; border-radius:12px; margin-bottom:10px;" />
              <h2 style="color:#ffffff; margin:0;">Booking Confirmed</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333;">

              <p style="margin:0 0 15px 0; font-size:14px;">
                Thank you for booking with Ananta Hikes. Your reservation has been successfully confirmed.
              </p>

              <!-- Booking Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; padding:15px; margin:20px 0;">

                <tr>
                  <td style="font-size:12px; color:#6b7280; padding-bottom:10px;">
                    BOOKING REFERENCE
                  </td>
                </tr>

                <tr>
                  <td style="font-size:18px; font-weight:bold; color:#16a34a; padding-bottom:15px;">
                    ${bookingData.bookingId}
                  </td>
                </tr>

                <!-- Details -->
                <tr>
                  <td>
                    <table width="100%" style="font-size:14px;">

                      <tr>
                        <td style="padding:8px 0;"><strong>Mountain:</strong></td>
                        <td align="right">${bookingData.mountainName}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;"><strong>Hike Type:</strong></td>
                        <td align="right">${bookingData.hikeType}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;"><strong>Date:</strong></td>
                        <td align="right">${bookingData.date}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;"><strong>Participants:</strong></td>
                        <td align="right">${bookingData.participants}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;"><strong>Total Price:</strong></td>
                        <td align="right">₱${bookingData.totalPrice.toFixed(2)}</td>
                      </tr>

                    </table>
                  </td>
                </tr>

              </table>

              <p style="font-size:14px;">
                We look forward to seeing you on the trail.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
              © 2026 Ananta Hikes. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.BREVO_FROM_NAME} <${process.env.BREVO_FROM_EMAIL}>`,
      to: email,
      subject: `Booking Confirmed - Reference: ${bookingData.bookingId}`,
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Booking confirmation sent to ${email}:`, result.messageId);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send booking confirmation to ${email}:`, error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetCode: string,
  resetLink?: string
): Promise<void> {
  try {
    const htmlTemplate = `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>

<body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#111827; padding:20px;">
              <img src="https://res.cloudinary.com/dunjk3dzt/image/upload/v1776183431/logo_ox4gir.png"
                   alt="Logo"
                   style="width:90px; border-radius:12px; margin-bottom:10px;" />
              <h2 style="color:#ffffff; margin:0;">Password Reset</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333;">

              <p style="font-size:14px;">Hello,</p>

              <p style="font-size:14px; line-height:1.6;">
                We received a request to reset your password. Use the code below to proceed.
              </p>

              <!-- Code -->
              <div style="font-size:28px; font-weight:bold; color:#16a34a; text-align:center; letter-spacing:6px; margin:25px 0; padding:15px; background:#f0fdf4; border-radius:8px;">
                ${resetCode}
              </div>

              <!-- Button -->
              ${resetLink ? `
              <div style="text-align:center; margin:20px 0;">
                <a href="${resetLink}"
                   style="background:#16a34a; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:8px; font-size:14px;">
                  Reset Password
                </a>
              </div>
              ` : ''}

              <p style="font-size:13px; color:#6b7280;">
                This code will expire in 1 hour.
              </p>

              <p style="font-size:13px; color:#6b7280;">
                If you did not request this, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
              © 2026 Ananta Hikes. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.BREVO_FROM_NAME} <${process.env.BREVO_FROM_EMAIL}>`,
      to: email,
      subject: "Password Reset Request - Hike Booking System",
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Password reset email sent to ${email}:`, result.messageId);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send password reset email to ${email}:`, error);
    throw error;
  }
}

/**
 * Send booking approval notification email
 */
export async function sendBookingApprovalEmail(
  email: string,
  bookingData: {
    bookingId: string;
    referenceNumber?: string;
    mountainName: string;
    hikeType: string;
    date: string;
    participants: number;
    totalPrice: number;
    customerName?: string;
  }
): Promise<void> {
  try {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; color: #222; margin: 0; }
            .container { max-width: 540px; margin: 32px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px 0 rgba(16,185,129,0.07); overflow: hidden; }
            .header { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 32px 24px 20px 24px; text-align: center; }
            .logo { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; }
            .logo-img { width: 44px; height: 44px; border-radius: 12px; background: #e6f4ea; display: flex; align-items: center; justify-content: center; }
            .logo-img img { width: 32px; height: 32px; display: block; }
            .brand { font-size: 1.7rem; font-weight: 700; color: #059669; letter-spacing: -1px; }
            .headline { font-size: 1.25rem; font-weight: 600; color: #222; margin: 0; }
            .content { padding: 28px 24px 18px 24px; }
            .success-badge { background: #e6f4ea; color: #059669; padding: 12px; border-radius: 8px; text-align: center; margin: 18px 0 18px 0; font-weight: 600; font-size: 15px; letter-spacing: 1px; }
            .details { background: #f9fafb; padding: 16px; border-radius: 10px; margin: 22px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: 500; color: #374151; }
            .value { color: #059669; font-weight: 500; }
            .reference { font-size: 18px; font-weight: bold; color: #10b981; padding: 10px; background: #f0fdf4; border-radius: 7px; margin-bottom: 8px; }
            .footer { background: #f6f8fa; margin-top: 0; padding: 24px 16px 12px 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center; border-radius: 0 0 18px 18px; }
            @media (max-width: 600px) {
              .container { border-radius: 0; margin: 0; }
              .header, .content, .footer { padding-left: 10px !important; padding-right: 10px !important; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="logo-img">
                  <img src="https://anantahikes.com/logo-email.png" alt="Ananta Hikes Logo" />
                </span>
                <span class="brand">Ananta Hikes</span>
              </div>
              <p class="headline">🎉 Your Booking is Approved!</p>
            </div>
            <div class="content">
              <p style="margin:0 0 8px 0; font-size:15px; color:#222;">Hello ${bookingData.customerName || 'Hiker'},</p>
              <p style="margin:0 0 18px 0; color:#444; font-size:15px;">Great news! Your hike booking has been approved and confirmed.</p>
              <div class="success-badge">✓ BOOKING APPROVED</div>
              <div class="details">
                <div style="margin-bottom: 10px; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Booking Reference</div>
                <div class="reference">${bookingData.referenceNumber || bookingData.bookingId}</div>
                <div style="margin-top: 14px;">
                  <div class="detail-row">
                    <span class="label">Mountain</span>
                    <span class="value">${bookingData.mountainName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Hike Type</span>
                    <span class="value">${bookingData.hikeType}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Date</span>
                    <span class="value">${bookingData.date}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Participants</span>
                    <span class="value">${bookingData.participants}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Total Amount</span>
                    <span class="value">₱${bookingData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <p style="color: #374151; line-height: 1.6; font-size:14px; margin: 18px 0 0 0;">
                <strong>Next Steps:</strong><br>
                • Check your email for any additional instructions from our tour guides<br>
                • Arrive 30 minutes before the scheduled date<br>
                • Bring your booking reference number<br>
                • Ensure you have appropriate hiking gear and weather protection
              </p>
              <p style="color: #374151; margin-top: 18px; font-size:14px;">
                If you have any questions or need to reschedule, please contact us immediately. We're excited to see you on the trail!
              </p>
            </div>
            <div class="footer">
              <p style="margin-bottom: 4px;">Ananta Hikes &mdash; Making mountain adventures accessible to everyone</p>
              <p style="margin:0;">&copy; 2026 Ananta Hikes. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `${process.env.BREVO_FROM_NAME} <${process.env.BREVO_FROM_EMAIL}>`,
      to: email,
      subject: `🎉 Your Booking is Approved! - Reference: ${bookingData.referenceNumber || bookingData.bookingId}`,
      html: htmlTemplate,
      text: `Your booking has been approved!\n\nBooking Reference: ${bookingData.referenceNumber || bookingData.bookingId}\nMountain: ${bookingData.mountainName}\nDate: ${bookingData.date}\nTotal Cost: ₱${bookingData.totalPrice.toFixed(2)}\n\nWe look forward to seeing you!`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Booking approval email sent to ${email}:`, result.messageId);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send booking approval email to ${email}:`, error);
    throw error;
  }
}
