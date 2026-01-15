import { Grid, Column, Button, Tile, Stack } from '@carbon/react';
import { ArrowRight, Activity, Network_2 as Network, IbmWatsonxCodeAssistant } from '@carbon/icons-react';
import { Link } from 'react-router-dom';

export function WelcomePage() {
    return (
        <Grid fullWidth className="cds--grid--narrow">
            {/* Hero Section */}
            <Column
                lg={16}
                md={8}
                sm={4}
                style={{
                    marginTop: 'var(--cds-spacing-10)',
                    marginBottom: 'var(--cds-spacing-09)'
                }}
            >
                <Stack gap={6}>
                    <h1 className="cds--type-display-03">
                        IBM watsonx Alerts
                    </h1>
                    <p className="cds--type-body-02" style={{ maxWidth: '42rem' }}>
                        AI-powered analysis of SNMP traps and syslogs. Get intelligent explanations,
                        severity classification, and recommended actions for network events.
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: 'var(--cds-spacing-05)',
                        flexWrap: 'wrap',
                        marginTop: 'var(--cds-spacing-05)'
                    }}>
                        <Button
                            as={Link}
                            to="/dashboard"
                            renderIcon={ArrowRight}
                            size="lg"
                        >
                            Open Dashboard
                        </Button>
                        <Button
                            as={Link}
                            to="/priority-alerts"
                            kind="secondary"
                            renderIcon={Activity}
                            size="lg"
                        >
                            View Alerts
                        </Button>
                    </div>
                </Stack>
            </Column>

            {/* Features Grid */}
            <Column
                lg={5}
                md={4}
                sm={4}
                style={{ marginBottom: 'var(--cds-spacing-06)' }}
            >
                <Tile style={{
                    height: '100%',
                    padding: 'var(--cds-spacing-07)'
                }}>
                    <Stack gap={5}>
                        <IbmWatsonxCodeAssistant
                            size={32}
                            style={{ color: 'var(--cds-icon-primary)' }}
                        />
                        <h3 className="cds--type-heading-03">
                            AI Explanations
                        </h3>
                        <p className="cds--type-body-01">
                            Watsonx-powered natural language explanations for every alert, helping you understand
                            the root cause and impact of network events.
                        </p>
                    </Stack>
                </Tile>
            </Column>

            <Column
                lg={5}
                md={4}
                sm={4}
                style={{ marginBottom: 'var(--cds-spacing-06)' }}
            >
                <Tile style={{
                    height: '100%',
                    padding: 'var(--cds-spacing-07)'
                }}>
                    <Stack gap={5}>
                        <Activity
                            size={32}
                            style={{ color: 'var(--cds-icon-primary)' }}
                        />
                        <h3 className="cds--type-heading-03">
                            Severity Classification
                        </h3>
                        <p className="cds--type-body-01">
                            Automatic severity classification using LLM intelligence combined with rule-based
                            engine for accurate prioritization.
                        </p>
                    </Stack>
                </Tile>
            </Column>

            <Column
                lg={6}
                md={4}
                sm={4}
                style={{ marginBottom: 'var(--cds-spacing-06)' }}
            >
                <Tile style={{
                    height: '100%',
                    padding: 'var(--cds-spacing-07)'
                }}>
                    <Stack gap={5}>
                        <Network
                            size={32}
                            style={{ color: 'var(--cds-icon-primary)' }}
                        />
                        <h3 className="cds--type-heading-03">
                            Recommended Actions
                        </h3>
                        <p className="cds--type-body-01">
                            Get actionable recommendations for each alert, including automatable commands
                            and manual remediation steps.
                        </p>
                    </Stack>
                </Tile>
            </Column>
        </Grid>
    );
}

export default WelcomePage;
