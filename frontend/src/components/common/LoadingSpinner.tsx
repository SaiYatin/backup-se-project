// ✅ frontend/src/components/common/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ 
  size = 'default',
  fullScreen = false 
}: { 
  size?: 'sm' | 'default' | 'lg',
  fullScreen?: boolean 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinner = (
    <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return spinner;
};