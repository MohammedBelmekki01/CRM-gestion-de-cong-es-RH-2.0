import nodemailer from "nodemailer";

export async function sendWelcomeEmail(email: string, name: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Bienvenue dans l'entreprise",
    text: `Bonjour ${name},\n\nVotre compte a été créé avec succès !`,
  });
}