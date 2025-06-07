// apps/web/src/components/dashboard/widgets/HourlyHeatmapWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Clock, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

// Types for heatmap data (updated to match backend)
interface HourlyData {
  hour: number;
  day: number;
  clicks: number;
  uniqueClicks: number;
  intensity: number; // 0-1 for color intensity
}

interface BackendHeatmapResponse {
  success: boolean;
  data: {
    data: HourlyData[];
    totalClicks: number;
    maxClicks: number;
    peakHour: number;
    peakDay: number;
    period: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
  timestamp: string;
}

interface HeatmapData {
  data: HourlyData[];
  maxClicks: number;
  totalClicks: number;
  peakHour: number;
  peakDay: number;
  isLiveData: boolean;
}

// Days of week in Italian
const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const FULL_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Hours array (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Color intensity calculation
const getIntensityColor = (intensity: number): string => {
  if (intensity === 0) return 'bg-slate-700/30';
  if (intensity < 0.2) return 'bg-blue-500/20';
  if (intensity < 0.4) return 'bg-blue-500/40';
  if (intensity < 0.6) return 'bg-blue-500/60';
  if (intensity < 0.8) return 'bg-blue-500/80';
  return 'bg-blue-500';
};

// Tooltip component
const HeatmapTooltip = ({ 
  data, 
  visible, 
  position 
}: { 
  data: HourlyData | null; 
  visible: boolean; 
  position: { x: number; y: number } 
}) => {
  if (!visible || !data) return null;

  return (
    <div 
      className="absolute z-50 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="text-white text-sm">
        <div className="font-medium mb-1">
          {FULL_DAYS[data.day]} - {data.hour.toString().padStart(2, '0')}:00
        </div>
        <div className="text-blue-400">
          <span className="font-bold">{data.clicks.toLocaleString('it-IT')}</span> click
        </div>
        {data.uniqueClicks !== undefined && (
          <div className="text-green-400 text-xs">
            {data.uniqueClicks.toLocaleString('it-IT')} unici
          </div>
        )}
      </div>
    </div>
  );
};

export const HourlyHeatmapWidget = () => {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HourlyData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiClient = getAuthenticatedApiClient();
        if (!apiClient) {
          console.log('HourlyHeatmapWidget: No API client available, using mock data');
          const mockData = generateRealisticHeatmapData();
          setData(mockData);
          setIsLoading(false);
          return;
        }

        try {
          console.log('HourlyHeatmapWidget: Calling backend endpoint...');
          
          // Call the real backend endpoint
          const response = await apiClient.get('/api/user/analytics/hourly-heatmap?period=7d');
          
          console.log('HourlyHeatmapWidget: Raw response:', response);
          
          // Handle both direct response and wrapped response
          let actualData = null;
          if (response && typeof response === 'object') {
            // Case 1: Wrapped response { success: true, data: { data: [...], ... } }
            if ('success' in response && response.success && response.data) {
              actualData = response.data;
              console.log('HourlyHeatmapWidget: Found wrapped data');
            }
            // Case 2: Direct response { data: [...], totalClicks, ... }
            else if ('data' in response && Array.isArray(response.data)) {
              actualData = response;
              console.log('HourlyHeatmapWidget: Found direct data');
            }
          }
          
          if (actualData && actualData.data && Array.isArray(actualData.data)) {
            console.log('HourlyHeatmapWidget: Processing', actualData.data.length, 'data points');
            const processedData = processBackendData(actualData);
            setData(processedData);
          } else {
            console.log('HourlyHeatmapWidget: Invalid response format, using mock data');
            const mockData = generateRealisticHeatmapData();
            setData(mockData);
          }
          
        } catch (backendError: any) {
          console.log('HourlyHeatmapWidget: Backend call failed, using mock data:', backendError?.message);
          const mockData = generateRealisticHeatmapData();
          setData(mockData);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch heatmap data';
        console.error('HourlyHeatmapWidget: General error:', errorMessage);
        setError(errorMessage);
        
        // Final fallback to mock data
        const mockData = generateRealisticHeatmapData();
        setData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeatmapData();
  }, [getAuthenticatedApiClient, isLoggedIn]);

  // Process backend data to match our interface
  const processBackendData = (backendData: any): HeatmapData => {
    return {
      data: backendData.data || [],
      totalClicks: backendData.totalClicks || 0,
      maxClicks: backendData.maxClicks || 0,
      peakHour: backendData.peakHour || 0,
      peakDay: backendData.peakDay || 0,
      isLiveData: true
    };
  };

  // Generate realistic heatmap data
  const generateRealisticHeatmapData = (): HeatmapData => {
    const data: HourlyData[] = [];
    let maxClicks = 0;
    let totalClicks = 0;
    let peakClicks = 0;
    let peakHour = 0;
    let peakDay = 0;

    // Realistic patterns for affiliate marketing
    const patterns = {
      // Higher activity during lunch and evening hours
      hourlyMultipliers: [
        0.1, 0.05, 0.03, 0.02, 0.03, 0.05, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, // 0-11
        1.0, 0.8, 0.6, 0.4, 0.6, 0.8, 0.9, 1.0, 0.8, 0.6, 0.4, 0.2      // 12-23
      ],
      // Higher activity on weekdays, lower on weekends
      dailyMultipliers: [1.0, 1.1, 1.0, 0.9, 0.8, 0.6, 0.5] // Mon-Sun
    };

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Base click count with some randomness
        const baseClicks = Math.floor(Math.random() * 100 + 20);
        
        // Apply realistic patterns
        const clicks = Math.floor(
          baseClicks * 
          patterns.hourlyMultipliers[hour] * 
          patterns.dailyMultipliers[day] *
          (0.8 + Math.random() * 0.4) // Add some randomness
        );

        const uniqueClicks = Math.floor(clicks * (0.7 + Math.random() * 0.3));

        data.push({
          hour,
          day,
          clicks,
          uniqueClicks,
          intensity: 0 // Will be calculated below
        });

        totalClicks += clicks;
        if (clicks > maxClicks) {
          maxClicks = clicks;
        }
        if (clicks > peakClicks) {
          peakClicks = clicks;
          peakHour = hour;
          peakDay = day;
        }
      }
    }

    // Calculate intensity (0-1) for each cell
    data.forEach(cell => {
      cell.intensity = maxClicks > 0 ? cell.clicks / maxClicks : 0;
    });

    return {
      data,
      maxClicks,
      totalClicks,
      peakHour,
      peakDay,
      isLiveData: false
    };
  };

  // Handle cell hover
  const handleCellHover = (cellData: HourlyData, event: React.MouseEvent) => {
    setHoveredCell(cellData);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
            <div>
              <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex gap-1">
                {Array.from({ length: 24 }).map((_, j) => (
                  <div key={j} className="w-6 h-6 bg-slate-700 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Errore caricamento</p>
            <p className="text-sm text-gray-400">Impossibile caricare la heatmap oraria</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
            <Clock className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Heatmap Orari
              {/* Indicatore stato dati */}
              <div className={`w-2 h-2 rounded-full ${data.isLiveData ? 'bg-green-500' : 'bg-yellow-500'}`} 
                   title={data.isLiveData ? 'Dati live dal database' : 'Dati mock (fallback)'}></div>
            </h3>
            <p className="text-sm text-gray-400">
              Pattern di attività settimanale {data.isLiveData ? '(live)' : '(demo)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
          <TrendingUp className="h-4 w-4" />
          Peak: {DAYS[data.peakDay]} {data.peakHour.toString().padStart(2, '0')}:00
        </div>
      </div>

      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Attività bassa</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-700/30 rounded"></div>
              <div className="w-3 h-3 bg-blue-500/20 rounded"></div>
              <div className="w-3 h-3 bg-blue-500/40 rounded"></div>
              <div className="w-3 h-3 bg-blue-500/60 rounded"></div>
              <div className="w-3 h-3 bg-blue-500/80 rounded"></div>
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
            </div>
            <span className="text-gray-400">Attività alta</span>
          </div>
          <div className="text-gray-400">
            {data.totalClicks.toLocaleString('it-IT')} click totali
          </div>
        </div>

        {/* Hour labels */}
        <div className="flex items-center">
          <div className="w-12"></div> {/* Space for day labels */}
          <div className="flex flex-1 justify-between text-xs text-gray-500 px-1">
            {[0, 6, 12, 18].map(hour => (
              <span key={hour}>{hour.toString().padStart(2, '0')}:00</span>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1">
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-2">
              {/* Day label */}
              <div className="w-10 text-xs text-gray-400 font-medium text-right">
                {day}
              </div>
              
              {/* Hour cells */}
              <div className="flex gap-1 flex-1">
                {HOURS.map(hour => {
                  const cellData = data.data.find(d => d.day === dayIndex && d.hour === hour);
                  if (!cellData) return null;
                  
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`
                        w-6 h-6 rounded cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 relative
                        ${getIntensityColor(cellData.intensity)}
                        ${hoveredCell === cellData ? 'ring-2 ring-blue-400' : ''}
                      `}
                      onMouseEnter={(e) => handleCellHover(cellData, e)}
                      onMouseLeave={handleCellLeave}
                      title={`${FULL_DAYS[dayIndex]} ${hour.toString().padStart(2, '0')}:00 - ${cellData.clicks} click`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Insights footer */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ora di punta</span>
              <span className="text-white font-medium">
                {data.peakHour.toString().padStart(2, '0')}:00-{(data.peakHour + 1).toString().padStart(2, '0')}:00
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Giorno migliore</span>
              <span className="text-white font-medium">{FULL_DAYS[data.peakDay]}</span>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-300">
                <span className="font-medium">Insight:</span> I tuoi link performano meglio il{' '}
                <span className="font-bold">{FULL_DAYS[data.peakDay].toLowerCase()}</span> alle{' '}
                <span className="font-bold">{data.peakHour.toString().padStart(2, '0')}:00</span>.
                Considera di pubblicare contenuti in questi orari per massimizzare i click.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <HeatmapTooltip 
        data={hoveredCell} 
        visible={!!hoveredCell} 
        position={tooltipPosition} 
      />
    </div>
  );
};