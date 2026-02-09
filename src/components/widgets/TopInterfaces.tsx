/**
 * Top Interfaces Widget
 *
 * Displays the busiest network devices by alert count, derived from real
 * device data fetched via deviceService. Falls back to an empty state
 * when no data is available.
 */

import { useState, useEffect } from 'react';
import { ProgressBar, SkeletonText } from '@carbon/react';
import { Network_3, Network_4 } from '@carbon/icons-react';
import { deviceService } from '@/shared/services';
import type { Device } from '@/shared/services';
import { EmptyState } from '@/components/ui';
import '@/styles/components/_kpi-card.scss';

/** Color classes for the progress bars to give visual variety */
const BAR_COLORS = ['', 'purple', 'teal', 'blue', 'magenta'];

/** Maps a 0-based index to a CSS modifier class for the progress bar */
function getBarClass(index: number): string {
    const color = BAR_COLORS[index % BAR_COLORS.length];
    return color ? `custom-progress-bar ${color}` : 'custom-progress-bar';
}

export function TopInterfaces() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchDevices = async () => {
            try {
                const allDevices = await deviceService.getDevices();
                if (cancelled) return;

                // Sort by recentAlerts descending, then by lowest healthScore as tiebreaker
                const sorted = [...allDevices]
                    .sort((a, b) => {
                        const alertDiff = b.recentAlerts - a.recentAlerts;
                        if (alertDiff !== 0) return alertDiff;
                        return a.healthScore - b.healthScore;
                    })
                    .slice(0, 5);

                setDevices(sorted);
            } catch (error) {
                console.error('[TopInterfaces] Failed to fetch devices:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchDevices();
        const interval = setInterval(fetchDevices, 30000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    // Find the max alert count to normalize progress bars (100% = busiest device)
    const maxAlerts = devices.length > 0
        ? Math.max(...devices.map(d => d.recentAlerts), 1)
        : 1;

    return (
        <div className="kpi-card" style={{ height: '100%' }}>
            <div className="kpi-header">
                <div className="kpi-title-group">
                    <span className="kpi-title">Top Interfaces</span>
                </div>
                <div className="kpi-icon-wrapper">
                    <Network_4 size={20} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                {isLoading ? (
                    <>
                        {[1, 2, 3].map(i => (
                            <div key={i}>
                                <SkeletonText width="80%" />
                                <SkeletonText width="100%" style={{ marginTop: '0.5rem' }} />
                            </div>
                        ))}
                    </>
                ) : devices.length === 0 ? (
                    <EmptyState
                        icon={Network_3}
                        title="No device data available"
                        description="Device metrics will appear once devices are reporting"
                        size="sm"
                    />
                ) : (
                    devices.map((device, index) => {
                        const percentage = Math.round((device.recentAlerts / maxAlerts) * 100);
                        return (
                            <div key={device.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    <span>{device.name} ({device.ip})</span>
                                    <span>{device.recentAlerts} alert{device.recentAlerts !== 1 ? 's' : ''}</span>
                                </div>
                                <ProgressBar
                                    value={percentage}
                                    max={100}
                                    size="small"
                                    className={getBarClass(index)}
                                    label=""
                                    helperText=""
                                />
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                .custom-progress-bar .cds--progress-bar__bar {
                    background-color: #0f62fe;
                }
                .custom-progress-bar.purple .cds--progress-bar__bar {
                    background-color: #8a3ffc;
                }
                .custom-progress-bar.teal .cds--progress-bar__bar {
                    background-color: #009d9a;
                }
                .custom-progress-bar.blue .cds--progress-bar__bar {
                    background-color: #4589ff;
                }
                .custom-progress-bar.magenta .cds--progress-bar__bar {
                    background-color: #ee5396;
                }
            `}</style>
        </div>
    );
}
