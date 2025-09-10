import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let name, email, organization, subject, message

  try {
    const data = await request.json()
    name = data.name
    email = data.email
    organization = data.organization
    subject = data.subject
    message = data.message

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.error('Missing required fields:', { name: !!name, email: !!email, subject: !!subject, message: !!message })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Processing contact form submission...')

    // Create formatted email content
    const emailContent = {
      to: 'tendertalesinc@gmail.com',
      subject: `[Tender Tales Contact] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Organization:</strong> ${organization || 'Not specified'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div>
          <strong>Message:</strong><br/>
          <p>${message.replace(/\n/g, '<br/>')}</p>
        </div>
        <hr>
        <p><small>This message was sent via the Tender Tales contact form.</small></p>
      `,
      text: `
New Contact Form Submission

From: ${name} (${email})
Organization: ${organization || 'Not specified'}
Subject: ${subject}

Message:
${message}

---
This message was sent via the Tender Tales contact form.
      `.trim()
    }

    console.log('Sending email via webhook...')

    // Use EmailJS or similar service webhook
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_ACCESS_KEY || 'demo', // You'll need to get this
        name: name,
        email: email,
        subject: `[Tender Tales Contact] ${subject}`,
        message: `
Organization: ${organization || 'Not specified'}

${message}

---
Contact Email: ${email}
        `.trim(),
        to: 'tendertalesinc@gmail.com'
      })
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`)
    }

    const result = await response.json()
    console.log('Email sent successfully via webhook:', result)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email via webhook:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Fallback: Log the contact form submission
    console.log('CONTACT FORM SUBMISSION (MANUAL PROCESSING NEEDED):', {
      name,
      email,
      organization,
      subject,
      message,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Failed to send email via webhook' },
      { status: 500 }
    )
  }
}
