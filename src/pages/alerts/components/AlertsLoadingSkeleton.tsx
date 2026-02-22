/**
 * AlertsLoadingSkeleton - Skeleton loading state for the Priority Alerts page.
 * Renders placeholder KPI cards and a data table skeleton while data is being fetched.
 */

import React from 'react';
import {
    Button,
    DataTableSkeleton,
    SkeletonText,
    Tile,
} from '@carbon/react';
import { Download, Checkmark } from '@carbon/icons-react';

import { DataTableWrapper } from '@/components';
import { PageLayout } from '@/components/layout';
import { ALERT_TABLE_HEADERS } from './types';

export const AlertsLoadingSkeleton = React.memo(function AlertsLoadingSkeleton() {
    return (
        <PageLayout>
            <div className="priority-alerts-page">
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Priority Alerts</h1>
                        <p className="page-description">
                            Critical and high-priority network alerts requiring immediate attention
                        </p>
                    </div>
                    <div className="page-header-actions">
                        <Button kind="ghost" renderIcon={Download} disabled>
                            Export CSV
                        </Button>
                        <Button kind="primary" renderIcon={Checkmark} disabled>
                            Acknowledge All
                        </Button>
                    </div>
                </div>

                <div className="kpi-row">
                    {[1, 2, 3, 4].map((i) => (
                        <Tile key={i} className="kpi-card-skeleton">
                            <SkeletonText width="60%" />
                            <SkeletonText heading width="40%" />
                            <SkeletonText width="80%" />
                        </Tile>
                    ))}
                </div>

                <DataTableWrapper
                    title="Priority Alerts"
                    showFilter={false}
                    showRefresh={false}
                >
                    <DataTableSkeleton
                        columnCount={ALERT_TABLE_HEADERS.length}
                        rowCount={5}
                        showHeader={false}
                        showToolbar={false}
                    />
                </DataTableWrapper>
            </div>
        </PageLayout>
    );
});
