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
/**
 * Enhanced Magic Link HTML Template for Afflyt.io
 * Modern dark theme with glassmorphism effects and professional styling
 */

function generateMagicLinkTemplate(data: MagicLinkEmailData): { subject: string; html: string } {
  const { token, locale = 'it', returnUrl } = data;
  
  // Construct magic link URL
  const magicLinkUrl = `${BASE_URL}/${locale}/auth/verify?token=${token}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
  
  // Localized content
  const content = locale === 'it' ? {
    subject: '🔐 Il tuo link di accesso sicuro per Afflyt',
    greeting: 'Ciao!',
    intro: 'Hai richiesto di accedere al tuo account Afflyt. Clicca il pulsante qui sotto per continuare in modo sicuro:',
    buttonText: '🚀 Accedi ad Afflyt',
    altText: 'Oppure copia e incolla questo link nel tuo browser:',
    expiry: 'Questo link scadrà tra 30 minuti per motivi di sicurezza.',
    noRequest: 'Se non hai richiesto questo accesso, puoi ignorare questa email in sicurezza.',
    signature: '💜 Il Team Afflyt',
    tagline: 'Trasforma i tuoi link affiliati in una macchina di conversione',
    securityNote: 'Per la tua sicurezza, questo link funziona solo una volta.'
  } : {
    subject: '🔐 Your secure Afflyt login link',
    greeting: 'Hello!',
    intro: 'You requested to sign in to your Afflyt account. Click the button below to continue securely:',
    buttonText: '🚀 Sign in to Afflyt',
    altText: 'Or copy and paste this link in your browser:',
    expiry: 'This link will expire in 30 minutes for security reasons.',
    noRequest: 'If you didn\'t request this, you can safely ignore this email.',
    signature: '💜 The Afflyt Team',
    tagline: 'Transform your affiliate links into a conversion machine',
    securityNote: 'For your security, this link works only once.'
  };

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.subject}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            color: #ffffff;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            min-height: 100vh;
        }
        
        /* Container and layout */
        .email-wrapper {
            width: 100%;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            padding: 20px 0;
            min-height: 100vh;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        /* Header styles */
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px 0;
        }
        
        .logo-container {
            display: inline-block;
            position: relative;
            margin-bottom: 16px;
        }
        
        .logo {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 16px 28px;
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%);
            border-radius: 16px;
            font-size: 28px;
            font-weight: 700;
            text-decoration: none;
            color: white;
            box-shadow: 
                0 8px 32px rgba(236, 72, 153, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            letter-spacing: -0.5px;
        }
        
        .logo:hover {
            transform: translateY(-2px);
            box-shadow: 
                0 12px 40px rgba(236, 72, 153, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.2);
        }
        
        .logo-icon {
            font-size: 32px;
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { 
                opacity: 1; 
                transform: scale(1);
            }
            50% { 
                opacity: 0.8; 
                transform: scale(1.05);
            }
        }
        
        .brand-tagline {
            font-size: 14px;
            color: #94a3b8;
            font-weight: 500;
            margin-top: 8px;
        }
        
        /* Main card styles */
        .card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 48px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
            box-shadow: 
                0 25px 50px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }
        
        /* Typography */
        .greeting {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #ffffff;
            letter-spacing: -0.5px;
        }
        
        .intro {
            font-size: 18px;
            line-height: 1.7;
            color: #cbd5e1;
            margin-bottom: 40px;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
        }
        
        /* Call-to-action button */
        .cta-container {
            margin: 40px 0;
        }
        
        .button {
            display: inline-block;
            padding: 18px 40px;
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 16px;
            font-weight: 700;
            font-size: 18px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 
                0 10px 30px rgba(236, 72, 153, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.1);
            letter-spacing: -0.3px;
            position: relative;
            overflow: hidden;
        }
        
        .button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }
        
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 
                0 15px 40px rgba(236, 72, 153, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.2);
        }
        
        .button:hover::before {
            left: 100%;
        }
        
        .button:active {
            transform: translateY(-1px);
        }
        
        /* Alternative link section */
        .alt-link-section {
            margin: 40px 0;
        }
        
        .alt-text {
            font-size: 15px;
            color: #94a3b8;
            margin-bottom: 16px;
            font-weight: 500;
        }
        
        .magic-link-container {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin: 16px 0;
            position: relative;
        }
        
        .magic-link {
            font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 13px;
            color: #60a5fa;
            word-break: break-all;
            line-height: 1.5;
            background: rgba(96, 165, 250, 0.1);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid rgba(96, 165, 250, 0.2);
        }
        
        .copy-hint {
            font-size: 12px;
            color: #64748b;
            margin-top: 8px;
            font-style: italic;
        }
        
        /* Security and info sections */
        .security-section {
            margin: 32px 0;
            padding: 20px;
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.2);
            border-radius: 12px;
        }
        
        .expiry {
            font-size: 15px;
            color: #fbbf24;
            margin-bottom: 8px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .security-note {
            font-size: 13px;
            color: #94a3b8;
            font-weight: 500;
        }
        
        .disclaimer {
            font-size: 14px;
            color: #94a3b8;
            margin: 24px 0;
            padding: 16px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 8px;
            border-left: 3px solid rgba(156, 163, 175, 0.3);
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 48px;
            padding-top: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .signature {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
        }
        
        .footer-tagline {
            font-size: 15px;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 16px;
        }
        
        .social-links {
            margin-top: 24px;
        }
        
        .social-link {
            display: inline-block;
            margin: 0 8px;
            padding: 8px;
            color: #64748b;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .social-link:hover {
            color: #ec4899;
            transform: translateY(-1px);
        }
        
        /* Responsive design */
        @media only screen and (max-width: 600px) {
            .container {
                padding: 20px 16px;
            }
            
            .card {
                padding: 32px 24px;
                border-radius: 20px;
            }
            
            .greeting {
                font-size: 26px;
            }
            
            .intro {
                font-size: 16px;
            }
            
            .button {
                padding: 16px 32px;
                font-size: 16px;
                border-radius: 14px;
            }
            
            .logo {
                padding: 14px 24px;
                font-size: 24px;
                border-radius: 14px;
            }
            
            .logo-icon {
                font-size: 28px;
            }
            
            .magic-link {
                font-size: 12px;
            }
        }
        
        /* Dark mode optimizations */
        @media (prefers-color-scheme: dark) {
            .card {
                background: rgba(255, 255, 255, 0.04);
                border-color: rgba(255, 255, 255, 0.1);
            }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .card {
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .button {
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .logo-icon {
                animation: none;
            }
            
            .button {
                transition: none;
            }
            
            .button::before {
                display: none;
            }
        }
        
        /* Print styles */
        @media print {
            body {
                background: white !important;
                color: black !important;
            }
            
            .card {
                background: white !important;
                border: 2px solid #000 !important;
                box-shadow: none !important;
            }
            
            .button {
                background: #000 !important;
                color: white !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <!-- Header with Logo -->
            <div class="header">
                <div class="logo-container">
                    <div class="logo">
                        <span class="logo-icon">⚡</span>
                        <span>Afflyt</span>
                    </div>
                </div>
                <div class="brand-tagline">${content.tagline}</div>
            </div>
            
            <!-- Main Content Card -->
            <div class="card">
                <!-- Greeting -->
                <div class="greeting">${content.greeting}</div>
                
                <!-- Introduction Text -->
                <div class="intro">
                    ${content.intro}
                </div>
                
                <!-- Call-to-Action Button -->
                <div class="cta-container">
                    <a href="${magicLinkUrl}" class="button" style="color: white; text-decoration: none;">
                        ${content.buttonText}
                    </a>
                </div>
                
                <!-- Alternative Link Section -->
                <div class="alt-link-section">
                    <div class="alt-text">
                        ${content.altText}
                    </div>
                    
                    <div class="magic-link-container">
                        <div class="magic-link">
                            ${magicLinkUrl}
                        </div>
                        <div class="copy-hint">
                            💡 ${locale === 'it' ? 'Seleziona tutto il testo e copialo' : 'Select all text and copy it'}
                        </div>
                    </div>
                </div>
                
                <!-- Security Information -->
                <div class="security-section">
                    <div class="expiry">
                        <span>⏰</span>
                        <span>${content.expiry}</span>
                    </div>
                    <div class="security-note">
                        🔒 ${content.securityNote}
                    </div>
                </div>
                
                <!-- Disclaimer -->
                <div class="disclaimer">
                    ${content.noRequest}
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="signature">
                    ${content.signature}
                </div>
                <div class="footer-tagline">
                    ${content.tagline}
                </div>
                
                <!-- Social Links (Optional) -->
                <div class="social-links">
                    <a href="#" class="social-link" style="color: #64748b; text-decoration: none;">📧</a>
                    <a href="#" class="social-link" style="color: #64748b; text-decoration: none;">🐦</a>
                    <a href="#" class="social-link" style="color: #64748b; text-decoration: none;">💼</a>
                </div>
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