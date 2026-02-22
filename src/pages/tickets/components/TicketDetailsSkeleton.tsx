/**
 * Copyright IBM Corp. 2026
 *
 * TicketDetailsSkeleton - Loading skeleton for the Ticket Details page.
 * Displays a simple skeleton placeholder while ticket data is loading.
 */

import React from 'react';
import { SkeletonText } from '@carbon/react';
import { PageLayout } from '@/components/layout';

export const TicketDetailsSkeleton: React.FC = React.memo(function TicketDetailsSkeleton() {
    return (
        <PageLayout>
            <div className="ticket-details-page ticket-details-page--loading">
                <SkeletonText className="ticket-details-page__skeleton" />
            </div>
        </PageLayout>
    );
});
