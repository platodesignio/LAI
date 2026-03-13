const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
const APP_NAME = "Laozi AI";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 48px auto; padding: 0 24px; }
    .header { border-bottom: 1px solid #e5e5e5; padding-bottom: 24px; margin-bottom: 32px; }
    .wordmark { font-size: 16px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 16px; }
    p { font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 16px; }
    .cta { display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 8px 0 24px; }
    .link { color: #111; font-size: 13px; word-break: break-all; }
    .footer { border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 32px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="wordmark">${APP_NAME}</span>
    </div>
    ${content}
    <div class="footer">
      <p>You received this email from ${APP_NAME}. If you did not request this, you can ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

export function verificationEmailTemplate(token: string): {
  subject: string;
  html: string;
  text: string;
} {
  const url = `${APP_URL}/auth/verify?token=${token}`;
  const html = baseLayout(`
    <h1>Verify your email address</h1>
    <p>Click the link below to verify your account. This link expires in 24 hours.</p>
    <a href="${url}" class="cta">Verify email address</a>
    <p>Or copy this link into your browser:</p>
    <p class="link">${url}</p>
  `);
  const text = `Verify your email address\n\nClick the link below to verify your account. This link expires in 24 hours.\n\n${url}`;
  return { subject: "Verify your Laozi AI account", html, text };
}

export function passwordResetEmailTemplate(token: string): {
  subject: string;
  html: string;
  text: string;
} {
  const url = `${APP_URL}/auth/reset-password?token=${token}`;
  const html = baseLayout(`
    <h1>Reset your password</h1>
    <p>Someone requested a password reset for your account. Click the link below to set a new password. This link expires in 1 hour.</p>
    <a href="${url}" class="cta">Reset password</a>
    <p>Or copy this link into your browser:</p>
    <p class="link">${url}</p>
    <p>If you did not request a password reset, no action is needed. Your password has not been changed.</p>
  `);
  const text = `Reset your password\n\nSomeone requested a password reset for your account. Click the link below to set a new password. This link expires in 1 hour.\n\n${url}\n\nIf you did not request this, no action is needed.`;
  return { subject: "Reset your Laozi AI password", html, text };
}
