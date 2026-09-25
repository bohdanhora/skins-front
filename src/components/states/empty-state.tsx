import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="border-border-strong rounded-3xl border border-dashed px-6 py-12 text-center">
    {icon ? (
      <div className="bg-surface-muted text-foreground-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl">
        {icon}
      </div>
    ) : null}
    <p className="text-foreground text-base font-semibold">{title}</p>
    <p className="text-foreground-muted mx-auto mt-1.5 max-w-sm text-sm leading-relaxed">
      {description}
    </p>
    {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
  </div>
);
