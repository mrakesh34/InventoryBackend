const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
// Uses explicit host + port 587 (STARTTLS) instead of service:'gmail'
// because many cloud hosts (Render, Railway) block port 465 (SSL).
const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,       // true = port 465 (often blocked), false = port 587 + STARTTLS
        requireTLS: true,    // force STARTTLS upgrade
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
        connectionTimeout: 10000,  // 10s — fail fast with a clear error
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
};

// Send OTP email with a professional template
const sendOtpEmail = async (toEmail, otp) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Book Vault" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '🔐 Your Book Vault Verification Code',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
                <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">📚 Book Vault</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Email Verification</p>
                </div>
                <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #374151; font-size: 15px; margin: 0 0 20px;">Hi there! 👋</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
                        Use the verification code below to complete your Book Vault registration.
                        This code is valid for <strong>5 minutes</strong>.
                    </p>
                    <div style="background: #f0f9ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <p style="color: #1e293b; font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 0;">${otp}</p>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
                <div style="background: #f8fafc; padding: 16px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Book Vault — Inventory Management System</p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
