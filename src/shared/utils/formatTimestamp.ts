export interface TimestampInfo {
  absolute: string;
  relative?: string;
}

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

export function formatTimestamp(ts: any): TimestampInfo {
  if (!ts && ts !== 0) return { absolute: '', relative: '' };

  // If already an object with the right shape
  if (typeof ts === 'object') {
    if (ts.absolute || ts.relative) {
      return { absolute: String(ts.absolute || ''), relative: String(ts.relative || '') };
    }
    // If it's an epoch number inside an object
    if (typeof (ts as any).value === 'number') {
      const d = new Date((ts as any).value);
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
      const parsed = JSON.parse(ts);
      if (parsed && (parsed.absolute || parsed.relative)) return { absolute: String(parsed.absolute || ''), relative: String(parsed.relative || '') };
      if (typeof parsed === 'number') {
        const d = new Date(parsed);
        if (!isNaN(d.getTime())) return { absolute: formatUTC(d), relative: computeRelative(d) };
      }
    } catch (e) {
      // ignore
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
