/**
 * Copyright IBM Corp. 2026
 *
 * OnCallWidget - Current on-call person display.
 * Small card showing name, phone, shift end time.
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button } from '@carbon/react';
import { UserAvatar, Phone, Time } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { env, API_ENDPOINTS } from '@/shared/config';
import { HttpService } from '@/shared/api';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface OnCallPerson {
  name: string;
  role: string;
  phone: string;
  email: string;
  shift_start: string;
  shift_end: string;
  avatar_url?: string;
}

interface OnCallWidgetProps {
  className?: string;
}

class OnCallHttpClient extends HttpService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath);
  }
  async fetchCurrent(): Promise<OnCallPerson | null> {
    try {
      const response = await this.get<{ current?: OnCallPerson; person?: OnCallPerson }>('/on-call/current');
      return response.current || response.person || null;
    } catch {
      return null;
    }
  }
}

const onCallClient = new OnCallHttpClient();

export const OnCallWidget = memo(function OnCallWidget({ className }: OnCallWidgetProps) {
  const navigate = useNavigate();

  const { data: person, isLoading, error, refetch } = useFetchData(
    async () => onCallClient.fetchCurrent(),
    []
  );

  if (isLoading && person === null) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !person) return <WidgetError message={error} onRetry={refetch} className={className} />;

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className={`widget widget--on-call ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <Phone size={18} />
            On Call
          </h3>
          <Button kind="ghost" size="sm" onClick={() => navigate('/on-call')}>
            Schedule
          </Button>
        </div>

        {person ? (
          <div className="widget__body">
            <div className="on-call__person">
              <div className="on-call__avatar">
                <UserAvatar size={20} />
              </div>
              <div className="on-call__details">
                <div className="on-call__name">{person.name}</div>
                <div className="on-call__role">{person.role}</div>
              </div>
            </div>

            <div className="on-call__meta">
              {person.phone && (
                <span>
                  <Phone size={14} />
                  {person.phone}
                </span>
              )}
              {person.shift_end && (
                <span>
                  <Time size={14} />
                  Ends at {formatTime(person.shift_end)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="widget__empty">
            No on-call data available
          </div>
        )}
      </Tile>
    </div>
  );
});
