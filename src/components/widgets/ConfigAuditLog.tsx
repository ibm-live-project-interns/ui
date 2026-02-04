import '@/styles/components/_kpi-card.scss';

export function ConfigAuditLog() {
    return (
        <div className="kpi-card" style={{ height: '100%' }}>
            <div className="kpi-header">
                <div className="kpi-title-group">
                    <span className="kpi-title">Config Audit Log</span>
                </div>
            </div>

            <div style={{ marginTop: '1rem', position: 'relative' }}>
                {/* Timeline line */}
                <div style={{
                    position: 'absolute',
                    left: '7px',
                    top: '8px',
                    bottom: '20px',
                    width: '2px',
                    backgroundColor: '#393939'
                }}></div>

                {/* Event 1 */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid #8d8d8d',
                        backgroundColor: '#161616',
                        zIndex: 1,
                        flexShrink: 0
                    }}></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>10:42 AM</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, margin: '2px 0' }}>
                            ACL updated on <span style={{ color: '#4589ff' }}>Core-01</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>by admin.chen</div>
                    </div>
                </div>

                {/* Event 2 */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid #8d8d8d',
                        backgroundColor: '#161616',
                        zIndex: 1,
                        flexShrink: 0
                    }}></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>09:15 AM</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, margin: '2px 0' }}>
                            Port security enabled on <span style={{ color: '#4589ff' }}>Switch-24</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>by system.auto</div>
                    </div>
                </div>

                {/* Event 3 */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid #8d8d8d',
                        backgroundColor: '#161616',
                        zIndex: 1,
                        flexShrink: 0
                    }}></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>Yesterday</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, margin: '2px 0' }}>
                            VLAN 200 Created
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>by admin.sarah</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
