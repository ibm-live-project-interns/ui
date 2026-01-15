import { InlineNotification, ToastNotification } from '@carbon/react';

type NotificationKind = 'error' | 'info' | 'info-square' | 'success' | 'warning' | 'warning-alt';

interface ErrorMessageProps {
  title?: string;
  subtitle?: string;
  kind?: NotificationKind;
  onClose?: () => void;
  variant?: 'inline' | 'toast';
}

export function ErrorMessage({
  title = 'Error',
  subtitle = 'Something went wrong. Please try again.',
  kind = 'error',
  onClose,
  variant = 'inline',
}: ErrorMessageProps) {
  if (variant === 'toast') {
    return (
      <ToastNotification
        kind={kind}
        title={title}
        subtitle={subtitle}
        onClose={onClose}
        timeout={5000}
      />
    );
  }

  return (
    <InlineNotification
      kind={kind}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
    />
  );
}
