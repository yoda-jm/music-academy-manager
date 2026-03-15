import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md';
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
};

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className, padding = 'md', shadow = 'sm', ...rest }) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700',
        shadowStyles[shadow],
        padding !== 'none' && paddingStyles[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

Card.Header = function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};

Card.Body = function CardBody({ children, className }: CardBodyProps) {
  return <div className={className}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={clsx(
        'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
};
