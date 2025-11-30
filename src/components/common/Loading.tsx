import { Loading as CarbonLoading } from '@carbon/react';

interface LoadingProps {
  active?: boolean;
  description?: string;
  withOverlay?: boolean;
  small?: boolean;
}

export function Loading({
  active = true,
  description = 'Loading...',
  withOverlay = false,
  small = false,
}: LoadingProps) {
  return (
    <CarbonLoading
      active={active}
      description={description}
      withOverlay={withOverlay}
      small={small}
    />
  );
}
