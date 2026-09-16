const verificationEmailTemplate = (url: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="display: inline-block; background-color: #27272a; border-radius: 10px; width: 48px; height: 48px; line-height: 48px; text-align: center; color: #6366f1; font-weight: 700; font-size: 20px;">
                ❖
              </div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;">
                Verify your email address
              </h1>
            </td>
          </tr>

          <!-- Body Text -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 24px; color: #a1a1aa;">
                Thanks for getting started! Click the button below to confirm your email address and activate your account.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${url}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
                Verify Email Address
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="height: 1px; background-color: #27272a; width: 100%;"></div>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td align="left" style="padding-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <a href="${url}" style="font-size: 13px; color: #818cf8; text-decoration: underline; word-break: break-all;">
                ${url}
              </a>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td align="left">
              <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 18px;">
                If you didn't create an account, you can safely ignore this email.
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

const resetPasswordTemplate = (url: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="display: inline-block; background-color: #27272a; border-radius: 10px; width: 48px; height: 48px; line-height: 48px; text-align: center; color: #6366f1; font-weight: 700; font-size: 20px;">
                ❖
              </div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;">
                Reset your password
              </h1>
            </td>
          </tr>

          <!-- Body Text -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 24px; color: #a1a1aa;">
                We received a request to reset your password. Click the button below to choose a new password and regain access to your account.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${url}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
                Reset Password
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="height: 1px; background-color: #27272a; width: 100%;"></div>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td align="left" style="padding-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <a href="${url}" style="font-size: 13px; color: #818cf8; text-decoration: underline; word-break: break-all;">
                ${url}
              </a>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td align="left">
              <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 18px;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
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

export { verificationEmailTemplate, resetPasswordTemplate };
