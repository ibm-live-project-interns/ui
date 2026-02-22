/**
 * Copyright IBM Corp. 2026
 *
 * WeeklyOverview - Weekly on-call schedule grid.
 * Displays 7 day cards showing primary and secondary on-call assignments.
 */

import React from 'react';
import { Tag, Tile } from '@carbon/react';
import { CalendarHeatMap } from '@carbon/icons-react';

import type { OnCallSchedule } from '@/shared/services';
import type { WeekDay } from './types';
import { isScheduleOnDay } from './types';

interface WeeklyOverviewProps {
  weekDays: WeekDay[];
  activeSchedules: OnCallSchedule[];
}

export const WeeklyOverview = React.memo(function WeeklyOverview({
  weekDays,
  activeSchedules,
}: WeeklyOverviewProps) {
  return (
    <div className="oncall-page__section">
      <h3 className="oncall-page__section-title">
        <CalendarHeatMap size={16} aria-label="Weekly schedule" />
        This Week
      </h3>
      <div className="oncall-page__week-grid">
        {weekDays.map((day) => {
          const daySchedules = activeSchedules.filter((s) =>
            isScheduleOnDay(s, day.date)
          );
          const primary = daySchedules.find((s) => s.is_primary);
          const secondary = daySchedules.find((s) => !s.is_primary);

          return (
            <Tile
              key={day.dateStr}
              className={`oncall-page__day-card ${day.isToday ? 'oncall-page__day-card--today' : ''}`}
            >
              <div className="oncall-page__day-header">
                <span className="oncall-page__day-name">{day.dayName}</span>
                {day.isToday && <Tag type="green" size="sm">Today</Tag>}
              </div>
              <span className="oncall-page__day-date">{day.dateStr}</span>
              {primary ? (
                <div className="oncall-page__day-person">
                  <span className="oncall-page__person-label">Primary</span>
                  <span className="oncall-page__person-name">{primary.username}</span>
                </div>
              ) : (
                <div className="oncall-page__day-person">
                  <span className="oncall-page__person-label">Primary</span>
                  <span className="oncall-page__person-name--secondary">Unassigned</span>
                </div>
              )}
              {secondary && (
                <div className="oncall-page__day-person">
                  <span className="oncall-page__person-label">Secondary</span>
                  <span className="oncall-page__person-name--secondary">{secondary.username}</span>
                </div>
              )}
            </Tile>
          );
        })}
      </div>
    </div>
  );
});
