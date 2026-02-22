/**
 * Copyright IBM Corp. 2026
 *
 * On-Call Page - Shared Types, Constants, and Helper Functions
 * Used by OnCallPage and its child components.
 */

import type { OnCallSchedule } from '@/shared/services';

// ==========================================
// Helper Functions
// ==========================================

export function formatShortDate(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '--';
  }
}

export interface WeekDay {
  date: Date;
  dayName: string;
  dateStr: string;
  isToday: boolean;
}

export function getWeekDays(): WeekDay[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      date: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: d.getTime() === today.getTime(),
    };
  });
}

export function isScheduleOnDay(schedule: OnCallSchedule, day: Date): boolean {
  const start = new Date(schedule.start_time);
  const end = new Date(schedule.end_time);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return start <= dayEnd && end >= dayStart;
}

/** Convert date string (mm/dd/yyyy) + time string (HH:MM) to RFC3339 for API calls. */
export function toRFC3339(dateStr: string, timeStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [month, day, year] = parts;
  const time = timeStr || '00:00';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00Z`;
}

// ==========================================
// Form Types
// ==========================================

export interface ScheduleFormValues extends Record<string, unknown> {
  id: number;
  username: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  rotation_type: string;
  is_primary: boolean;
}

export interface OverrideFormValues extends Record<string, unknown> {
  schedule_id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  reason: string;
}

export const INITIAL_SCHEDULE: ScheduleFormValues = {
  id: 0,
  username: '',
  startDate: '',
  startTime: '08:00',
  endDate: '',
  endTime: '20:00',
  rotation_type: 'weekly',
  is_primary: true,
};

export const INITIAL_OVERRIDE: OverrideFormValues = {
  schedule_id: '',
  startDate: '',
  startTime: '08:00',
  endDate: '',
  endTime: '20:00',
  reason: '',
};
