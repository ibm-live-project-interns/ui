/**
 * Copyright IBM Corp. 2026
 *
 * PageLayout Component
 * Provides consistent page-level padding and content spacing.
 * Wraps page content with standardized layout structure.
 */

import React from 'react';
import './PageLayout.scss';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`page-layout ${className}`.trim()}>
      {children}
    </div>
  );
}

function PageLayoutContent({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`page-layout__content ${className}`.trim()}>
      {children}
    </div>
  );
}

PageLayout.Content = PageLayoutContent;
