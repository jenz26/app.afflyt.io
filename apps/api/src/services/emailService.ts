/**
 * Email Service for Afflyt.io using Resend
 * Handles all email communications including magic links
 * 
 * @version 1.5.0
 * @phase Frontend-Backend Integration
 */

import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration constants
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@afflyt.io';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Afflyt Team';
const BASE_URL = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';

interface MagicLinkEmailData {
  email: string;
  token: string;
  locale?: string;
  returnUrl?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Generate magic link HTML template
 */
function generateMagicLinkTemplate(data: MagicLinkEmailData): { subject: string; html: string } {
  const { token, locale = 'it', returnUrl } = data;
  
  // Construct magic link URL
  const magicLinkUrl = `${BASE_URL}/${locale}/auth/verify?token=${token}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
  
  // Localized content
  const content = locale === 'it' ? {
    subject: '🔐 Il tuo link di accesso per Afflyt',
    greeting: 'Ciao!',
    intro: 'Hai richiesto di accedere al tuo account Afflyt. Clicca il pulsante qui sotto per entrare:',
    buttonText: 'Accedi ad Afflyt',
    altText: 'Oppure copia e incolla questo link nel tuo browser:',
    expiry: 'Questo link scadrà tra 30 minuti per motivi di sicurezza.',
    noRequest: 'Se non hai richiesto questo accesso, puoi ignorare questa email.',
    signature: 'Il Team Afflyt',
    tagline: 'Trasforma i tuoi link affiliati in una macchina di conversione'
  } : {
    subject: '🔐 Your Afflyt login link',
    greeting: 'Hello!',
    intro: 'You requested to sign in to your Afflyt account. Click the button below to continue:',
    buttonText: 'Sign in to Afflyt',
    altText: 'Or copy and paste this link in your browser:',
    expiry: 'This link will expire in 30 minutes for security reasons.',
    noRequest: 'If you didn\'t request this, you can safely ignore this email.',
    signature: 'The Afflyt Team',
    tagline: 'Transform your affiliate links into a conversion machine'
  };

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.subject}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6);
            border-radius: 12px;
            font-size: 24px;
            font-weight: bold;
            text-decoration: none;
            color: white;
            margin-bottom: 16px;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 40px;
            text-align: center;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #ffffff;
        }
        .intro {
            font-size: 16px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 32px;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 32px;
            transition: all 0.3s ease;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3);
        }
        .alt-link {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 24px;
        }
        .magic-link {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 12px;
            color: #60a5fa;
            word-break: break-all;
            margin-bottom: 24px;
        }
        .expiry {
            font-size: 14px;
            color: #fbbf24;
            margin-bottom: 16px;
        }
        .disclaimer {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 32px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .signature {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
        }
        .tagline {
            font-size: 14px;
            color: #94a3b8;
        }
        .sparkle {
            display: inline-block;
            animation: sparkle 2s ease-in-out infinite;
        }
        @keyframes sparkle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 20px 16px;
            }
            .card {
                padding: 24px;
            }
            .greeting {
                font-size: 20px;
            }
            .intro {
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <span class="sparkle">⚡</span> Afflyt
            </div>
        </div>
        
        <div class="card">
            <div class="greeting">${content.greeting}</div>
            
            <div class="intro">
                ${content.intro}
            </div>
            
            <a href="${magicLinkUrl}" class="button">
                ${content.buttonText}
            </a>
            
            <div class="alt-link">
                ${content.altText}
            </div>
            
            <div class="magic-link">
                ${magicLinkUrl}
            </div>
            
            <div class="expiry">
                ⏰ ${content.expiry}
            </div>
            
            <div class="disclaimer">
                ${content.noRequest}
            </div>
        </div>
        
        <div class="footer">
            <div class="signature">
                ${content.signature}
            </div>
            <div class="tagline">
                ${content.tagline}
            </div>
        </div>
    </div>
</body>
</html>
  `;

  return { subject: content.subject, html };
}

/**
 * Send magic link email via Resend
 */
export async function sendMagicLinkEmail(data: MagicLinkEmailData): Promise<EmailResponse> {
  try {
    // Validate required fields
    if (!data.email || !data.token) {
      return {
        success: false,
        error: 'Email and token are required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Invalid email format'
      };
    }

    // Generate email template
    const { subject, html } = generateMagicLinkTemplate(data);

    // Send email via Resend
    const { data: resendData, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.email],
      subject,
      html,
      // Add tags for analytics
      tags: [
        { name: 'category', value: 'authentication' },
        { name: 'type', value: 'magic-link' },
        { name: 'locale', value: data.locale || 'it' }
      ]
    });

    if (error) {
      console.error('Resend API Error:', error);
      return {
        success: false,
        error: `Failed to send email: ${error.message || 'Unknown error'}`
      };
    }

    console.log('Magic link email sent successfully:', {
      messageId: resendData?.id,
      email: data.email,
      locale: data.locale
    });

    return {
      success: true,
      messageId: resendData?.id
    };

  } catch (error) {
    console.error('Email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send welcome email for new users
 */
export async function sendWelcomeEmail(email: string, locale: string = 'it'): Promise<EmailResponse> {
  try {
    const content = locale === 'it' ? {
      subject: '🎉 Benvenuto in Afflyt!',
      greeting: 'Benvenuto in Afflyt!',
      intro: 'Siamo entusiasti di averti a bordo! La tua piattaforma per trasformare i link affiliati in una macchina di conversione è pronta.',
      features: [
        'Tracciamento avanzato dei click e conversioni',
        'Dashboard analytics in tempo reale',
        'Gestione centralizzata dei link affiliati',
        'Automazione multi-canale (presto disponibile)'
      ],
      cta: 'Inizia subito',
      signature: 'Il Team Afflyt'
    } : {
      subject: '🎉 Welcome to Afflyt!',
      greeting: 'Welcome to Afflyt!',
      intro: 'We\'re excited to have you on board! Your platform to transform affiliate links into a conversion machine is ready.',
      features: [
        'Advanced click and conversion tracking',
        'Real-time analytics dashboard',
        'Centralized affiliate link management',
        'Multi-channel automation (coming soon)'
      ],
      cta: 'Get Started',
      signature: 'The Afflyt Team'
    };

    const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.subject}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; text-align: center; }
        .logo { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6); border-radius: 12px; font-size: 24px; font-weight: bold; color: white; margin-bottom: 24px; }
        .greeting { font-size: 28px; font-weight: 600; margin-bottom: 24px; }
        .intro { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 32px; }
        .features { text-align: left; margin: 32px 0; }
        .feature { display: flex; align-items: center; margin-bottom: 16px; font-size: 15px; color: #e2e8f0; }
        .feature::before { content: '✅'; margin-right: 12px; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">⚡ Afflyt</div>
            <div class="greeting">${content.greeting}</div>
            <div class="intro">${content.intro}</div>
            <div class="features">
                ${content.features.map(feature => `<div class="feature">${feature}</div>`).join('')}
            </div>
            <a href="${BASE_URL}/${locale}/dashboard" class="button">${content.cta}</a>
            <div style="margin-top: 32px; font-size: 16px; font-weight: 600;">${content.signature}</div>
        </div>
    </div>
</body>
</html>
    `;

    const { data: resendData, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: content.subject,
      html,
      tags: [
        { name: 'category', value: 'onboarding' },
        { name: 'type', value: 'welcome' },
        { name: 'locale', value: locale }
      ]
    });

    if (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: resendData?.id };

  } catch (error) {
    console.error('Welcome email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test email service connection
 */
export async function testEmailService(): Promise<EmailResponse> {
  try {
    // Send a test email to verify Resend configuration
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: ['test@afflyt.io'], // Replace with your test email
      subject: '🧪 Afflyt Email Service Test',
      html: '<p>Email service is working correctly!</p>',
      tags: [{ name: 'type', value: 'test' }]
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    };
  }
}

// Export types for use in controllers
export type { EmailResponse, MagicLinkEmailData };