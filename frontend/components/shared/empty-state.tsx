import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center', className)}>
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
