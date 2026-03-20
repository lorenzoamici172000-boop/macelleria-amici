'use client';

import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/useLocale';

// ---- Loading State ----
export function LoadingState({ message, className = '' }: { message?: string; className?: string }) {
  const { t } = useLocale();
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <Loader2 size={32} className="animate-spin text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground">{message || t('common.loading')}</p>
    </div>
  );
}

// ---- Loading Skeleton ----
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-border overflow-hidden">
      <div className="aspect-square bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded w-full mt-3" />
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonGrid({ cols = 4, rows = 2 }: { cols?: number; rows?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-4`}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ---- Empty State ----
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-4 text-muted-foreground">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        action.href ? (
          <a href={action.href}>
            <Button>{action.label}</Button>
          </a>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}

// ---- Error State ----
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, onRetry, className = '' }: ErrorStateProps) {
  const { t } = useLocale();
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title || t('common.error')}</h3>
      {message && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{message}</p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw size={16} className="mr-2" /> {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

// ---- Success State ----
interface SuccessStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function SuccessState({ title, description, action }: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        action.href ? (
          <a href={action.href}><Button>{action.label}</Button></a>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}
