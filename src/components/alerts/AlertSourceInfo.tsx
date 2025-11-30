import { Tile, Tag, StructuredListWrapper, StructuredListBody, StructuredListRow, StructuredListCell } from '@carbon/react';
import { Network_2 as Network, Location, Terminal, Time } from '@carbon/icons-react';
import type { Alert } from '../../models';

interface AlertSourceInfoProps {
  alert: Alert;
  /** Show only device information tile */
  showDeviceOnly?: boolean;
  /** Show only raw log data tile */
  showRawLogOnly?: boolean;
}

/**
 * @description Alert source information component
 * Can show both device and raw log, or just one via props
 * @see docs/arch/UI/README.md
 */
export function AlertSourceInfo({ alert, showDeviceOnly, showRawLogOnly }: AlertSourceInfoProps) {
  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'long',
    }).format(date);
  };

  // If neither flag is set, show both (default behavior)
  const showDevice = showDeviceOnly || (!showDeviceOnly && !showRawLogOnly);
  const showRawLog = showRawLogOnly || (!showDeviceOnly && !showRawLogOnly);

  return (
    <div className="alert-source-info">
      {/* Device Information */}
      {showDevice && (
        <Tile className="alert-source-info__device">
          <h4 className="alert-source-info__title">
            <Network size={20} />
            Device Information
          </h4>
          <StructuredListWrapper selection={false} isCondensed>
            <StructuredListBody>
              <StructuredListRow>
                <StructuredListCell noWrap>Hostname</StructuredListCell>
                <StructuredListCell>{alert.device.hostname}</StructuredListCell>
              </StructuredListRow>
              <StructuredListRow>
                <StructuredListCell noWrap>IP Address</StructuredListCell>
                <StructuredListCell>
                  <code>{alert.device.ipAddress}</code>
                </StructuredListCell>
              </StructuredListRow>
              {alert.device.deviceType && (
                <StructuredListRow>
                  <StructuredListCell noWrap>Type</StructuredListCell>
                  <StructuredListCell>{alert.device.deviceType}</StructuredListCell>
                </StructuredListRow>
              )}
              {alert.device.vendor && (
                <StructuredListRow>
                  <StructuredListCell noWrap>Vendor</StructuredListCell>
                  <StructuredListCell>{alert.device.vendor}</StructuredListCell>
                </StructuredListRow>
              )}
              {alert.device.location && (
                <StructuredListRow>
                  <StructuredListCell noWrap>
                    <Location size={16} /> Location
                  </StructuredListCell>
                  <StructuredListCell>{alert.device.location}</StructuredListCell>
                </StructuredListRow>
              )}
            </StructuredListBody>
          </StructuredListWrapper>
        </Tile>
      )}

      {/* Raw Log Information */}
      {showRawLog && (
        <Tile className="alert-source-info__log">
          <h4 className="alert-source-info__title">
            <Terminal size={20} />
            Raw Log Data
          </h4>
          <div className="alert-source-info__source-type">
            <Tag type={alert.sourceType === 'snmp_trap' ? 'blue' : 'purple'}>
              {alert.sourceType === 'snmp_trap' ? 'SNMP Trap' : 'Syslog'}
            </Tag>
          </div>
          <StructuredListWrapper selection={false} isCondensed>
            <StructuredListBody>
              <StructuredListRow>
                <StructuredListCell noWrap>
                  <Time size={16} /> Timestamp
                </StructuredListCell>
                <StructuredListCell>{formatTimestamp(alert.rawLog.timestamp)}</StructuredListCell>
              </StructuredListRow>
              <StructuredListRow>
                <StructuredListCell noWrap>Message</StructuredListCell>
                <StructuredListCell>
                  <code className="alert-source-info__message">{alert.rawLog.message}</code>
                </StructuredListCell>
              </StructuredListRow>
              {alert.rawLog.oid && (
                <StructuredListRow>
                  <StructuredListCell noWrap>OID</StructuredListCell>
                  <StructuredListCell>
                    <code>{alert.rawLog.oid}</code>
                  </StructuredListCell>
                </StructuredListRow>
              )}
              {alert.rawLog.facility && (
                <StructuredListRow>
                  <StructuredListCell noWrap>Facility</StructuredListCell>
                  <StructuredListCell>{alert.rawLog.facility}</StructuredListCell>
                </StructuredListRow>
              )}
            </StructuredListBody>
          </StructuredListWrapper>

          {alert.rawLog.rawData && Object.keys(alert.rawLog.rawData).length > 0 && (
            <div className="alert-source-info__raw-data">
              <h5>Additional Data</h5>
              <pre>{JSON.stringify(alert.rawLog.rawData, null, 2)}</pre>
            </div>
          )}
        </Tile>
      )}
    </div>
  );
}
