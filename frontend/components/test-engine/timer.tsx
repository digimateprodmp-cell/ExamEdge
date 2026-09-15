import { cn } from '@/lib/utils';

export function Timer({ secondsLeft }: { secondsLeft: number }) {
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const isLow = secondsLeft <= 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums',
        isLow ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border bg-secondary',
      )}
    >
      {hours > 0 && <span>{pad(hours)}:</span>}
      <span>{pad(minutes)}:{pad(seconds)}</span>
    </div>
  );
}
