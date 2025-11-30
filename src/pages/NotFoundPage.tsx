import { Grid, Column, Button } from '@carbon/react';
import { Home } from '@carbon/icons-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Grid className="not-found-page">
      <Column lg={16} md={8} sm={4}>
        <h1 className="not-found-page__code">404</h1>
        <p className="section-title">Page Not Found</p>
        <p className="body-text">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          as={Link}
          to="/"
          renderIcon={Home}
          className="not-found-page__button"
        >
          Go to Home
        </Button>
      </Column>
    </Grid>
  );
}
