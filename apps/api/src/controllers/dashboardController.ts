import { Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { ValidatedRequest } from '../middleware/validation';
import { DashboardLayoutItem } from '../types';
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendValidationError,
  sendInternalError
} from '../utils/responseHelpers';
import { validationSchemas } from '../schemas';
import { z } from 'zod';

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for dashboard operations
const dashboardLogger = createModuleLogger('dashboard');

// Type definitions for validated requests
type UpdateDashboardLayoutRequest = ValidatedRequest<z.infer<typeof validationSchemas.updateDashboardLayout>> & AuthRequest;

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

      // If no layout exists, return default layout
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
  updateDashboardLayout = async (req: UpdateDashboardLayoutRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Data is already validated by Zod middleware (layout structure, widget IDs, etc.)
      const { layout } = req.body;

      dashboardLogger.debug({ 
        userId: user.id, 
        layoutLength: layout.length,
        widgetIds: layout.map((item: any) => item.i) 
      }, 'Dashboard layout update request started');

      // Additional business logic validation for widget IDs
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

      // Check if all widget IDs are valid (already validated by Zod, but double-check for business logic)
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

      // Save the layout
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