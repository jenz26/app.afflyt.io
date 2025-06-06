import { Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { DashboardLayoutItem } from '../types';
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendValidationError,
  sendInternalError
} from '../utils/responseHelpers';

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for dashboard operations
const dashboardLogger = createModuleLogger('dashboard');

export class DashboardController {
  constructor(private models: Models) {
    dashboardLogger.debug('DashboardController initialized');
  }

  // GET /api/user/dashboard-layout
  getDashboardLayout = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;

      dashboardLogger.debug({ userId: user.id }, 'Dashboard layout request started');

      const userSetting = await this.models.userSetting.findByUserId(user.id);

      // Se non esiste un layout, restituisci il layout di default
      const defaultLayout: DashboardLayoutItem[] = [
        { i: 'total-clicks', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
        { i: 'total-revenue', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
        { i: 'conversion-rate', x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
        { i: 'clicks-trend', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'revenue-trend', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'recent-links', x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 2 },
        { i: 'top-performing', x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 2 }
      ];

      const layout = userSetting?.dashboardLayout || defaultLayout;
      const isCustomLayout = !!userSetting?.dashboardLayout;

      const responseData = {
        layout
      };

      // Log successful layout retrieval
      dashboardLogger.info({ 
        userId: user.id, 
        layoutType: isCustomLayout ? 'custom' : 'default',
        widgetCount: layout.length 
      }, 'Dashboard layout retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/user/dashboard-layout', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      dashboardLogger.error({ error, duration }, 'Error fetching dashboard layout');
      logUtils.performance.requestEnd('GET', '/api/user/dashboard-layout', duration, 500);
      sendInternalError(res);
    }
  };

  // PUT /api/user/dashboard-layout
  updateDashboardLayout = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { layout } = req.body;

      dashboardLogger.debug({ 
        userId: user.id, 
        layoutLength: layout?.length,
        widgetIds: layout?.map((item: any) => item.i) 
      }, 'Dashboard layout update request started');

      if (!layout || !Array.isArray(layout)) {
        dashboardLogger.warn({ 
          userId: user.id, 
          layoutType: typeof layout 
        }, 'Dashboard layout update failed: invalid layout format');
        sendValidationError(res, 'Layout must be an array');
        return;
      }

      // Validazione del layout
      const isValidLayout = layout.every((item: any) => 
        typeof item === 'object' &&
        typeof item.i === 'string' &&
        typeof item.x === 'number' &&
        typeof item.y === 'number' &&
        typeof item.w === 'number' &&
        typeof item.h === 'number'
      );

      if (!isValidLayout) {
        dashboardLogger.warn({ 
          userId: user.id, 
          invalidItems: layout.filter((item: any) => 
            !item.i || typeof item.x !== 'number' || typeof item.y !== 'number' || typeof item.w !== 'number' || typeof item.h !== 'number'
          ).map((item: any) => item.i || 'unknown')
        }, 'Dashboard layout update failed: invalid item format');
        sendValidationError(res, 'Invalid layout format. Each item must have i, x, y, w, h properties');
        return;
      }

      // Widget ID validi
      const validWidgetIds = [
        'total-clicks',
        'total-revenue', 
        'conversion-rate',
        'clicks-trend',
        'revenue-trend',
        'recent-links',
        'top-performing',
        'geo-distribution',
        'device-distribution',
        'ai-insights'
      ];

      // Verifica che tutti i widget ID siano validi
      const invalidWidgets = layout.filter((item: any) => 
        !validWidgetIds.includes(item.i)
      ).map((item: any) => item.i);

      if (invalidWidgets.length > 0) {
        dashboardLogger.warn({ 
          userId: user.id, 
          invalidWidgets 
        }, 'Dashboard layout update failed: invalid widget IDs');
        sendValidationError(res, 'Invalid widget IDs found in layout');
        return;
      }

      // Salva il layout
      const userSetting = await this.models.userSetting.upsertDashboardLayout(
        user.id, 
        layout
      );

      const responseData = {
        layout: userSetting.dashboardLayout
      };

      // Log successful layout update
      dashboardLogger.info({ 
        userId: user.id, 
        widgetCount: layout.length,
        widgetIds: layout.map((item: any) => item.i) 
      }, 'Dashboard layout updated successfully');
      logUtils.users.settingsChanged(user.id, 'dashboardLayout', { widgetCount: layout.length });
      logUtils.performance.requestEnd('PUT', '/api/user/dashboard-layout', Date.now() - startTime, 200);

      sendSuccess(res, responseData, {
        message: 'Dashboard layout updated successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      dashboardLogger.error({ error, duration }, 'Error updating dashboard layout');
      logUtils.performance.requestEnd('PUT', '/api/user/dashboard-layout', duration, 500);
      sendInternalError(res);
    }
  };
}