import { ProgressBar } from '@carbon/react';
import { Network_4 } from '@carbon/icons-react';
import '@/styles/components/_kpi-card.scss';

export function TopInterfaces() {
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
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span>Gi1/0/24 (Uplink)</span>
                        <span>840 Mbps</span>
                    </div>
                    <ProgressBar
                        value={84}
                        max={100}
                        size="small"
                        className="custom-progress-bar"
                        label=""
                        helperText=""
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span>Te1/1/1 (Core-A)</span>
                        <span>4.2 Gbps</span>
                    </div>
                    <ProgressBar
                        value={92}
                        max={100}
                        size="small"
                        className="custom-progress-bar purple"
                        label=""
                        helperText=""
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span>Gi2/0/48 (WAP)</span>
                        <span>120 Mbps</span>
                    </div>
                    <ProgressBar
                        value={45}
                        max={100}
                        size="small"
                        className="custom-progress-bar teal"
                        label=""
                        helperText=""
                    />
                </div>
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
            `}</style>
        </div>
    );
}
