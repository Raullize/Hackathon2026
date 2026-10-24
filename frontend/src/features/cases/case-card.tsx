import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CaseView } from '@careflow/contracts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateBr } from './calendar-utils';
import {
  badgeLabel,
  colorClasses,
  colorLabel,
  triggerLabel,
} from './labels';

export function CaseCard({ item }: { item: CaseView }) {
  const color = item.color ?? 'green';
  const Icon =
    color === 'red' ? CircleX : color === 'yellow' ? TriangleAlert : CircleCheck;
  const ariaLabel = `${item.initials}, dia ${item.day ?? '—'} de ${
    item.dayTotal ?? '—'
  }, prazo ${formatDateBr(item.dueDate)}, ${colorLabel[color]}`;

  return (
    <Link
      to={`/casos/${item.id}`}
      aria-label={ariaLabel}
      className="block focus-visible:outline-none"
    >
      <Card
        className={cn(
          'gap-2 border-l-4 py-3 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring',
          colorClasses[color],
        )}
      >
        <CardHeader className="px-3 pb-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{item.initials}</p>
              <p className="text-xs opacity-80">{triggerLabel[item.trigger]}</p>
            </div>
            <Badge variant="outline" className="bg-white/60">
              <Icon aria-hidden="true" />
              {colorLabel[color]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-3">
          <p className="text-sm font-medium">
            {item.day !== null && item.dayTotal
              ? `Dia ${item.day} de ${item.dayTotal}`
              : 'Caso encerrado'}
          </p>
          <p className="text-xs leading-snug">
            {item.nextStep?.label ?? 'Sem próximo passo'}
            {item.nextStep?.scheduledFor
              ? ` · ${formatDateBr(item.nextStep.scheduledFor)}`
              : ''}
          </p>
          <p className="text-xs opacity-75">
            Vence {formatDateBr(item.dueDate)}
          </p>
          {item.badges.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {item.badges.map((badge) => (
                <Badge
                  key={`${badge.type}-${badgeLabel(badge)}`}
                  variant="secondary"
                  className="bg-white/70 text-[10px]"
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
