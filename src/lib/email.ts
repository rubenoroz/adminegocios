import nodemailer from "nodemailer";

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail({ to, subject, html }: EmailOptions) {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.warn("SMTP not configured. Email not sent:", { to, subject });
            return;
        }

        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"Sistema Escolar" <noreply@school.com>',
                to,
                subject,
                html,
            });
            console.log("Email sent successfully to:", to);
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }
}

export const emailService = new EmailService();
