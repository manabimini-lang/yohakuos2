type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function normalizeTimeZone(value?: string | null, fallback = "Asia/Tokyo"): string {
  const candidate = String(value ?? "").trim() || fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return fallback;
  }
}

function zonedParts(date: Date, timeZone: string): ZonedDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return representedAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function zonedMidnightUtc(year: number, month: number, day: number, timeZone: string): Date {
  const wallClockUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let candidate = new Date(wallClockUtc);
  let offset = timeZoneOffsetMs(candidate, timeZone);
  candidate = new Date(wallClockUtc - offset);

  const correctedOffset = timeZoneOffsetMs(candidate, timeZone);
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    candidate = new Date(wallClockUtc - offset);
  }
  return candidate;
}

function shiftedLocalDate(now: Date, timeZone: string, dayOffset: number) {
  const current = zonedParts(now, timeZone);
  const shifted = new Date(Date.UTC(current.year, current.month - 1, current.day + dayOffset));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function getZonedDateKey(now: Date, timeZone: string, dayOffset = 0): string {
  const date = shiftedLocalDate(now, timeZone, dayOffset);
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function getZonedDayWindow(now: Date, timeZone: string, dayOffset = 0): {
  start: Date;
  end: Date;
} {
  const date = shiftedLocalDate(now, timeZone, dayOffset);
  const next = shiftedLocalDate(now, timeZone, dayOffset + 1);
  return {
    start: zonedMidnightUtc(date.year, date.month, date.day, timeZone),
    end: zonedMidnightUtc(next.year, next.month, next.day, timeZone),
  };
}

export function formatTimeInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}

export function getMinuteOfDayInZone(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

/** Resolve a local wall-clock time without relying on the server's timezone. */
export function getZonedTime(now: Date, timeZone: string, dayOffset: number, hour: number, minute = 0): Date {
  const date = shiftedLocalDate(now, timeZone, dayOffset);
  const wallClock = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  let result = new Date(wallClock);
  for (let i = 0; i < 3; i++) result = new Date(wallClock - timeZoneOffsetMs(result, timeZone));
  return result;
}

type TimeSlotEvent = { start_at: string; end_at: string };

/** Earliest future workday slot that fits the requested duration. */
export function findBestGap(events: TimeSlotEvent[], reference = new Date(), duration = 30, timeZone = 'Asia/Tokyo') {
  const minutes = Math.max(1, Math.min(540, duration));
  const occupied = events.map(event => ({ start: Date.parse(event.start_at), end: Date.parse(event.end_at) }))
    .filter(event => Number.isFinite(event.start) && event.end > event.start)
    .sort((a, b) => a.start - b.start);
  for (let day = 0; day < 14; day++) {
    const start = getZonedTime(reference, timeZone, day, 9).getTime();
    const end = getZonedTime(reference, timeZone, day, 18).getTime();
    let cursor = Math.max(start, Math.ceil((reference.getTime() + 60000) / 60000) * 60000);
    for (const event of occupied) {
      if (event.end <= cursor || event.start >= end) continue;
      if (Math.min(event.start, end) - cursor >= minutes * 60000) break;
      cursor = Math.max(cursor, event.end);
    }
    if (end - cursor >= minutes * 60000) return { start: new Date(cursor), end: new Date(cursor + minutes * 60000), minutes };
  }
  return null;
}
