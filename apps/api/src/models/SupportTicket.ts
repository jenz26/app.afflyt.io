import { Collection, Db, ObjectId } from 'mongodb';
import { SupportTicket, CreateSupportTicketRequest, SUPPORT_SUBJECTS } from '../types';
import { logUtils, createModuleLogger } from '../config/logger';
import { database } from '../config/database';
import crypto from 'crypto';

// Create module-specific logger
const supportTicketLogger = createModuleLogger('support-ticket');

export class SupportTicketModel {
  private collection: Collection<SupportTicket>;

  constructor(db: Db) {
    this.collection = db.collection<SupportTicket>('support_tickets');
    supportTicketLogger.debug('SupportTicketModel initialized');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.collection.createIndex({ ticketNumber: 1 }, { unique: true }),
        this.collection.createIndex({ id: 1 }, { unique: true }),
        this.collection.createIndex({ email: 1 }),
        this.collection.createIndex({ userId: 1 }),
        this.collection.createIndex({ status: 1 }),
        this.collection.createIndex({ priority: 1 }),
        this.collection.createIndex({ subject: 1 }),
        this.collection.createIndex({ submittedAt: -1 }),
        this.collection.createIndex({ assignedTo: 1 })
      ]);
      
      const duration = Date.now() - startTime;
      supportTicketLogger.info({ 
        duration,
        indexes: [
          'ticketNumber (unique)', 'id (unique)', 'email', 'userId',
          'status', 'priority', 'subject', 'submittedAt', 'assignedTo'
        ]
      }, 'Support ticket indexes created successfully');
      
      // Log performance if slow
      logUtils.performance.slowQuery('createSupportTicketIndexes', duration, 3000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      supportTicketLogger.error({ 
        error,
        duration,
        collection: 'support_tickets'
      }, 'Failed to create support ticket indexes');
      
      logUtils.database.error('createSupportTicketIndexes', error);
      throw error;
    }
  }

  async create(ticketData: CreateSupportTicketRequest, ipAddress?: string): Promise<SupportTicket> {
    const startTime = Date.now();
    const now = new Date();
    const maxRetries = 5;
    let attempt = 0;
    let generatedNumbers: string[] = [];

    supportTicketLogger.info({ 
      email: ticketData.email,
      subject: ticketData.subject,
      name: ticketData.name,
      userId: ticketData.userId,
      hasMessage: !!ticketData.message,
      messageLength: ticketData.message.length,
      ipAddress,
      maxRetries 
    }, 'Creating support ticket');

    return await database.monitoredOperation('support_tickets', 'create', async () => {
      while (attempt < maxRetries) {
        try {
          const ticketNumber = this.generateTicketNumber();
          generatedNumbers.push(ticketNumber);
          
          supportTicketLogger.debug({ 
            attempt: attempt + 1,
            ticketNumber,
            email: ticketData.email,
            subject: ticketData.subject 
          }, 'Attempting to create ticket with number');
          
          // Determine initial priority based on subject
          const priority = this.determinePriority(ticketData.subject);
          
          const supportTicket: SupportTicket = {
            id: crypto.randomUUID(),
            ticketNumber,
            userId: ticketData.userId,
            name: ticketData.name,
            email: ticketData.email,
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'open',
            priority,
            
            // Metadata
            userAgent: ticketData.userAgent,
            url: ticketData.url,
            ipAddress,
            
            // Timestamps  
            submittedAt: new Date(ticketData.timestamp),
            responseCount: 0,
            
            // Base document fields
            createdAt: now,
            updatedAt: now
          };

          const result = await this.collection.insertOne(supportTicket);
          const createdTicket = { ...supportTicket, _id: result.insertedId };
          
          // Log successful creation
          const duration = Date.now() - startTime;
          
          // Custom logging for support ticket creation
          supportTicketLogger.info({
            event: 'support_ticket_created',
            email: ticketData.email,
            ticketNumber: createdTicket.ticketNumber,
            subject: ticketData.subject,
            userId: ticketData.userId,
            priority: createdTicket.priority
          }, 'Support ticket created - custom event log');
          
          supportTicketLogger.info({ 
            ticketId: createdTicket.id,
            ticketNumber: createdTicket.ticketNumber,
            email: ticketData.email,
            subject: ticketData.subject,
            priority: createdTicket.priority,
            userId: ticketData.userId,
            attempts: attempt + 1,
            duration,
            generatedNumbers: generatedNumbers.length > 1 ? generatedNumbers : undefined
          }, 'Support ticket created successfully');
          
          return createdTicket;
          
        } catch (error: any) {
          // Handle MongoDB duplicate key error specifically
          if (error.code === 11000 && error.keyPattern?.ticketNumber) {
            attempt++;
            
            // Log ticket number collision
            supportTicketLogger.warn({ 
              attempt,
              maxRetries,
              ticketNumber: generatedNumbers[generatedNumbers.length - 1],
              email: ticketData.email,
              error: error.message
            }, 'Ticket number collision detected, retrying...');
            
            if (attempt >= maxRetries) {
              const duration = Date.now() - startTime;
              
              supportTicketLogger.error({ 
                maxRetries,
                attempts: attempt,
                generatedNumbers,
                email: ticketData.email,
                subject: ticketData.subject,
                duration,
                finalError: error.message
              }, 'Failed to generate unique ticket number after maximum attempts');
              
              logUtils.database.error('createSupportTicketNumberGeneration', error);
              throw new Error(`Failed to generate unique ticket number after ${maxRetries} attempts`);
            }
            
            continue;
          }
          
          // Log and re-throw other errors
          const duration = Date.now() - startTime;
          supportTicketLogger.error({ 
            error,
            email: ticketData.email,
            subject: ticketData.subject,
            attempt: attempt + 1,
            duration
          }, 'Unexpected error during support ticket creation');
          
          logUtils.database.error('createSupportTicket', error);
          throw error;
        }
      }
      
      // This should never be reached, but TypeScript safety
      throw new Error('Unexpected error in ticket number generation process');
    });
  }

  async findById(id: string): Promise<SupportTicket | null> {
    supportTicketLogger.debug({ ticketId: id }, 'Finding support ticket by ID');
    
    return await database.monitoredOperation('support_tickets', 'findById', async () => {
      const ticket = await this.collection.findOne({ id });
      
      supportTicketLogger.debug({ 
        ticketId: id, 
        found: !!ticket,
        ticketNumber: ticket?.ticketNumber,
        status: ticket?.status,
        email: ticket?.email
      }, 'Find by ID completed');
      
      return ticket;
    });
  }

  async findByTicketNumber(ticketNumber: string): Promise<SupportTicket | null> {
    supportTicketLogger.debug({ ticketNumber }, 'Finding support ticket by number');
    
    return await database.monitoredOperation('support_tickets', 'findByTicketNumber', async () => {
      const ticket = await this.collection.findOne({ ticketNumber });
      
      supportTicketLogger.debug({ 
        ticketNumber, 
        found: !!ticket,
        ticketId: ticket?.id,
        status: ticket?.status,
        email: ticket?.email
      }, 'Find by ticket number completed');
      
      return ticket;
    });
  }

  async findAll(options: {
    status?: SupportTicket['status'];
    priority?: SupportTicket['priority'];
    assignedTo?: string;
    subject?: SupportTicket['subject'];
    limit?: number;
    offset?: number;
    sortBy?: 'submittedAt' | 'status' | 'priority' | 'ticketNumber';
    sortOrder?: 'asc' | 'desc';
    search?: string;
  } = {}): Promise<{ tickets: SupportTicket[]; total: number }> {
    
    const {
      status,
      priority, 
      assignedTo,
      subject,
      limit = 20,
      offset = 0,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
      search
    } = options;

    supportTicketLogger.debug({ 
      status, priority, assignedTo, subject, limit, offset, sortBy, sortOrder, search 
    }, 'Finding all support tickets with filters');
    
    return await database.monitoredOperation('support_tickets', 'findAll', async () => {
      // Build filter
      const filter: any = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (subject) filter.subject = subject;
      
      // Add search functionality
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { ticketNumber: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [tickets, total] = await Promise.all([
        this.collection
          .find(filter)
          .sort(sort)
          .skip(offset)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(filter)
      ]);
      
      supportTicketLogger.info({ 
        filters: { status, priority, assignedTo, subject, search },
        found: tickets.length,
        total,
        limit,
        offset
      }, 'Find all tickets completed');
      
      return { tickets, total };
    });
  }

  async updateStatus(
    ticketId: string, 
    status: SupportTicket['status'],
    assignedTo?: string,
    internalNotes?: string
  ): Promise<SupportTicket | null> {
    
    supportTicketLogger.info({ 
      ticketId, 
      newStatus: status,
      assignedTo,
      hasInternalNotes: !!internalNotes
    }, 'Updating support ticket status');
    
    return await database.monitoredOperation('support_tickets', 'updateStatus', async () => {
      const updateFields: any = {
        status,
        updatedAt: new Date()
      };

      // Set timestamps based on status change
      if (status === 'resolved') {
        updateFields.resolvedAt = new Date();
      }
      
      if (assignedTo !== undefined) {
        updateFields.assignedTo = assignedTo;
      }
      
      if (internalNotes !== undefined) {
        updateFields.internalNotes = internalNotes;
      }

      const result = await this.collection.findOneAndUpdate(
        { id: ticketId },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
      
      if (result) {
        supportTicketLogger.info({ 
          ticketId,
          ticketNumber: result.ticketNumber,
          oldStatus: 'unknown', // We don't have old status here
          newStatus: status,
          assignedTo,
          email: result.email
        }, 'Support ticket status updated successfully');
        
        // Log specific status changes for analytics
        if (status === 'resolved') {
          supportTicketLogger.info({
            event: 'support_ticket_resolved',
            ticketNumber: result.ticketNumber,
            email: result.email,
            resolutionTime: result.resolvedAt ? 
              Math.round((result.resolvedAt.getTime() - result.submittedAt.getTime()) / (1000 * 60 * 60)) : 
              null
          }, 'Support ticket resolved - custom event log');
        }
      } else {
        supportTicketLogger.warn({ ticketId }, 'Status update found no matching ticket');
      }
      
      return result || null;
    });
  }

  async incrementResponseCount(ticketId: string): Promise<void> {
    supportTicketLogger.debug({ ticketId }, 'Incrementing response count');
    
    return await database.monitoredOperation('support_tickets', 'incrementResponseCount', async () => {
      const updateFields: any = {
        updatedAt: new Date()
      };

      // Set firstResponseAt if this is the first response
      const ticket = await this.findById(ticketId);
      if (ticket && !ticket.firstResponseAt) {
        updateFields.firstResponseAt = new Date();
      }

      const result = await this.collection.updateOne(
        { id: ticketId },
        { 
          $inc: { responseCount: 1 },
          $set: updateFields
        }
      );
      
      if (result.modifiedCount === 0) {
        supportTicketLogger.warn({ ticketId }, 'Response count increment found no matching ticket');
      } else {
        supportTicketLogger.debug({ 
          ticketId,
          isFirstResponse: !ticket?.firstResponseAt
        }, 'Response count incremented successfully');
      }
    });
  }

  // ✅ NEW METHOD: Find tickets by user ID - PROPERLY INTEGRATED
  async findByUserId(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      status?: SupportTicket['status'];
      sortBy?: 'submittedAt' | 'status' | 'priority';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<SupportTicket[]> {
    
    const {
      limit = 50,
      offset = 0,
      status,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = options;

    supportTicketLogger.debug({ 
      userId, 
      limit, 
      offset, 
      status, 
      sortBy, 
      sortOrder 
    }, 'Finding support tickets by user ID');

    return await database.monitoredOperation('support_tickets', 'findByUserId', async () => {
      // Build filter
      const filter: any = { userId };
      if (status) filter.status = status;

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const tickets = await this.collection
        .find(filter)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      supportTicketLogger.info({
        userId,
        found: tickets.length,
        filter: status ? { status } : 'all',
        limit,
        offset
      }, 'User tickets query completed');

      return tickets;
    });
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<SupportTicket['status'], number>;
    byPriority: Record<SupportTicket['priority'], number>;
    bySubject: Record<SupportTicket['subject'], number>;
    averageResponseTime: number; // in hours
    resolvedToday: number;
  }> {
    supportTicketLogger.debug('Getting support ticket statistics');
    
    return await database.monitoredOperation('support_tickets', 'getStats', async () => {
      const pipeline = [
        {
          $facet: {
            total: [{ $count: 'count' }],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            byPriority: [
              { $group: { _id: '$priority', count: { $sum: 1 } } }
            ],
            bySubject: [
              { $group: { _id: '$subject', count: { $sum: 1 } } }
            ],
            responseTime: [
              { 
                $match: { 
                  firstResponseAt: { $exists: true },
                  submittedAt: { $exists: true }
                }
              },
              {
                $project: {
                  responseTimeHours: {
                    $divide: [
                      { $subtract: ['$firstResponseAt', '$submittedAt'] },
                      1000 * 60 * 60 // Convert to hours
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  avgResponseTime: { $avg: '$responseTimeHours' }
                }
              }
            ],
            resolvedToday: [
              {
                $match: {
                  status: 'resolved',
                  resolvedAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                  }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ];

      const result = await this.collection.aggregate(pipeline).toArray();
      const data = result[0];

      // Handle case where no data is returned
      if (!data) {
        supportTicketLogger.warn('No data returned from stats aggregation');
        return {
          total: 0,
          byStatus: { open: 0, 'in-progress': 0, resolved: 0, closed: 0 },
          byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
          bySubject: { technical: 0, billing: 0, feature: 0, account: 0, general: 0 },
          averageResponseTime: 0,
          resolvedToday: 0
        };
      }

      const stats = {
        total: data.total[0]?.count || 0,
        byStatus: {
          open: 0,
          'in-progress': 0,
          resolved: 0,
          closed: 0
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        },
        bySubject: {
          technical: 0,
          billing: 0,
          feature: 0,
          account: 0,
          general: 0
        },
        averageResponseTime: data.responseTime[0]?.avgResponseTime || 0,
        resolvedToday: data.resolvedToday[0]?.count || 0
      };

      // Populate status counts
      if (data.byStatus && Array.isArray(data.byStatus)) {
        data.byStatus.forEach((item: any) => {
          if (item._id in stats.byStatus) {
            stats.byStatus[item._id as keyof typeof stats.byStatus] = item.count;
          }
        });
      }

      // Populate priority counts
      if (data.byPriority && Array.isArray(data.byPriority)) {
        data.byPriority.forEach((item: any) => {
          if (item._id in stats.byPriority) {
            stats.byPriority[item._id as keyof typeof stats.byPriority] = item.count;
          }
        });
      }

      // Populate subject counts
      if (data.bySubject && Array.isArray(data.bySubject)) {
        data.bySubject.forEach((item: any) => {
          if (item._id in stats.bySubject) {
            stats.bySubject[item._id as keyof typeof stats.bySubject] = item.count;
          }
        });
      }
      
      supportTicketLogger.info({ 
        stats: {
          total: stats.total,
          statusCounts: stats.byStatus,
          priorityCounts: stats.byPriority,
          avgResponseTimeHours: Math.round(stats.averageResponseTime * 100) / 100,
          resolvedToday: stats.resolvedToday
        }
      }, 'Support ticket statistics computed');
      
      return stats;
    });
  }

  private generateTicketNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const ticketNumber = `SUP-${year}-${dayOfYear.toString().padStart(3, '0')}${randomSuffix}`;
    
    supportTicketLogger.debug({ 
      ticketNumber,
      year,
      dayOfYear,
      randomSuffix
    }, 'Generated new ticket number');
    
    return ticketNumber;
  }

  private determinePriority(subject: SupportTicket['subject']): SupportTicket['priority'] {
    // Auto-assign priority based on subject
    switch (subject) {
      case 'technical':
        return 'high';
      case 'billing':
        return 'medium';
      case 'account':
        return 'medium';
      case 'feature':
        return 'low';
      case 'general':
      default:
        return 'low';
    }
  }
}