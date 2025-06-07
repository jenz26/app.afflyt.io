import { Request, Response } from 'express';
import { Models } from '../models';
import { CreateSupportTicketRequest, SupportTicketResponse } from '../types';
import { logUtils, createModuleLogger } from '../config/logger';
// import { emailService } from '../services/emailService'; // TODO: Implement email service methods

// Create module-specific logger
const supportControllerLogger = createModuleLogger('support-controller');

export const createSupportController = (models: Models) => {
  return {
    /**
     * Create a new support ticket
     * POST /api/support/ticket
     */
    createTicket: async (req: Request, res: Response): Promise<Response> => {
      const startTime = Date.now();
      
      // Get client IP address for security/spam tracking
      const ipAddress = req.ip || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress ||
                       (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                       'unknown';

      supportControllerLogger.info({
        ipAddress,
        userAgent: req.headers['user-agent'],
        requestBody: {
          email: req.body.email,
          subject: req.body.subject,
          name: req.body.name,
          userId: req.body.userId,
          hasMessage: !!req.body.message,
          messageLength: req.body.message?.length || 0
        }
      }, 'Creating support ticket - request received');

      try {
        const ticketData: CreateSupportTicketRequest = req.body;

        // ===== 1. CREATE TICKET IN DATABASE =====
        const supportTicket = await models.supportTicket.create(ticketData, ipAddress);
        
        supportControllerLogger.info({
          ticketId: supportTicket.id,
          ticketNumber: supportTicket.ticketNumber,
          email: ticketData.email,
          subject: ticketData.subject,
          priority: supportTicket.priority,
          userId: ticketData.userId
        }, 'Support ticket created in database');

        // ===== 2. SEND EMAIL NOTIFICATION TO SUPPORT TEAM =====
        try {
          // TODO: Implement email service methods
          // await emailService.sendSupportTicketNotification({
          //   ticketNumber: supportTicket.ticketNumber,
          //   customerName: ticketData.name,
          //   customerEmail: ticketData.email,
          //   subject: ticketData.subject,
          //   message: ticketData.message,
          //   priority: supportTicket.priority,
          //   userId: ticketData.userId,
          //   userAgent: ticketData.userAgent,
          //   url: ticketData.url,
          //   ipAddress
          // });

          supportControllerLogger.info({
            ticketNumber: supportTicket.ticketNumber,
            email: ticketData.email
          }, 'Support team notification email would be sent here (TODO: implement emailService)');

        } catch (emailError) {
          // Log email error but don't fail the request
          supportControllerLogger.error({
            error: emailError,
            ticketNumber: supportTicket.ticketNumber,
            email: ticketData.email
          }, 'Failed to send support team notification email');
          
          logUtils.database.error('supportEmailNotification', emailError);
        }

        // ===== 3. SEND CONFIRMATION EMAIL TO CUSTOMER =====
        try {
          // TODO: Implement email service methods
          supportControllerLogger.info({
            ticketNumber: supportTicket.ticketNumber,
            email: ticketData.email
          }, 'Customer confirmation email would be sent here (TODO: implement emailService)');

        } catch (emailError) {
          supportControllerLogger.error({
            error: emailError,
            ticketNumber: supportTicket.ticketNumber,
            email: ticketData.email
          }, 'Failed to send customer confirmation email');
          
          logUtils.database.error('supportConfirmationEmail', emailError);
        }

        // ===== 4. PREPARE RESPONSE =====
        const responseData: SupportTicketResponse = {
          id: supportTicket.id,
          ticketNumber: supportTicket.ticketNumber,
          name: supportTicket.name,
          email: supportTicket.email,
          subject: supportTicket.subject,
          message: supportTicket.message,
          status: supportTicket.status,
          priority: supportTicket.priority,
          submittedAt: supportTicket.submittedAt.toISOString(),
          userId: supportTicket.userId
        };

        const duration = Date.now() - startTime;
        
        supportControllerLogger.info({
          ticketId: supportTicket.id,
          ticketNumber: supportTicket.ticketNumber,
          email: ticketData.email,
          subject: ticketData.subject,
          duration,
          ipAddress
        }, 'Support ticket creation completed successfully');

        // Performance monitoring
        logUtils.performance.slowQuery('createSupportTicket', duration, 5000);

        return res.status(201).json({
          success: true,
          data: responseData,
          message: 'Support ticket created successfully',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        
        supportControllerLogger.error({
          error,
          requestData: {
            email: req.body.email,
            subject: req.body.subject,
            name: req.body.name,
            userId: req.body.userId
          },
          ipAddress,
          duration
        }, 'Failed to create support ticket');

        logUtils.database.error('createSupportTicket', error);

        // Determine if it's a validation error or server error
        if (error instanceof Error) {
          if (error.message.includes('validation') || error.message.includes('required')) {
            return res.status(400).json({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
          
          if (error.message.includes('unique') || error.message.includes('duplicate')) {
            supportControllerLogger.warn({
              error: error.message,
              ipAddress
            }, 'Duplicate ticket attempt detected');
            
            return res.status(409).json({
              success: false,
              error: 'A similar ticket was recently submitted',
              timestamp: new Date().toISOString()
            });
          }
        }

        return res.status(500).json({
          success: false,
          error: 'Failed to create support ticket',
          timestamp: new Date().toISOString()
        });
      }
    },

    /**
     * Get support ticket by ticket number (for customer lookup)
     * GET /api/support/ticket/:ticketNumber
     */
    getTicketByNumber: async (req: Request, res: Response): Promise<Response> => {
      const { ticketNumber } = req.params;
      
      // Validate ticket number parameter
      if (!ticketNumber) {
        return res.status(400).json({
          success: false,
          error: 'Ticket number is required',
          timestamp: new Date().toISOString()
        });
      }
      
      supportControllerLogger.debug({
        ticketNumber,
        ipAddress: req.ip
      }, 'Getting support ticket by number');

      try {
        const supportTicket = await models.supportTicket.findByTicketNumber(ticketNumber);

        if (!supportTicket) {
          supportControllerLogger.warn({
            ticketNumber,
            ipAddress: req.ip
          }, 'Support ticket not found');
          
          return res.status(404).json({
            success: false,
            error: 'Support ticket not found',
            timestamp: new Date().toISOString()
          });
        }

        // Prepare public response (hide internal fields)
        const responseData: SupportTicketResponse = {
          id: supportTicket.id,
          ticketNumber: supportTicket.ticketNumber,
          name: supportTicket.name,
          email: supportTicket.email,
          subject: supportTicket.subject,
          message: supportTicket.message,
          status: supportTicket.status,
          priority: supportTicket.priority,
          submittedAt: supportTicket.submittedAt.toISOString(),
          userId: supportTicket.userId
        };

        supportControllerLogger.info({
          ticketNumber,
          ticketId: supportTicket.id,
          status: supportTicket.status,
          ipAddress: req.ip
        }, 'Support ticket retrieved successfully');

        return res.status(200).json({
          success: true,
          data: responseData,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        supportControllerLogger.error({
          error,
          ticketNumber,
          ipAddress: req.ip
        }, 'Failed to get support ticket');

        logUtils.database.error('getSupportTicket', error);
        
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve support ticket',
          timestamp: new Date().toISOString()
        });
      }
    },

    /**
     * Get support ticket statistics (for admin/monitoring)
     * GET /api/support/stats
     */
    getStats: async (req: Request, res: Response): Promise<Response> => {
      supportControllerLogger.debug({
        ipAddress: req.ip
      }, 'Getting support ticket statistics');

      try {
        const stats = await models.supportTicket.getStats();

        supportControllerLogger.info({
          stats: {
            total: stats.total,
            resolvedToday: stats.resolvedToday,
            averageResponseTimeHours: Math.round(stats.averageResponseTime * 100) / 100
          },
          ipAddress: req.ip
        }, 'Support ticket statistics retrieved');

        return res.status(200).json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        supportControllerLogger.error({
          error,
          ipAddress: req.ip
        }, 'Failed to get support ticket statistics');

        logUtils.database.error('getSupportTicketStats', error);
        
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve statistics',
          timestamp: new Date().toISOString()
        });
      }
    },

    /**
     * Health check for support system
     * GET /api/support/health
     */
    healthCheck: async (req: Request, res: Response): Promise<Response> => {
      try {
        // Test database connection
        await models.supportTicket.findById('health-check-test');
        
        const healthData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'healthy',
            emailService: 'not_implemented'
          }
        };

        supportControllerLogger.debug(healthData, 'Support system health check completed');

        return res.status(200).json({
          success: true,
          data: healthData,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        const healthData = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: (error as Error).message,
          services: {
            database: 'unhealthy',
            emailService: 'not_implemented'
          }
        };

        supportControllerLogger.error({
          error,
          healthData
        }, 'Support system health check failed');

        return res.status(500).json({
          success: false,
          data: healthData,
          timestamp: new Date().toISOString()
        });
      }
    }
  };
};