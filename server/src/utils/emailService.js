import nodemailer from 'nodemailer';

const APP_NAME = process.env.APP_NAME || 'Deep-detect & Deep-shield';

// ─── Create transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Send OTP email ────────────────────────────────────────────────────────────
export async function sendOTPEmail(email, otp, purpose = 'verification') {
  const subjects = {
    verification: `${APP_NAME} – Email Verification Code`,
    profile_change: `${APP_NAME} – Confirm Profile Update`,
    password_reset: `${APP_NAME} – Password Reset Code`,
  };

  const titles = {
    verification: 'Verify your email address',
    profile_change: 'Confirm your profile change',
    password_reset: 'Reset your password',
  };

  const descriptions = {
    verification: 'You recently signed up. Use the code below to verify your email address.',
    profile_change: 'You requested a profile update. Use the code below to confirm the change.',
    password_reset: 'You requested a password reset. Use the code below to proceed.',
  };

  const subject = subjects[purpose] || subjects.verification;
  const title = titles[purpose] || titles.verification;
  const description = descriptions[purpose] || descriptions.verification;

  const html = buildOTPEmailHTML({ otp, title, description });

  const info = await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    html,
  });

  return info;
}

// ─── HTML template ─────────────────────────────────────────────────────────────
function buildOTPEmailHTML({ otp, title, description }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:8px;overflow:hidden;
                       box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:#4f46e5;padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                      ${APP_NAME}
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">${title}</h2>
                    <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
                      ${description}
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#f9fafb;border:2px dashed #e5e7eb;
                                border-radius:8px;padding:24px;text-align:center;
                                margin-bottom:32px;">
                      <span style="font-size:40px;font-weight:800;
                                   letter-spacing:12px;color:#4f46e5;">
                        ${otp}
                      </span>
                    </div>

                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                      This code expires in <strong>10 minutes</strong>. 
                      Do not share it with anyone.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 32px;
                             border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}