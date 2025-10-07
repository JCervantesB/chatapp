import { betterAuth } from "better-auth";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import { resetPasswordTemplate, welcomeEmailTemplate } from "./email-templates";

// Transportador de correo (Mailtrap u otro SMTP)
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!,
  port: parseInt(process.env.EMAIL_PORT || "0", 10),
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!,
  },
});

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: "🔐 Restablece tu contraseña",
        html: resetPasswordTemplate(url, user.email),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user }) => {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: "🎉 Bienvenido",
        html: welcomeEmailTemplate(user.email),
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // 1 día
  },

  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user" },
      banned: { type: "boolean", defaultValue: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session["session"];
export type User = typeof auth.$Infer.Session["user"];