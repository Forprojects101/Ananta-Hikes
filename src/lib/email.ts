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

    // Done Email Verification

    const htmlTemplate = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <style>
    body {
      margin: 0;
      padding: 0;
    
      font-family: Arial, sans-serif;
      color: #334155;
    }

    .wrapper {
      width: 100%;
      padding: 30px 0;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
    }

    .header {
      background: #0f172a;
      text-align: center;
      padding: 28px 20px;
    }

    .logo {
      width: 80px;
      border-radius: 14px;
      margin-bottom: 10px;
    }

    .header-title {
      color: #ffffff;
      margin: 0;
      font-size: 18px;
    }

    .sub-title {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 5px;
    }

    .content {
      padding: 32px 28px;
    }

    .content p {
      font-size: 14px;
      line-height: 1.6;
      margin: 12px 0;
    }

    .code-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }

    .code-label {
      font-size: 11px;
      color: #64748b;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    .code {
      font-size: 30px;
      font-weight: bold;
      color: #16a34a;
      letter-spacing: 6px;
    }

    .footer {
      background: #f1f5f9;
      padding: 18px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="container">

      <!-- Header -->
      <div class="header">
        <img src="https://res.cloudinary.com/dunjk3dzt/image/upload/v1776183431/logo_ox4gir.png" alt="Logo"
          class="logo" />
        <h2 class="header-title">Email Verification</h2>
        <p class="sub-title">Confirm your account</p>
      </div>

      <!-- Content -->
      <div class="content">
        <p>Hello,</p>

        <p>
          Please use the code below to verify your email address.
        </p>

        <!-- Code -->
        <div class="code-box">
          <div class="code-label">VERIFICATION CODE</div>
          <div class="code">${code}</div>
        </div>

        <p>This code is valid for 5 minutes.</p>

        <p>
          If you did not request this, you can ignore this email.
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
      subject: " 𝐄𝐦𝐚𝐢𝐥 𝐕𝐞𝐫𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧 𝐂𝐨𝐝𝐞",
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
    addOns: string;
    date: string;
    participants: number;
    totalPrice: number;
  }

  // Done Booking Confirm 

): Promise<void> {
  try {
    const htmlTemplate = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
</head>

<body style="margin:0; padding:0; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#0f172a; padding:28px 20px;">
              <img src="https://res.cloudinary.com/dunjk3dzt/image/upload/v1776183431/logo_ox4gir.png" alt="Logo"
                style="width:80px; border-radius:14px; margin-bottom:12px;" />
              <h2 style="color:#ffffff; margin:0; font-size:20px; letter-spacing:0.5px;">
                Booking Confirmed
              </h2>
              <p style="color:#94a3b8; font-size:12px; margin-top:6px;">
                Your adventure starts here
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 28px; color:#334155;">

              <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6;">
                Thank you for booking with <strong>Ananta Hikes</strong>. Your reservation is confirmed.
              </p>
              <p style="margin:0 0 16px 0; font-size:13px; line-height:1.6; color:#64748b;">
                You will receive a notification once your booking is approved.
              </p>
              <!-- Booking Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc; border-radius:12px; padding:20px; margin:24px 0; border:1px solid #e2e8f0;">

                <!-- Reference -->
                <tr>
                  <td style="font-size:11px; color:#64748b; letter-spacing:1px; padding-bottom:6px; text-align:center;">
                    BOOKING REFERENCE
                  </td>
                </tr>

                <tr>
                  <td style="font-size:20px; font-weight:bold; color:#16a34a; padding-bottom:18px; text-align:center;">
                    ${bookingData.bookingId}
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #e2e8f0; padding-top:14px;">

                    <!-- Details -->
                    <table width="100%" style="font-size:14px;">

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Mountain</td>
                        <td align="right" style="font-weight:600;">${bookingData.mountainName}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Hike Type</td>
                        <td align="right" style="font-weight:600;">${bookingData.hikeType}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Add-ons</td>
                        <td align="right" style="font-weight:600;">${bookingData.addOns}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Date</td>
                        <td align="right" style="font-weight:600;">${bookingData.date}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Participants</td>
                        <td align="right" style="font-weight:600;">${bookingData.participants}</td>
                      </tr>

                      <tr>
                        <td style="padding:12px 0; font-weight:bold;">Total</td>
                        <td align="right" style="font-weight:bold; color:#0f172a;">
                          ₱${bookingData.totalPrice.toFixed(2)}
                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>

              </table>
                 <!-- Next Steps -->
              <p style="margin:20px 0 6px 0; font-size:14px; font-weight:bold; color:#0f172a;">
                Next Steps
              </p>

              <p style="margin:0; font-size:13px; color:#475569; line-height:1.6;">
                • Complete payment using your preferred method<br>
                • Receive trip and guide details after approval<br>
                • Take a screenshot of your reference number<br>
                • Prepare your hiking gear
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9; padding:18px; text-align:center; font-size:12px; color:#64748b;">
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
      subject: `⛰️ 𝐁𝐨𝐨𝐤𝐢𝐧𝐠 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝 - Ref: ${bookingData.bookingId}`,
      html: htmlTemplate,
      text: `Thank you for booking with Ananta Hikes!\n\nBooking Reference: ${bookingData.bookingId}\nMountain: ${bookingData.mountainName}\nHike Type: ${bookingData.hikeType}\nAdd-ons: ${bookingData.addOns}\nDate: ${bookingData.date}\nParticipants: ${bookingData.participants}\nTotal Price: ₱${bookingData.totalPrice.toFixed(2)}\n\nYour mountain journey awaits.`,
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

<body style="margin:0; padding:0; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#0f172a; padding:28px 20px;">
              <img src="https://res.cloudinary.com/dunjk3dzt/image/upload/v1776183431/logo_ox4gir.png" alt="Logo"
                style="width:80px; border-radius:14px; margin-bottom:12px;" />
              <h2 style="color:#ffffff; margin:0; font-size:20px;">
                Password Reset
              </h2>
              <p style="color:#94a3b8; font-size:12px; margin-top:6px;">
                Secure your account
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 28px; color:#334155;">

              <p style="font-size:14px; margin:0 0 12px 0;">Hello,</p>

              <p style="font-size:14px; line-height:1.6; margin:0 0 18px 0;">
                We received a request to reset your password. Use the code below to continue.
              </p>

              <!-- Code Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc; border-radius:12px; padding:20px; margin:24px 0; border:1px solid #e2e8f0; text-align:center;">

                <tr>
                  <td style="font-size:11px; color:#64748b; letter-spacing:1px; padding-bottom:8px;">
                    RESET CODE
                  </td>
                </tr>

                <tr>
                  <td style="font-size:30px; font-weight:bold; color:#16a34a; letter-spacing:6px;">
                    ${resetCode}
                  </td>
                </tr>

              </table>

              <!-- Button -->
              ${resetLink ? `
              <div style="text-align:center; margin:24px 0;">
                <a href="${resetLink}"
                  style="display:inline-block; background:#16a34a; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:10px; font-size:14px; font-weight:bold;">
                  Reset Password
                </a>
              </div>
              ` : ''}

              <p style="font-size:13px; color:#64748b; margin:0 0 6px 0;">
                This code expires in 1 hour.
              </p>

              <p style="font-size:13px; color:#64748b; margin:0;">
                If you did not request this, you can ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9; padding:18px; text-align:center; font-size:12px; color:#64748b;">
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
      subject: " 𝐏𝐚𝐬𝐬𝐰𝐨𝐫𝐝 𝐑𝐞𝐬𝐞𝐭 𝐑𝐞𝐪𝐮𝐞𝐬𝐭 ",
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
    addOns?: string;
    date: string;
    participants: number;
    totalPrice: number;
    customerName?: string;
  }
): Promise<void> {
  try {

    // Done Booking approval

    const htmlTemplate = `
   <!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0; padding:0; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#0f172a; padding:28px 20px;">
              <img src="https://res.cloudinary.com/dunjk3dzt/image/upload/v1776183431/logo_ox4gir.png" alt="Logo"
                style="width:80px; border-radius:14px; margin-bottom:10px;" />
              <h2 style="color:#ffffff; margin:0; font-size:18px;">
                Booking Approved
              </h2>
              <p style="color:#94a3b8; font-size:12px; margin-top:5px;">
                Your hike is confirmed
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 28px; color:#334155;">

              <p style="margin:0 0 10px 0; font-size:14px;">
                Hello ${bookingData.customerName || 'Hiker'},
              </p>

              <p style="margin:0 0 18px 0; font-size:14px; line-height:1.6;">
                Your booking has been approved and confirmed.
              </p>
              <!-- Booking Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc; border-radius:12px; padding:20px; border:1px solid #e2e8f0;">

                <!-- Reference -->
                <tr>
                  <td style="font-size:11px; color:#64748b; letter-spacing:1px; text-align:center;">
                    BOOKING REFERENCE
                  </td>
                </tr>

                <tr>
                  <td style="font-size:20px; font-weight:bold; color:#16a34a; text-align:center; padding:8px 0 16px 0;">
                    ${bookingData.referenceNumber || bookingData.bookingId}
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #e2e8f0; padding-top:12px;">

                    <!-- Details -->
                    <table width="100%" style="font-size:14px;">

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Mountain</td>
                        <td align="right" style="font-weight:600;">${bookingData.mountainName}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Hike Type</td>
                        <td align="right" style="font-weight:600;">${bookingData.hikeType}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Add-ons</td>
                        <td align="right" style="font-weight:600;">${bookingData.addOns}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Date</td>
                        <td align="right" style="font-weight:600;">${bookingData.date}</td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; color:#64748b;">Participants</td>
                        <td align="right" style="font-weight:600;">${bookingData.participants}</td>
                      </tr>

                      <tr>
                        <td style="padding:12px 0; font-weight:bold;">Total</td>
                        <td align="right" style="font-weight:bold; color:#0f172a;">
                          ₱${bookingData.totalPrice.toFixed(2)}
                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>

              </table>

              <p style="font-size:14px; line-height:1.6; margin:0;">
                Your mountain journey awaits.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9; padding:18px; text-align:center; font-size:12px; color:#64748b;">
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
      subject: `🎉 𝐘𝐨𝐮𝐫 𝐁𝐨𝐨𝐤𝐢𝐧𝐠 𝐢𝐬 𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝! - Ref: ${bookingData.referenceNumber || bookingData.bookingId}`,
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

// Done Booking approval
// Done password reset email
// Done Booking Confirm
// Done email verification