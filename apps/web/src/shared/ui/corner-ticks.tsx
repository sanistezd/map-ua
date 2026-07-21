import { cn } from '@/shared/lib';

const corners = [
  '-top-1.5 -left-1.5 border-t-2 border-l-2',
  '-top-1.5 -right-1.5 border-t-2 border-r-2',
  '-bottom-1.5 -left-1.5 border-b-2 border-l-2',
  '-bottom-1.5 -right-1.5 border-b-2 border-r-2',
] as const;

/** Registration-mark corners for the drafting-sheet visual language. Decorative. */
export function CornerTicks({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      aria-hidden="true"
    >
      {corners.map((position) => (
        <span
          key={position}
          className={cn('absolute h-4 w-4 border-signal', position)}
        />
      ))}
    </div>
  );
}
