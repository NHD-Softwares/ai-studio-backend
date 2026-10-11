import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { env } from '../config/env.js';
import { resetPasswordTemplate, verificationEmailTemplate } from '../templates/auth.templates.js';

const transportOptions: SMTPTransport.Options & { family: 4 } = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  family: 4,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransport(transportOptions);

// Fail fast on boot if SMTP creds are wrong, instead of failing silently on first send
transporter.verify().catch((err) => {
  console.error('SMTP connection failed:', err);
});

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const sendEmail = async ({ to, subject, text, html }: SendEmailParams) => {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html: html ? html : `<p>${text}</p>`,
  });
};

const sendVerificationEmail = async ({ to, url }: { to: string; url: string }) => {
  await sendEmail({
    to,
    subject: 'Verify your email address',
    text: `Please verify your email by opening this link: ${url}`,
    html: verificationEmailTemplate(url),
  });
};

const sendResetPasswordEmail = async ({ to, url }: { to: string; url: string }) => {
  await sendEmail({
    to,
    subject: 'Reset your password',
    text: `Reset your password `,
    html: resetPasswordTemplate(url),
  });
};

export { sendEmail, sendVerificationEmail, sendResetPasswordEmail };
