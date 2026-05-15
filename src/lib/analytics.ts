import { supabase } from './supabase';

export type EventType = 
  | 'content_view' 
  | 'content_click' 
  | 'login' 
  | 'consultation_post' 
  | 'recommendation_click'
  | 'page_view';

export interface LogPayload {
  content_id?: string;
  category?: string;
  path?: string;
  theme_id?: string;
  [key: string]: any;
}

/**
 * Tracks an event by saving it to the Supabase event_logs table.
 */
export async function trackEvent(eventType: EventType, payload: LogPayload = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  try {
    const { error } = await supabase.from('event_logs').insert({
      user_id: user?.id || null,
      event_type: eventType,
      payload: {
        ...payload,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
      }
    });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to log event:', err);
  }
}

/**
 * Aggregates event data for the dashboard.
 */
export async function getAnalyticsSummary(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('event_logs')
    .select('event_type, created_at')
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  // Simple aggregation for the dashboard stats
  const counts = (data || []).reduce((acc: Record<string, number>, log) => {
    acc[log.event_type] = (acc[log.event_type] || 0) + 1;
    return acc;
  }, {});

  return counts;
}
