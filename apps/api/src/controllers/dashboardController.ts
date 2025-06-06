import { Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { DashboardLayoutItem } from '../types';
import {
  sendSuccess,
  sendValidationError,
  sendInternalError
} from '../utils/responseHelpers';

export class DashboardController {
  constructor(private models: Models) {}

  // GET /api/user/dashboard-layout
  getDashboardLayout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

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

      const responseData = {
        layout
      };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);
      sendInternalError(res);
    }
  };

  // PUT /api/user/dashboard-layout
  updateDashboardLayout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { layout } = req.body;

      if (!layout || !Array.isArray(layout)) {
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
      const hasInvalidWidgets = layout.some((item: any) => 
        !validWidgetIds.includes(item.i)
      );

      if (hasInvalidWidgets) {
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

      sendSuccess(res, responseData, {
        message: 'Dashboard layout updated successfully'
      });
    } catch (error) {
      console.error('Error updating dashboard layout:', error);
      sendInternalError(res);
    }
  };
}