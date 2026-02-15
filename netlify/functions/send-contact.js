import nodemailer from 'nodemailer'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { name, email, message } = JSON.parse(event.body || '{}')

    if (!name || !email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Täytä kaikki kentät' }) }
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Use envelope to set exact sender, avoid sender verify issues
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      envelope: {
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER,
      },
      replyTo: email,
      to: process.env.SMTP_USER,
      subject: `Yhteydenotto: ${name}`,
      text: `Nimi: ${name}\nSähköposti: ${email}\n\nViesti:\n${message}`,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('Email error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Viestin lähetys epäonnistui', message: err.message }),
    }
  }
}
