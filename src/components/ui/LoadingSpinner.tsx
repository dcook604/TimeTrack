import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const variantClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary-foreground'
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )} 
      />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner; 