/**
 * Copyright IBM Corp. 2026
 *
 * GlobalSearch Component
 *
 * A modal-based global search that can be triggered by:
 * - Clicking the Search button in the header
 * - Pressing Cmd/Ctrl+K keyboard shortcut
 *
 * Searches across: Alerts, Tickets, Devices, and Pages.
 * Results are grouped by category with clickable navigation links.
 *
 * Result rendering is delegated to the SearchResultList sub-component.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search as SearchIcon,
    Close,
} from '@carbon/icons-react';
import { alertDataService, ticketDataService, deviceService } from '@/shared/services';
import { logger } from '@/shared/utils/logger';
import type { Alert } from '@/shared/types';
import type { TicketInfo, Device } from '@/shared/services';
import { SearchResultList } from './SearchResultList';
import type { SearchResult } from './SearchResultList';

// ==========================================
// Types
// ==========================================

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

// ==========================================
// Searchable Pages
// ==========================================

const SEARCHABLE_PAGES: SearchResult[] = [
    { id: 'dashboard', title: 'Dashboard', subtitle: 'Main operations dashboard', category: 'page', url: '/dashboard' },
    { id: 'priority-alerts', title: 'Priority Alerts', subtitle: 'View all active alerts', category: 'page', url: '/priority-alerts' },
    { id: 'tickets', title: 'Tickets', subtitle: 'Ticket management', category: 'page', url: '/tickets' },
    { id: 'devices', title: 'Devices', subtitle: 'Device inventory', category: 'page', url: '/devices' },
    { id: 'device-groups', title: 'Device Groups', subtitle: 'Organize devices into groups', category: 'page', url: '/device-groups' },
    { id: 'topology', title: 'Network Topology', subtitle: 'Network topology visualization', category: 'page', url: '/topology' },
    { id: 'trends', title: 'Trends & Insights', subtitle: 'Analytics and trends', category: 'page', url: '/trends' },
    { id: 'incident-history', title: 'Incident History', subtitle: 'Resolved incidents and root causes', category: 'page', url: '/incident-history' },
    { id: 'sla-reports', title: 'SLA Reports', subtitle: 'Service level agreement reports', category: 'page', url: '/reports/sla' },
    { id: 'reports', title: 'Reports Hub', subtitle: 'Reports and data exports', category: 'page', url: '/reports' },
    { id: 'service-status', title: 'Service Status', subtitle: 'Service health and availability', category: 'page', url: '/service-status' },
    { id: 'on-call', title: 'On-Call Schedule', subtitle: 'On-call rotation and overrides', category: 'page', url: '/on-call' },
    { id: 'configuration', title: 'Alert Configuration', subtitle: 'Alert rules and threshold settings', category: 'page', url: '/configuration' },
    { id: 'runbooks', title: 'Runbooks', subtitle: 'Knowledge base and runbook management', category: 'page', url: '/runbooks' },
    { id: 'settings', title: 'Settings', subtitle: 'User preferences and app settings', category: 'page', url: '/settings' },
    { id: 'profile', title: 'Profile', subtitle: 'User profile management', category: 'page', url: '/profile' },
    { id: 'audit-log', title: 'Audit Log', subtitle: 'System audit trail (admin)', category: 'page', url: '/admin/audit-log' },
    { id: 'post-mortems', title: 'Post-Mortems', subtitle: 'Incident post-mortem reports', category: 'page', url: '/incidents/post-mortems' },
];

// ==========================================
// GlobalSearch Component
// ==========================================

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure modal is rendered
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        } else {
            // Reset state when closing
            setQuery('');
            setResults([]);
            setSelectedIndex(-1);
        }
    }, [isOpen]);

    // Debounced search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const q = searchQuery.toLowerCase();
        const allResults: SearchResult[] = [];

        // 1. Search pages (instant, no API call)
        const matchingPages = SEARCHABLE_PAGES.filter(
            page => page.title.toLowerCase().includes(q) || page.subtitle.toLowerCase().includes(q)
        );
        allResults.push(...matchingPages);

        // 2. Search alerts
        try {
            const alerts = await alertDataService.getAlerts();
            const matchingAlerts = alerts
                .filter((alert: Alert) =>
                    alert.title?.toLowerCase().includes(q) ||
                    alert.description?.toLowerCase().includes(q) ||
                    alert.source?.toLowerCase().includes(q) ||
                    alert.device?.toLowerCase().includes(q) ||
                    alert.id?.toLowerCase().includes(q)
                )
                .slice(0, 5)
                .map((alert: Alert): SearchResult => ({
                    id: `alert-${alert.id}`,
                    title: alert.title || alert.description || alert.id,
                    subtitle: alert.source || alert.device || 'Unknown Device',
                    category: 'alert',
                    url: `/alerts/${alert.id}`,
                    severity: alert.severity,
                    status: alert.status,
                }));
            allResults.push(...matchingAlerts);
        } catch (error) {
            logger.debug('Global search: alerts fetch skipped', error);
        }

        // 3. Search tickets
        try {
            const tickets = await ticketDataService.getTickets();
            const matchingTickets = tickets
                .filter((ticket: TicketInfo) =>
                    ticket.title?.toLowerCase().includes(q) ||
                    (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(q)) ||
                    (ticket.deviceName && ticket.deviceName.toLowerCase().includes(q)) ||
                    ticket.id?.toLowerCase().includes(q)
                )
                .slice(0, 5)
                .map((ticket: TicketInfo): SearchResult => ({
                    id: `ticket-${ticket.id}`,
                    title: `${ticket.ticketNumber || ticket.id} - ${ticket.title}`,
                    subtitle: ticket.deviceName || 'Unknown Device',
                    category: 'ticket',
                    url: `/tickets/${ticket.id}`,
                    status: ticket.status,
                }));
            allResults.push(...matchingTickets);
        } catch (error) {
            logger.debug('Global search: tickets fetch skipped', error);
        }

        // 4. Search devices
        try {
            const devices = await deviceService.getDevices();
            const matchingDevices = devices
                .filter((device: Device) =>
                    device.name?.toLowerCase().includes(q) ||
                    device.ip?.toLowerCase().includes(q) ||
                    device.type?.toLowerCase().includes(q) ||
                    device.location?.toLowerCase().includes(q) ||
                    device.vendor?.toLowerCase().includes(q)
                )
                .slice(0, 5)
                .map((device: Device): SearchResult => ({
                    id: `device-${device.id}`,
                    title: device.name,
                    subtitle: `${device.ip} - ${device.type} (${device.location || 'Unknown'})`,
                    category: 'device',
                    url: `/devices/${device.id}`,
                    status: device.status,
                }));
            allResults.push(...matchingDevices);
        } catch (error) {
            logger.debug('Global search: devices fetch skipped', error);
        }

        setResults(allResults);
        setSelectedIndex(-1);
        setIsSearching(false);
    }, []);

    // Debounce the search query
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim()) {
            debounceRef.current = setTimeout(() => {
                performSearch(query);
            }, 300);
        } else {
            setResults([]);
            setIsSearching(false);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, performSearch]);

    // Handle result navigation
    const handleResultClick = useCallback((url: string) => {
        navigate(url);
        onClose();
    }, [navigate, onClose]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
            e.preventDefault();
            handleResultClick(results[selectedIndex].url);
        }
    }, [results, selectedIndex, handleResultClick, onClose]);

    // Click on overlay to close
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="global-search-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
        >
            <div className="global-search-modal" onKeyDown={handleKeyDown}>
                {/* Search Input */}
                <div className="global-search-input-row">
                    <SearchIcon size={20} className="global-search-input-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="global-search-input"
                        placeholder="Search pages, alerts, tickets, devices..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                        aria-label="Search"
                        role="combobox"
                        aria-expanded={results.length > 0}
                        aria-controls="global-search-results"
                        aria-autocomplete="list"
                    />
                    <div className="global-search-shortcut-hint">
                        <kbd>esc</kbd>
                    </div>
                    <button
                        className="global-search-close-btn"
                        onClick={onClose}
                        aria-label="Close search"
                    >
                        <Close size={20} />
                    </button>
                </div>

                {/* Results */}
                <div className="global-search-results" id="global-search-results" role="listbox">
                    {isSearching && (
                        <div className="global-search-loading">Searching...</div>
                    )}

                    {!isSearching && query.trim() && results.length === 0 && (
                        <div className="global-search-empty">
                            No results found for &ldquo;{query}&rdquo;
                        </div>
                    )}

                    {!isSearching && !query.trim() && (
                        <div className="global-search-hint">
                            <p>Type to search across pages, alerts, tickets, and devices.</p>
                            <div className="global-search-hint-shortcuts">
                                <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate</span>
                                <span><kbd>Enter</kbd> Open</span>
                                <span><kbd>Esc</kbd> Close</span>
                            </div>
                        </div>
                    )}

                    <SearchResultList
                        results={results}
                        selectedIndex={selectedIndex}
                        onResultClick={handleResultClick}
                    />
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="global-search-footer">
                        <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Hook for Cmd/Ctrl+K keyboard shortcut to open global search.
 * Returns [isOpen, setIsOpen] state.
 */
export function useGlobalSearchShortcut(): [boolean, (open: boolean) => void] {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K (Mac) or Ctrl+K (Win/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return [isOpen, setIsOpen];
}

export default GlobalSearch;
