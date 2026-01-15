/**
 * Raw Trap Data Component
 * 
 * Displays the raw SNMP trap or syslog data with:
 * - Copy button to clipboard
 * - Source IP and timestamp
 * - Monospace code block
 */

import { useState } from 'react';
import { Tile, IconButton, Tooltip } from '@carbon/react';
import { Copy, Checkmark, Terminal, CalendarHeatMap } from '@carbon/icons-react';
import '../../styles/AlertDetailsPage.scss';

interface RawTrapDataProps {
    data: string;
    sourceIp: string;
    timestamp: string;
}

export function RawTrapData({ data, sourceIp, timestamp }: RawTrapDataProps) {
    const [copied, setCopied] = useState(false);

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
                <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'} align="left">
                    <IconButton
                        kind="ghost"
                        size="sm"
                        label={copied ? 'Copied' : 'Copy'}
                        onClick={handleCopy}
                    >
                        {copied ? <Checkmark size={16} /> : <Copy size={16} />}
                    </IconButton>
                </Tooltip>
            </div>

            <pre className="raw-trap-data__content">
                <code>{data}</code>
            </pre>

            <div className="raw-trap-data__footer">
                <span className="raw-trap-data__meta">
                    <Terminal size={14} />
                    Source: {sourceIp}
                </span>
                <span className="raw-trap-data__meta">
                    <CalendarHeatMap size={14} />
                    {timestamp}
                </span>
            </div>
        </Tile>
    );
}

export default RawTrapData;
