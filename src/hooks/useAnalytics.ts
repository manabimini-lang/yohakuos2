import { useCallback } from 'react';
import { trackEvent, EventType, LogPayload } from '@/lib/analytics';
import { useLocation } from 'react-router-dom';

export function useAnalytics() {
  const location = useLocation();

  const logEvent = useCallback(async (type: EventType, payload: LogPayload = {}) => {
    await trackEvent(type, {
      ...payload,
      current_path: location.pathname,
    });
  }, [location.pathname]);

  const logPageView = useCallback(async () => {
    await trackEvent('page_view', {
      path: location.pathname,
    });
  }, [location.pathname]);

  return { logEvent, logPageView };
}
