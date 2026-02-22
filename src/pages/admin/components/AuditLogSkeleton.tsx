/**
 * Copyright IBM Corp. 2026
 *
 * AuditLogSkeleton - Loading skeleton displayed while audit log data is being fetched.
 */

import React from 'react';
import {
    DataTableSkeleton,
    SkeletonText,
    Tile,
} from '@carbon/react';
import { Download } from '@carbon/icons-react';

import { PageHeader, DataTableWrapper } from '@/components';
import { PageLayout } from '@/components/layout';

const TABLE_COLUMN_COUNT = 7;

export const AuditLogSkeleton = React.memo(function AuditLogSkeleton() {
    return (
        <PageLayout>
            <div className="audit-log-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Admin', href: '/dashboard' },
                        { label: 'Audit Log', active: true },
                    ]}
                    title="Audit Log"
                    subtitle="System-wide activity trail for compliance and security monitoring"
                    showBorder
                    actions={[
                        {
                            label: 'Export CSV',
                            onClick: () => {},
                            variant: 'primary',
                            icon: Download,
                            disabled: true,
                        },
                    ]}
                />

                <div className="audit-log-page__content">
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
                        title="Activity Log"
                        showFilter={false}
                        showRefresh={false}
                    >
                        <DataTableSkeleton
                            columnCount={TABLE_COLUMN_COUNT}
                            rowCount={10}
                            showHeader={false}
                            showToolbar={false}
                        />
                    </DataTableWrapper>
                </div>
            </div>
        </PageLayout>
    );
});
