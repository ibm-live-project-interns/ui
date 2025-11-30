import { Grid, Column, Button, Tile } from '@carbon/react';
import { ArrowRight, Activity, Network_2 as Network, IbmWatsonxCodeAssistant } from '@carbon/icons-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <Grid className="home-page">
      <Column lg={16} md={8} sm={4} className="home-page__hero">
        <h1 className="page-title">IBM watsonx Alerts</h1>
        <p className="page-description">
          AI-powered analysis of SNMP traps and syslogs. Get intelligent explanations,
          severity classification, and recommended actions for network events.
        </p>
        <div className="home-page__actions">
          <Button as={Link} to="/dashboard" renderIcon={ArrowRight} size="lg">
            Open Dashboard
          </Button>
          <Button as={Link} to="/alerts" kind="secondary" renderIcon={Activity} size="lg">
            View Alerts
          </Button>
        </div>
      </Column>

      <Column lg={5} md={4} sm={4}>
        <Tile className="home-page__feature-tile">
          <IbmWatsonxCodeAssistant size={32} className="home-page__feature-icon" />
          <h3 className="section-title">AI Explanations</h3>
          <p className="body-text">
            Watsonx-powered natural language explanations for every alert, helping you understand
            the root cause and impact of network events.
          </p>
        </Tile>
      </Column>

      <Column lg={5} md={4} sm={4}>
        <Tile className="home-page__feature-tile">
          <Activity size={32} className="home-page__feature-icon" />
          <h3 className="section-title">Severity Classification</h3>
          <p className="body-text">
            Automatic severity classification using LLM intelligence combined with rule-based
            engine for accurate prioritization.
          </p>
        </Tile>
      </Column>

      <Column lg={6} md={4} sm={4}>
        <Tile className="home-page__feature-tile">
          <Network size={32} className="home-page__feature-icon" />
          <h3 className="section-title">Recommended Actions</h3>
          <p className="body-text">
            Get actionable recommendations for each alert, including automatable commands
            and manual remediation steps.
          </p>
        </Tile>
      </Column>
    </Grid>
  );
}
