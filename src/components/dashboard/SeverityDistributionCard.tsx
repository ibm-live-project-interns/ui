import { Tile, SkeletonText } from '@carbon/react';
import { Warning, WarningAlt, Information, CheckmarkFilled, Activity } from '@carbon/icons-react';
import type { SeverityDistribution } from '../../models';

interface SeverityDistributionCardProps {
  distribution: SeverityDistribution | null;
  loading?: boolean;
}

interface SeverityItemProps {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

function SeverityItem({ label, count, color, icon }: SeverityItemProps) {
  return (
    <div className="severity-distribution__item">
      <div className="severity-distribution__icon" style={{ color }}>
        {icon}
      </div>
      <div className="severity-distribution__details">
        <span className="severity-distribution__label">{label}</span>
        <span className="severity-distribution__count" style={{ color }}>
          {count}
        </span>
      </div>
    </div>
  );
}

export function SeverityDistributionCard({
  distribution,
  loading = false,
}: SeverityDistributionCardProps) {
  if (loading) {
    return (
      <Tile className="severity-distribution">
        <div className="severity-distribution__header">
          <Activity size={20} />
          <h4>Severity Distribution</h4>
        </div>
        <div className="severity-distribution__grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="severity-distribution__item">
              <SkeletonText width="100%" />
            </div>
          ))}
        </div>
      </Tile>
    );
  }

  const total = distribution
    ? distribution.critical +
      distribution.high +
      distribution.medium +
      distribution.low +
      distribution.info
    : 0;

  return (
    <Tile className="severity-distribution">
      <div className="severity-distribution__header">
        <Activity size={20} />
        <h4>Severity Distribution</h4>
        <span className="severity-distribution__total">Total: {total}</span>
      </div>

      <div className="severity-distribution__grid">
        <SeverityItem
          label="Critical"
          count={distribution?.critical || 0}
          color="var(--cds-support-error, #da1e28)"
          icon={<Warning size={24} />}
        />
        <SeverityItem
          label="High"
          count={distribution?.high || 0}
          color="var(--cds-support-warning, #f1c21b)"
          icon={<WarningAlt size={24} />}
        />
        <SeverityItem
          label="Medium"
          count={distribution?.medium || 0}
          color="var(--cds-support-info, #0043ce)"
          icon={<WarningAlt size={24} />}
        />
        <SeverityItem
          label="Low"
          count={distribution?.low || 0}
          color="var(--cds-support-success, #24a148)"
          icon={<CheckmarkFilled size={24} />}
        />
        <SeverityItem
          label="Info"
          count={distribution?.info || 0}
          color="var(--cds-text-secondary, #525252)"
          icon={<Information size={24} />}
        />
      </div>

      {/* Simple bar visualization */}
      {total > 0 && (
        <div className="severity-distribution__bar">
          {distribution?.critical ? (
            <div
              className="severity-distribution__bar-segment severity-distribution__bar-segment--critical"
              style={{ width: `${(distribution.critical / total) * 100}%` }}
              title={`Critical: ${distribution.critical}`}
            />
          ) : null}
          {distribution?.high ? (
            <div
              className="severity-distribution__bar-segment severity-distribution__bar-segment--high"
              style={{ width: `${(distribution.high / total) * 100}%` }}
              title={`High: ${distribution.high}`}
            />
          ) : null}
          {distribution?.medium ? (
            <div
              className="severity-distribution__bar-segment severity-distribution__bar-segment--medium"
              style={{ width: `${(distribution.medium / total) * 100}%` }}
              title={`Medium: ${distribution.medium}`}
            />
          ) : null}
          {distribution?.low ? (
            <div
              className="severity-distribution__bar-segment severity-distribution__bar-segment--low"
              style={{ width: `${(distribution.low / total) * 100}%` }}
              title={`Low: ${distribution.low}`}
            />
          ) : null}
          {distribution?.info ? (
            <div
              className="severity-distribution__bar-segment severity-distribution__bar-segment--info"
              style={{ width: `${(distribution.info / total) * 100}%` }}
              title={`Info: ${distribution.info}`}
            />
          ) : null}
        </div>
      )}
    </Tile>
  );
}
