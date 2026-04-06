import nodemailer from 'nodemailer';

let transporterPromise;
let transporterVerified = false;

const parseBoolean = (value) => String(value).toLowerCase() === 'true';

const getMailMode = () => {
  const explicitMode = process.env.EMAIL_MODE?.trim().toLowerCase();
  if (explicitMode) {
    return explicitMode;
  }

  const hasSmtpConfig = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
    .every((key) => Boolean(process.env[key]?.trim()));

  return hasSmtpConfig ? 'smtp' : 'console';
};

const validateSmtpConfig = () => {
  const requiredKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const presentKeys = requiredKeys.filter((key) => Boolean(process.env[key]?.trim()));

  if (presentKeys.length > 0 && presentKeys.length < requiredKeys.length) {
    throw new Error(
      `Incomplete SMTP configuration. Set ${requiredKeys.join(', ')} or use EMAIL_MODE=console for local development.`
    );
  }
};

const createSmtpTransporter = () => {
  validateSmtpConfig();

  const service = process.env.SMTP_SERVICE?.trim();
  const secure = parseBoolean(process.env.SMTP_SECURE);

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const createEtherealTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();

  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

const getTransporter = async () => {
  const mode = getMailMode();

  if (mode === 'console') {
    return { mode };
  }

  if (!transporterPromise) {
    transporterPromise = mode === 'ethereal'
      ? createEtherealTransporter()
      : Promise.resolve(createSmtpTransporter());
  }

  const transporter = await transporterPromise;

  if (!transporterVerified) {
    await transporter.verify();
    transporterVerified = true;
  }

  return { mode, transporter };
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const { mode, transporter } = await getTransporter();

  if (mode === 'console') {
    console.log(`Password reset requested for ${to}`);
    console.log(`Reset URL: ${resetUrl}`);

    return {
      mode,
      accepted: [to],
      rejected: []
    };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@kura.local';

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">Reset your Kura password</h2>
        <p>You requested a password reset. This link will expire in 15 minutes.</p>
        <p style="margin: 24px 0;">
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: linear-gradient(90deg, #4f46e5, #3b82f6); color: #ffffff; text-decoration: none; font-weight: 600;"
          >
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p style="word-break: break-all;">${resetUrl}</p>
      </div>
    `
  });

  const previewUrl = mode === 'ethereal' ? nodemailer.getTestMessageUrl(info) : null;

  if (previewUrl) {
    console.log(`Password reset preview: ${previewUrl}`);
  }

  if (Array.isArray(info.rejected) && info.rejected.length > 0) {
    throw new Error(`Password reset email was rejected for: ${info.rejected.join(', ')}`);
  }

  return {
    mode,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    messageId: info.messageId,
    previewUrl
  };
};
