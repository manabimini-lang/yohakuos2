export const trackPWAEvent = (action: string, label?: string) => {
  // Analytics implementation
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, { 'event_category': 'PWA', 'event_label': label });
  }
  console.log(`[PWA Event] ${action}${label ? `: ${label}` : ''}`);
};