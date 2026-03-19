import nodemailer from 'nodemailer';

// Email provider configuration - fallback order: gmail -> brevo
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'gmail'; // 'gmail' or 'brevo'

// TEST MODE: Override email untuk testing
const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_EMAIL = process.env.TEST_EMAIL || '18224066@mahasiswa.itb.ac.id';

/**
 * Send OTP email via Brevo (formerly Sendinblue)
 */
async function sendViaBrevo(targetEmail: string, otpCode: string, originalEmail: string) {
  const emailData = {
    sender: {
      name: 'Pemilu 8EH Radio ITB 2026',
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@example.com'
    },
    to: [{ email: targetEmail }],
    subject: 'Kode OTP - Pemilu App',
    textContent: `Kode OTP Anda adalah: ${otpCode}. Kode ini berlaku selama 10 menit.${TEST_MODE ? `\n\n[TEST MODE] Email asli: ${originalEmail}` : ''}`,
    htmlContent: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Verifikasi Login</h2>
        <p>Kode OTP Anda adalah: <strong>${otpCode}</strong></p>
        <p>Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.</p>
        ${TEST_MODE ? `<p style="color: #666; font-size: 12px; margin-top: 20px;">[TEST MODE] Email tujuan asli: ${originalEmail}</p>` : ''}
      </div>
    `
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
      'content-type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  console.log(`Email sent successfully via Brevo to ${targetEmail}:`, result.messageId);
  return result;
}

/**
 * Send OTP email via Gmail (using nodemailer)
 */
async function sendViaGmail(targetEmail: string, otpCode: string, originalEmail: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: {
      name: 'Pemilu 8EH Radio ITB 2026',
      address: process.env.GMAIL_EMAIL || 'noreply@example.com'
    },
    to: targetEmail,
    subject: 'Kode OTP - Pemilu App',
    text: `Kode OTP Anda adalah: ${otpCode}. Kode ini berlaku selama 10 menit.${TEST_MODE ? `\n\n[TEST MODE] Email asli: ${originalEmail}` : ''}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Verifikasi Login</h2>
        <p>Kode OTP Anda adalah: <strong>${otpCode}</strong></p>
        <p>Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.</p>
        ${TEST_MODE ? `<p style="color: #666; font-size: 12px; margin-top: 20px;">[TEST MODE] Email tujuan asli: ${originalEmail}</p>` : ''}
      </div>
    `
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`Email sent successfully via Gmail to ${targetEmail}:`, result.messageId);
  return result;
}

/**
 * Main function to send OTP email
 * Fallback order: Gmail -> Brevo
 */
export const sendOTPContent = async (email: string, otpCode: string) => {
  // Override email jika dalam test mode
  const targetEmail = TEST_MODE ? TEST_EMAIL : email;
  
  const providers = ['gmail', 'brevo'];
  let lastError: Error | null = null;
  
  for (const provider of providers) {
    try {
      let result;
      
      switch (provider.toLowerCase()) {
        case 'gmail':
          console.log('Trying Gmail as email provider');
          result = await sendViaGmail(targetEmail, otpCode, email);
          break;
          
        case 'brevo':
          console.log('Trying Brevo as email provider');
          result = await sendViaBrevo(targetEmail, otpCode, email);
          break;
          
        default:
          continue;
      }
      
      if (TEST_MODE) {
        console.log(`[TEST MODE] Original recipient: ${email}`);
      }
      
      console.log(`Email sent successfully via ${provider}`);
      return result;
    } catch (error) {
      console.error(`Failed to send email via ${provider}:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      // Continue to next provider
    }
  }
  
  // If all providers failed
  throw new Error(`Failed to send email via all providers. Last error: ${lastError?.message || 'Unknown error'}`);
};

// Export for backward compatibility (not used anymore)
export const transporter = null;
