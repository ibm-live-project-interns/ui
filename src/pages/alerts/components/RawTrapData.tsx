/**
 * Raw Trap Data Component
 *
 * Displays the raw SNMP trap or syslog data with:
 * - Copy button to clipboard
 * - Source IP and timestamp
 * - Monospace code block with syntax highlighting
 * - Formatted SNMP OID display
 */

import { useState, useMemo } from 'react';
import React from 'react';
import { Tile, IconButton, Tooltip, Tag } from '@carbon/react';
import { Copy, Checkmark, Terminal, CalendarHeatMap, DataFormat } from '@carbon/icons-react';
import '@/styles/pages/_alert-details.scss';

interface RawTrapDataProps {
    data: string;
    sourceIp: string;
    timestamp: string;
}

/**
 * Formats SNMP trap data for better readability
 * Highlights OIDs, values, and structures
 */
function formatSnmpData(data: string): React.ReactNode[] {
    if (!data) {
        return [<span key="empty">No raw data available</span>];
    }

    // Try to parse as JSON first
    try {
        const parsed = JSON.parse(data);
        return formatJsonData(parsed, 0);
    } catch {
        // Not JSON, try SNMP format
    }

    // Split by common SNMP delimiters
    const lines = data.split(/\n|;|\|/).filter(line => line.trim());

    return lines.map((line, index) => {
        const trimmed = line.trim();

        // OID pattern: starts with number and has dots
        const oidMatch = trimmed.match(/^([\d.]+)\s*[:=]\s*(.*)$/);
        if (oidMatch) {
            return (
                <div key={index} className="snmp-trap-formatted__section">
                    <span className="snmp-trap-formatted__oid">{oidMatch[1]}</span>
                    <span> = </span>
                    <span className="snmp-trap-formatted__value">{formatValue(oidMatch[2])}</span>
                </div>
            );
        }

        // Key-value pattern
        const kvMatch = trimmed.match(/^([^:=]+)\s*[:=]\s*(.*)$/);
        if (kvMatch) {
            return (
                <div key={index} className="snmp-trap-formatted__section">
                    <span className="snmp-trap-formatted__label">{kvMatch[1].trim()}</span>
                    <span>: </span>
                    <span className="snmp-trap-formatted__value">{formatValue(kvMatch[2])}</span>
                </div>
            );
        }

        // Plain line
        return (
            <div key={index} className="snmp-trap-formatted__section">
                {trimmed}
            </div>
        );
    });
}

/**
 * Format JSON data with syntax highlighting
 */
function formatJsonData(obj: unknown, depth: number): React.ReactNode[] {
    const indent = '  '.repeat(depth);
    const elements: React.ReactNode[] = [];

    if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                const children = formatJsonData(item, depth + 1);
                elements.push(
                    <div key={`arr-${depth}-${index}`} className="snmp-trap-formatted__section">
                        {indent}<span className="snmp-trap-formatted__label">[{index}]</span>
                        {children}
                    </div>
                );
            });
        } else {
            Object.entries(obj).forEach(([key, value], index) => {
                const isOid = /^[\d.]+$/.test(key);
                elements.push(
                    <div key={`obj-${depth}-${index}`} className="snmp-trap-formatted__section">
                        {indent}
                        <span className={isOid ? 'snmp-trap-formatted__oid' : 'snmp-trap-formatted__label'}>
                            {key}
                        </span>
                        <span>: </span>
                        {typeof value === 'object' ? (
                            <>{formatJsonData(value, depth + 1)}</>
                        ) : (
                            <span className="snmp-trap-formatted__value">{formatValue(String(value))}</span>
                        )}
                    </div>
                );
            });
        }
    } else {
        elements.push(
            <span key={`val-${depth}`} className="snmp-trap-formatted__value">
                {formatValue(String(obj))}
            </span>
        );
    }

    return elements;
}

/**
 * Format individual values with appropriate styling
 */
function formatValue(value: string): React.ReactNode {
    const trimmed = value.trim();

    // Timestamp pattern
    if (/^\d{4}-\d{2}-\d{2}|^\d{2}:\d{2}:\d{2}/.test(trimmed)) {
        return <span className="snmp-trap-formatted__timestamp">{trimmed}</span>;
    }

    // Number pattern
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return <span className="snmp-trap-formatted__number">{trimmed}</span>;
    }

    // String in quotes
    if (/^["'].*["']$/.test(trimmed)) {
        return <span className="snmp-trap-formatted__string">{trimmed}</span>;
    }

    // Default
    return <span>{trimmed}</span>;
}

export function RawTrapData({ data, sourceIp, timestamp }: RawTrapDataProps) {
    const [copied, setCopied] = useState(false);
    const [formatted, setFormatted] = useState(true);

    const formattedData = useMemo(() => formatSnmpData(data), [data]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(data);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Tile className="raw-trap-data">
            <div className="raw-trap-data__header">
                <h4 className="raw-trap-data__title">Raw SNMP Trap Data</h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Tag type={formatted ? 'green' : 'gray'} size="sm">
                        {formatted ? 'Formatted' : 'Raw'}
                    </Tag>
                    <Tooltip label={formatted ? 'Show raw' : 'Format data'} align="left">
                        <IconButton
                            kind="ghost"
                            size="sm"
                            label="Toggle format"
                            onClick={() => setFormatted(!formatted)}
                        >
                            <DataFormat size={16} />
                        </IconButton>
                    </Tooltip>
                    <IconButton
                        kind="ghost"
                        size="sm"
                        label={copied ? 'Copied!' : 'Copy to clipboard'}
                        onClick={handleCopy}
                    >
                        {copied ? <Checkmark size={16} /> : <Copy size={16} />}
                    </IconButton>
                </div>
            </div>

            <pre className="raw-trap-data__content">
                {formatted ? (
                    <code className="snmp-trap-formatted">{formattedData}</code>
                ) : (
                    <code>{data || 'No raw data available'}</code>
                )}
            </pre>

            <div className="raw-trap-data__footer">
                <span className="raw-trap-data__meta">
                    <Terminal size={14} />
                    Source: {sourceIp || 'N/A'}
                </span>
                <span className="raw-trap-data__meta">
                    <CalendarHeatMap size={14} />
                    {timestamp || 'N/A'}
                </span>
            </div>
        </Tile>
    );
}

export default RawTrapData;
