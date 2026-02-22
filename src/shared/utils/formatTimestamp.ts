export interface TimestampInfo {
  absolute: string;
  relative?: string;
}

/** An object that wraps an epoch value */
interface TimestampEpochObject {
  value: number;
}

/** An object that already has the formatted shape */
interface TimestampShapeObject {
  absolute?: string;
  relative?: string;
}

/**
 * All accepted timestamp input shapes:
 * - string (ISO date, JSON string, raw text)
 * - number (epoch ms)
 * - TimestampShapeObject ({ absolute, relative })
 * - TimestampEpochObject ({ value: number })
 * - null / undefined
 */
export type TimestampValue =
  | string
  | number
  | TimestampShapeObject
  | TimestampEpochObject
  | null
  | undefined;

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatUTC(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function computeRelative(date: Date) {
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - date.getTime()) / 1000)); // seconds
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Type guard: checks if the object has a numeric `value` property (epoch wrapper) */
function hasNumericValue(obj: object): obj is TimestampEpochObject {
  return 'value' in obj && typeof (obj as TimestampEpochObject).value === 'number';
}

/** Type guard: checks if the object has `absolute` or `relative` string properties */
function hasTimestampShape(obj: object): obj is TimestampShapeObject {
  return 'absolute' in obj || 'relative' in obj;
}

export function formatTimestamp(ts: TimestampValue): TimestampInfo {
  if (ts === null || ts === undefined) return { absolute: '', relative: '' };
  if (typeof ts === 'number' && ts === 0) return { absolute: '0', relative: '0' };
  if (!ts && ts !== 0) return { absolute: '', relative: '' };

  // If already an object with the right shape
  if (typeof ts === 'object' && ts !== null) {
    if (hasTimestampShape(ts)) {
      return { absolute: String(ts.absolute || ''), relative: String(ts.relative || '') };
    }
    // If it's an epoch number inside an object
    if (hasNumericValue(ts)) {
      const d = new Date(ts.value);
      return { absolute: formatUTC(d), relative: computeRelative(d) };
    }
  }

  if (typeof ts === 'number') {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return { absolute: formatUTC(d), relative: computeRelative(d) };
    return { absolute: String(ts), relative: String(ts) };
  }

  if (typeof ts === 'string') {
    // Try JSON parse (in case backend sent a JSON string)
    try {
      const parsed: unknown = JSON.parse(ts);
      if (parsed && typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        if (obj.absolute || obj.relative) {
          return { absolute: String(obj.absolute || ''), relative: String(obj.relative || '') };
        }
      }
      if (typeof parsed === 'number') {
        const d = new Date(parsed);
        if (!isNaN(d.getTime())) return { absolute: formatUTC(d), relative: computeRelative(d) };
      }
    } catch {
      // ignore parse failures
    }

    // Try to parse as ISO date
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return { absolute: formatUTC(d), relative: computeRelative(d) };
    }

    // Fallback: return as-is
    return { absolute: ts, relative: ts };
  }

  // Last resort
  return { absolute: String(ts), relative: String(ts) };
}

export default formatTimestamp;
