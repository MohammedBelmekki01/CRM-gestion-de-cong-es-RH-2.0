import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.warn(
      "[Email] SMTP non configuré, les e-mails ne seront pas envoyés.",
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    auth: { user, pass },
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const transporter = getTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Bienvenue dans l'entreprise",
    text: `Bonjour ${name},\n\nVotre compte a été créé avec succès !\n\nCordialement,\nL'équipe RH`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  tempPassword: string,
) {
  const transporter = getTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    text: `Bonjour,\n\nVotre mot de passe a été réinitialisé.\nNouveau mot de passe temporaire : ${tempPassword}\n\nVeuillez le changer dès votre prochaine connexion.\n\nCordialement,\nL'équipe RH`,
  });
}
