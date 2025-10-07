export function resetPasswordTemplate(url: string, email: string) {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Restablecer contraseña</h2>
      <p>Has solicitado restablecer la contraseña para: <strong>${email}</strong></p>
      <p>Haz clic en el siguiente enlace para continuar:</p>
      <p><a href="${url}" target="_blank" rel="noopener noreferrer">Restablecer contraseña</a></p>
      <p>Si no solicitaste esto, ignora este correo.</p>
    </div>
  `;
}

export function welcomeEmailTemplate(email: string) {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>¡Bienvenido!</h2>
      <p>Tu cuenta <strong>${email}</strong> ha sido creada correctamente.</p>
      <p>Puedes iniciar sesión y comenzar a usar la aplicación.</p>
    </div>
  `;
}