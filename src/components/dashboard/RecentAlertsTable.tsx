import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  Tag,
  OverflowMenu,
  OverflowMenuItem,
  DataTableSkeleton,
  Link,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Dropdown,
} from '@carbon/react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import type { FormattedAlert, AlertSeverity, AlertStatus } from '../../models';

interface RecentAlertsTableProps {
  alerts: FormattedAlert[];
  loading?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

/**
 * @description Carbon lg breakpoint (1056px) for responsive table behavior
 * @see https://carbondesignsystem.com/elements/2x-grid/overview/#breakpoints
 */
const BREAKPOINT_MD = 672;
const BREAKPOINT_LG = 1056;

const TABLE_HEADERS = [
  { key: 'severity', header: 'Severity' },
  { key: 'device', header: 'Device' },
  { key: 'explanation', header: 'Description' },
  { key: 'source', header: 'Source' },
  { key: 'time', header: 'Time' },
  { key: 'status', header: 'Status' },
  { key: 'actions', header: '' },
];

/**
 * @description Headers shown on mobile (< md breakpoint)
 * Hides source column for better readability on small screens
 */
const MOBILE_HEADERS = ['severity', 'device', 'explanation', 'time', 'actions'];

/**
 * @description Headers shown on tablet (md-lg breakpoint)
 * Shows all columns except actions overflow menu
 */
const TABLET_HEADERS = ['severity', 'device', 'explanation', 'source', 'time', 'status', 'actions'];

const SEVERITY_OPTIONS = [
  { id: 'all', text: 'All Severities' },
  { id: 'critical', text: 'Critical' },
  { id: 'high', text: 'High' },
  { id: 'medium', text: 'Medium' },
  { id: 'low', text: 'Low' },
  { id: 'info', text: 'Info' },
];

const STATUS_OPTIONS = [
  { id: 'all', text: 'All Statuses' },
  { id: 'active', text: 'Active' },
  { id: 'acknowledged', text: 'Acknowledged' },
  { id: 'resolved', text: 'Resolved' },
];

export function RecentAlertsTable({
  alerts,
  loading = false,
  onAcknowledge,
  onResolve,
}: RecentAlertsTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');

  /**
   * @description Track viewport width for responsive header visibility
   * Uses Carbon breakpoints for consistency
   */
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : BREAKPOINT_LG
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * @description Determine table size based on viewport
   * Uses 'sm' for mobile to reduce row height
   */
  const tableSize = windowWidth < BREAKPOINT_MD ? 'sm' : 'lg';

  /**
   * @description Filter headers based on viewport width
   * Hides less important columns on smaller screens for better readability
   */
  const visibleHeaders = useMemo(() => {
    if (windowWidth < BREAKPOINT_MD) {
      return TABLE_HEADERS.filter(h => MOBILE_HEADERS.includes(h.key));
    }
    if (windowWidth < BREAKPOINT_LG) {
      return TABLE_HEADERS.filter(h => TABLET_HEADERS.includes(h.key));
    }
    return TABLE_HEADERS;
  }, [windowWidth]);

  // Filter alerts based on search and filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = !searchTerm ||
        alert.device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.explanation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [alerts, searchTerm, severityFilter, statusFilter]);

  if (loading) {
    return (
      <div className="recent-alerts-table">
        <DataTableSkeleton
          columnCount={visibleHeaders.length}
          rowCount={5}
          showHeader={true}
          showToolbar={true}
        />
      </div>
    );
  }

  const rows = filteredAlerts.map(alert => ({
    id: alert.id,
    severity: alert,
    device: alert.device.hostname,
    explanation: alert.explanationSnippet,
    source: alert.sourceTypeLabel,
    time: alert.relativeTime,
    status: alert,
    actions: alert,
  }));

  return (
    <div className="recent-alerts-table">
      {/*
        TableContainer provides responsive horizontal scrolling
        @see https://carbondesignsystem.com/components/data-table/usage
      */}
      <DataTable rows={rows} headers={visibleHeaders}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps, getTableContainerProps }) => (
          <TableContainer
            title="Alerts"
            description="Recent network alerts from SNMP traps and syslog sources"
            {...getTableContainerProps()}
          >
              <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch
                  placeholder="Search by device or description..."
                  onChange={(_event, value) => setSearchTerm(value || '')}
                  value={searchTerm}
                  persistent
                />
                {/* Hide filter dropdowns on mobile for cleaner UI */}
                {windowWidth >= BREAKPOINT_MD && (
                  <>
                    <Dropdown
                      id="severity-filter"
                      titleText=""
                      label="Severity"
                      items={SEVERITY_OPTIONS}
                      itemToString={(item: { id: string; text: string } | null) => item?.text || ''}
                      selectedItem={SEVERITY_OPTIONS.find(o => o.id === severityFilter)}
                      onChange={({ selectedItem }: { selectedItem: { id: string } | null }) => {
                        setSeverityFilter((selectedItem?.id || 'all') as AlertSeverity | 'all');
                      }}
                      size="lg"
                    />
                    <Dropdown
                      id="status-filter"
                      titleText=""
                      label="Status"
                      items={STATUS_OPTIONS}
                      itemToString={(item: { id: string; text: string } | null) => item?.text || ''}
                      selectedItem={STATUS_OPTIONS.find(o => o.id === statusFilter)}
                      onChange={({ selectedItem }: { selectedItem: { id: string } | null }) => {
                        setStatusFilter((selectedItem?.id || 'all') as AlertStatus | 'all');
                      }}
                      size="lg"
                    />
                  </>
                )}
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()} size={tableSize} useZebraStyles>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    <TableHeader
                      {...getHeaderProps({ header })}
                      key={header.key}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
                    {row.cells.map(cell => {
                      if (cell.info.header === 'severity') {
                        const alert = cell.value as FormattedAlert;
                        return (
                          <TableCell key={cell.id}>
                            <Tag type={alert.severityKind} size="md">
                              {alert.severityLabel}
                            </Tag>
                          </TableCell>
                        );
                      }

                      if (cell.info.header === 'status') {
                        const alert = cell.value as FormattedAlert;
                        const statusKind = {
                          active: 'red' as const,
                          acknowledged: 'blue' as const,
                          resolved: 'green' as const,
                          dismissed: 'gray' as const,
                        };
                        return (
                          <TableCell key={cell.id}>
                            <Tag type={statusKind[alert.status] || 'gray'} size="md">
                              {alert.statusLabel}
                            </Tag>
                          </TableCell>
                        );
                      }

                      if (cell.info.header === 'explanation') {
                        return (
                          <TableCell key={cell.id} className="recent-alerts-table__description-cell">
                            <Link
                              className="recent-alerts-table__link"
                              onClick={() => navigate(`/alerts/${row.id}`)}
                            >
                              {cell.value}
                            </Link>
                          </TableCell>
                        );
                      }

                      if (cell.info.header === 'actions') {
                        const alert = cell.value as FormattedAlert;
                        return (
                          <TableCell key={cell.id}>
                            <OverflowMenu
                              size="md"
                              flipped
                              ariaLabel="Alert actions"
                            >
                              <OverflowMenuItem
                                itemText="View details"
                                onClick={() => navigate(`/alerts/${alert.id}`)}
                              />
                              {alert.status === 'active' && onAcknowledge && (
                                <OverflowMenuItem
                                  itemText="Acknowledge"
                                  onClick={() => onAcknowledge(alert.id)}
                                />
                              )}
                              {alert.status !== 'resolved' && onResolve && (
                                <OverflowMenuItem
                                  itemText="Resolve"
                                  onClick={() => onResolve(alert.id)}
                                />
                              )}
                            </OverflowMenu>
                          </TableCell>
                        );
                      }

                      return <TableCell key={cell.id}>{cell.value}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      {filteredAlerts.length === 0 && (
        <div className="recent-alerts-table__empty">
          <p>{searchTerm || severityFilter !== 'all' || statusFilter !== 'all'
            ? 'No alerts match your filters.'
            : 'No alerts to display.'}</p>
        </div>
      )}
    </div>
  );
}
