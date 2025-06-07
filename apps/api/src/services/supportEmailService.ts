/**
 * Support Email Service for Afflyt.io
 * Handles support ticket email communications using Resend
 * 
 * @version 1.8.7
 * @module SupportEmailService
 */

import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration constants
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@afflyt.io';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Afflyt Support';
const BASE_URL = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@afflyt.io'; // ✅ Configurabile

interface SupportEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ===== SUPPORT TICKET NOTIFICATION EMAIL =====

/**
 * Send notification to support team when new ticket is created
 */
export async function sendSupportTicketNotification(data: {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: 'technical' | 'billing' | 'feature' | 'account' | 'general';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string;
  userAgent?: string;
  url?: string;
  ipAddress?: string;
}): Promise<SupportEmailResponse> {
  try {
    const priorityConfig = {
      urgent: { emoji: '🔴', color: '#dc2626', bgColor: '#fecaca' },
      high: { emoji: '🟠', color: '#ea580c', bgColor: '#fed7aa' },
      medium: { emoji: '🟡', color: '#d97706', bgColor: '#fef3c7' },
      low: { emoji: '🟢', color: '#16a34a', bgColor: '#dcfce7' }
    };

    const subjectConfig = {
      technical: { emoji: '🔧', label: 'Supporto Tecnico' },
      billing: { emoji: '💳', label: 'Fatturazione' },
      feature: { emoji: '💡', label: 'Richiesta Funzionalità' },
      account: { emoji: '👤', label: 'Supporto Account' },
      general: { emoji: '❓', label: 'Supporto Generale' }
    };

    const priority = priorityConfig[data.priority];
    const subject = subjectConfig[data.subject];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nuovo Ticket di Supporto - ${data.ticketNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 8px 8px; font-size: 14px; text-align: center; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: ${priority.color}; background: ${priority.bgColor}; }
          .field { margin-bottom: 15px; }
          .label { font-weight: 600; color: #475569; display: block; margin-bottom: 5px; }
          .value { background: white; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .message-box { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #8B5CF6; margin: 15px 0; }
          .btn { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .metadata { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎫 Nuovo Ticket di Supporto</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${data.ticketNumber}</p>
          </div>
          
          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span class="priority-badge">
                ${priority.emoji} Priorità ${data.priority.toUpperCase()}
              </span>
              <span style="color: #64748b; font-size: 14px;">
                ${subject.emoji} ${subject.label}
              </span>
            </div>

            <div class="field">
              <span class="label">👤 Cliente:</span>
              <div class="value">${data.customerName}</div>
            </div>

            <div class="field">
              <span class="label">📧 Email:</span>
              <div class="value">
                <a href="mailto:${data.customerEmail}" style="color: #8B5CF6; text-decoration: none;">
                  ${data.customerEmail}
                </a>
              </div>
            </div>

            ${data.userId ? `
            <div class="field">
              <span class="label">🔑 User ID:</span>
              <div class="value"><code>${data.userId}</code></div>
            </div>
            ` : ''}

            <div class="field">
              <span class="label">💬 Messaggio:</span>
              <div class="message-box">
                ${data.message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${BASE_URL}/admin/support/${data.ticketNumber}" class="btn">
                Gestisci Ticket
              </a>
            </div>

            <div class="metadata">
              <strong>📊 Metadati Tecnici:</strong><br>
              <strong>IP:</strong> ${data.ipAddress || 'Non disponibile'}<br>
              <strong>User Agent:</strong> ${data.userAgent || 'Non disponibile'}<br>
              <strong>URL:</strong> ${data.url || 'Non disponibile'}<br>
              <strong>Timestamp:</strong> ${new Date().toLocaleString('it-IT')}
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">
              Afflyt Support System v1.8.7 • 
              <a href="${BASE_URL}/admin/support" style="color: #8B5CF6;">Dashboard Admin</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data: resendData, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [SUPPORT_EMAIL], // ✅ Email del team configurabile
      subject: `🎫 [${data.priority.toUpperCase()}] Nuovo Ticket #${data.ticketNumber} - ${subject.label}`,
      html: htmlContent,
      headers: {
        'X-Support-Ticket': data.ticketNumber,
        'X-Support-Priority': data.priority,
        'X-Support-Subject': data.subject
      },
      tags: [
        { name: 'category', value: 'support' },
        { name: 'type', value: 'notification' },
        { name: 'priority', value: data.priority }
      ]
    });

    if (error) {
      console.error('Support notification email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: resendData?.id };

  } catch (error) {
    console.error('Support email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===== CUSTOMER CONFIRMATION EMAIL =====

/**
 * Send confirmation email to customer when ticket is created
 */
export async function sendSupportTicketConfirmation(data: {
  customerEmail: string;
  customerName: string;
  ticketNumber: string;
  subject: 'technical' | 'billing' | 'feature' | 'account' | 'general';
  submittedAt: Date;
}): Promise<SupportEmailResponse> {
  try {
    const subjectLabels = {
      technical: '🔧 Supporto Tecnico',
      billing: '💳 Fatturazione',
      feature: '💡 Richiesta Funzionalità',
      account: '👤 Supporto Account',
      general: '❓ Supporto Generale'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Conferma Ticket di Supporto - ${data.ticketNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px 20px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
          .ticket-number { background: white; border: 2px solid #8B5CF6; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
          .btn { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
          .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 0 6px 6px 0; }
          .timeline { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .timeline-item { display: flex; align-items: center; margin: 10px 0; }
          .timeline-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 15px; }
          .timeline-dot.completed { background: #10b981; }
          .timeline-dot.pending { background: #d1d5db; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✅ Ticket Ricevuto!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
              La tua richiesta è stata registrata con successo
            </p>
          </div>
          
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 25px;">Ciao <strong>${data.customerName}</strong>,</p>
            
            <p>Grazie per averci contattato! Abbiamo ricevuto la tua richiesta di supporto e il nostro team la prenderà in carico il prima possibile.</p>

            <div class="ticket-number">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">IL TUO NUMERO TICKET</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #8B5CF6; font-family: monospace;">
                ${data.ticketNumber}
              </p>
              <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">
                Salva questo numero per verificare lo stato della richiesta
              </p>
            </div>

            <div class="info-box">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #059669;">📋 Dettagli della Richiesta</p>
              <p style="margin: 5px 0;"><strong>Categoria:</strong> ${subjectLabels[data.subject]}</p>
              <p style="margin: 5px 0;"><strong>Data invio:</strong> ${data.submittedAt.toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <div class="timeline">
              <p style="margin: 0 0 15px 0; font-weight: 600; color: #374151;">🕐 Stato del Ticket</p>
              <div class="timeline-item">
                <div class="timeline-dot completed"></div>
                <span>Ticket creato e ricevuto</span>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot pending"></div>
                <span>In attesa di assegnazione al team</span>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot pending"></div>
                <span>Analisi e risposta del supporto</span>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot pending"></div>
                <span>Risoluzione del problema</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/support?tab=lookup&ticket=${data.ticketNumber}" class="btn">
                🔍 Verifica Stato Ticket
              </a>
              <a href="${BASE_URL}/support?tab=contact" class="btn" style="background: #64748b;">
                📞 Contattaci Ancora
              </a>
            </div>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e40af;">⏱️ Tempi di Risposta</p>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li><strong>Supporto Generale:</strong> entro 24 ore</li>
                <li><strong>Problemi Tecnici:</strong> entro 4-8 ore</li>
                <li><strong>Bug Critici:</strong> entro 2-4 ore</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              Questo è un messaggio automatico. Per comunicazioni aggiuntive, 
              rispondi a questa email includendo il numero ticket.
            </p>
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Afflyt Team • <a href="${BASE_URL}" style="color: #8B5CF6;">afflyt.io</a> • 
              <a href="https://t.me/afflyt" style="color: #8B5CF6;">Community Telegram</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data: resendData, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.customerEmail],
      subject: `✅ Ticket #${data.ticketNumber} ricevuto - Ti risponderemo presto!`,
      html: htmlContent,
      headers: {
        'X-Support-Ticket': data.ticketNumber,
        'X-Support-Type': 'confirmation'
      },
      tags: [
        { name: 'category', value: 'support' },
        { name: 'type', value: 'confirmation' }
      ]
    });

    if (error) {
      console.error('Support confirmation email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: resendData?.id };

  } catch (error) {
    console.error('Support confirmation email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===== HEALTH CHECK =====

/**
 * Test support email service connection
 */
export async function testSupportEmailService(): Promise<SupportEmailResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [SUPPORT_EMAIL],
      subject: '🧪 Support Email Service Test',
      html: '<p>Support email service is working correctly!</p>',
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

// Export types
export type { SupportEmailResponse };