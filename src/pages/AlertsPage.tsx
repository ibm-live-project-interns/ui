import { useState, useCallback, useEffect } from 'react';
import {
  Grid,
  Column,
  Button,
  InlineNotification,
  Search,
  Breadcrumb,
  BreadcrumbItem,
  Tag,
} from '@carbon/react';
import { Renew, Warning, Filter, Close } from '@carbon/icons-react';
import { Link } from 'react-router-dom';
import { alertService } from '../services';
import { AlertViewModel } from '../presentation/viewmodels/AlertViewModel';
import { AlertCard, AlertCardSkeleton } from '../components/alerts';
import { FilterPanel } from '../components/layout/FilterPanel';
import type { Alert, AlertSeverity, AlertStatus, AlertFilters, FormattedAlert } from '../models';

/** Alerts list with filtering @see docs/arch/UI/README.md */
export function AlertsPage() {
  const [alerts, setAlerts] = useState<FormattedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<AlertSeverity[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<AlertStatus[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<AlertFilters>({});

  const fetchAlerts = useCallback(async (currentFilters: AlertFilters, currentSearch: string) => {
    try {
      setLoading(true);
      setError(null);

      const filters: AlertFilters = {
        ...currentFilters,
        search: currentSearch || undefined,
      };

      const data = await alertService.fetchAlerts(filters);
      const formatted = data.map((alert: Alert) => new AlertViewModel(alert).toFormatted());
      setAlerts(formatted);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAlerts(appliedFilters, searchQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch when filters or search change (debounced for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAlerts(appliedFilters, searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [appliedFilters, searchQuery, fetchAlerts]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    });
    setIsFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedSeverities([]);
    setSelectedStatuses([]);
    setAppliedFilters({});
  };

  const removeFilter = (type: 'severity' | 'status', value: string) => {
    if (type === 'severity') {
      const newSeverities = selectedSeverities.filter(s => s !== value);
      setSelectedSeverities(newSeverities);
      setAppliedFilters(prev => ({
        ...prev,
        severity: newSeverities.length > 0 ? newSeverities : undefined,
      }));
    } else {
      const newStatuses = selectedStatuses.filter(s => s !== value);
      setSelectedStatuses(newStatuses);
      setAppliedFilters(prev => ({
        ...prev,
        status: newStatuses.length > 0 ? newStatuses : undefined,
      }));
    }
  };

  // const formattedAlerts: FormattedAlert[] = alertService.formatAlerts(alerts);

  const activeFilterCount = (appliedFilters.severity?.length || 0) + (appliedFilters.status?.length || 0);
  const hasActiveFilters = activeFilterCount > 0 || searchQuery;

  return (
    <>
      <Grid className="alerts-page">
        {/* Breadcrumb Navigation - IBM Style */}
        <Column lg={16} md={8} sm={4}>
          <Breadcrumb noTrailingSlash className="alerts-page__breadcrumb">
            <BreadcrumbItem>
              <Link to="/">Home</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              Alerts
            </BreadcrumbItem>
          </Breadcrumb>
        </Column>

        {/* Page Header */}
        <Column lg={16} md={8} sm={4}>
          <div className="alerts-page__header">
            <div>
              <h1 className="page-title">Alerts</h1>
              <p className="page-description">
                View and manage network alerts from SNMP traps and syslogs.
              </p>
            </div>
            <div className="alerts-page__header-actions">
              <Button
                kind="ghost"
                renderIcon={Renew}
                onClick={() => fetchAlerts(appliedFilters, searchQuery)}
                disabled={loading}
                size="md"
              >
                Refresh
              </Button>
            </div>
          </div>
        </Column>

        {/* Search and Filter Bar */}
        <Column lg={16} md={8} sm={4}>
          <div className="alerts-page__toolbar">
            <Search
              id="alert-search"
              labelText="Search alerts"
              placeholder="Search by device, description..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="alerts-page__search"
              size="lg"
            />
            <Button
              kind={activeFilterCount > 0 ? 'secondary' : 'tertiary'}
              renderIcon={Filter}
              onClick={() => setIsFilterPanelOpen(true)}
              className="alerts-page__filter-btn"
            >
              Filters
              {activeFilterCount > 0 && (
                <Tag type="high-contrast" size="sm" className="alerts-page__filter-count">
                  {activeFilterCount}
                </Tag>
              )}
            </Button>
          </div>
        </Column>

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <Column lg={16} md={8} sm={4}>
            <div className="alerts-page__active-filters">
              {appliedFilters.severity?.map(severity => (
                <Tag
                  key={`severity-${severity}`}
                  type="cool-gray"
                  filter
                  onClose={() => removeFilter('severity', severity)}
                >
                  Severity: {severity}
                </Tag>
              ))}
              {appliedFilters.status?.map(status => (
                <Tag
                  key={`status-${status}`}
                  type="cool-gray"
                  filter
                  onClose={() => removeFilter('status', status)}
                >
                  Status: {status}
                </Tag>
              ))}
              {hasActiveFilters && (
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={() => {
                    handleClearFilters();
                    setSearchQuery('');
                  }}
                  renderIcon={Close}
                >
                  Clear all
                </Button>
              )}
            </div>
          </Column>
        )}

        {/* Error Notification */}
        {error && (
          <Column lg={16} md={8} sm={4}>
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              onCloseButtonClick={() => setError(null)}
            />
          </Column>
        )}

        {/* Alerts List */}
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Column key={index} lg={8} md={4} sm={4}>
              <AlertCardSkeleton />
            </Column>
          ))
        ) : alerts.length === 0 ? (
          <Column lg={16} md={8} sm={4}>
            <div className="alerts-page__empty">
              <Warning size={48} />
              <p className="body-text">No alerts found</p>
              {hasActiveFilters && (
                <Button kind="tertiary" onClick={() => {
                  handleClearFilters();
                  setSearchQuery('');
                }}>
                  Clear filters
                </Button>
              )}
            </div>
          </Column>
        ) : (
          alerts.map(alert => (
            <Column key={alert.id} lg={8} md={4} sm={4}>
              <AlertCard alert={alert} />
            </Column>
          ))
        )}

        {/* Results Count */}
        {!loading && alerts.length > 0 && (
          <Column lg={16} md={8} sm={4}>
            <p className="alerts-page__count">
              Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </p>
          </Column>
        )}
      </Grid>

      {/* Filter Panel - Slides from Right */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedSeverities={selectedSeverities}
        selectedStatuses={selectedStatuses}
        onSeverityChange={setSelectedSeverities}
        onStatusChange={setSelectedStatuses}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
