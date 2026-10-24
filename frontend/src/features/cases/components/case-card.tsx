import { Link } from 'react-router-dom';
import type { CaseView } from '@careflow/contracts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateBr } from '../calendar-utils';
import {
  badgeLabel,
  colorAccentClasses,
  colorBarClasses,
  colorDotClasses,
  colorLabel,
  triggerLabel,
} from '../labels';

export function CaseCard({ item }: { item: CaseView }) {
  const color = item.color ?? 'green';
  const progress =
    item.day !== null && item.dayTotal
      ? Math.min(100, Math.max(0, (item.day / item.dayTotal) * 100))
      : 0;

  const ariaLabel = `${item.fullName}, dia ${item.day ?? '—'} de ${
    item.dayTotal ?? '—'
  }, prazo ${formatDateBr(item.dueDate)}, ${colorLabel[color]}`;

  return (
    <Link
      to={`/casos/${item.id}`}
      aria-label={ariaLabel}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          'gap-0 rounded-lg border-l-[3px] py-3 transition-colors hover:border-foreground/20 hover:bg-muted/20',
          colorAccentClasses[color],
        )}
      >
        <CardHeader className="px-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug break-words">
                {item.fullName}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.initials} · {triggerLabel[item.trigger]}
              </p>
            </div>
            <span className="mt-1 flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn('size-1.5 rounded-full', colorDotClasses[color])}
              />
              {colorLabel[color]}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 px-3">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium tabular-nums">
                {item.day !== null && item.dayTotal
                  ? `Dia ${item.day}`
                  : 'Encerrado'}
              </p>
              {item.dayTotal ? (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  de {item.dayTotal}
                </span>
              ) : null}
            </div>
            {item.dayTotal ? (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', colorBarClasses[color])}
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs leading-snug text-foreground">
              {item.nextStep?.label ?? 'Sem próximo passo'}
              {item.nextStep?.scheduledFor
                ? ` · ${formatDateBr(item.nextStep.scheduledFor)}`
                : ''}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Vence {formatDateBr(item.dueDate)}
            </p>
          </div>

          {item.badges.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {item.badges.map((badge) => (
                <Badge
                  key={`${badge.type}-${badgeLabel(badge)}`}
                  variant="outline"
                  className="h-4 px-1.5 text-[10px] font-normal text-muted-foreground"
                >
                  {badgeLabel(badge)}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
