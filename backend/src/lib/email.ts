import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await resend.emails.send({
    from: `RevendaGestor <${FROM}>`,
    to,
    subject: 'Redefinir sua senha - RevendaGestor',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 16px;">Redefinir senha</h2>
        <p style="color: #555; font-size: 15px;">Ola, <strong>${name}</strong>!</p>
        <p style="color: #555; font-size: 15px;">Voce solicitou a redefinicao da sua senha no RevendaGestor. Clique no botao abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #7c3aed; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
            Redefinir minha senha
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">Este link expira em <strong>1 hora</strong>.</p>
        <p style="color: #888; font-size: 13px;">Se voce nao solicitou esta alteracao, ignore este email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">RevendaGestor - Gestao inteligente para revendedoras</p>
      </div>
    `,
  })
}
