import {
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { CaseListResponse, MetricValue, Metrics } from '@careflow/contracts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { casesUrl, formatDateBr } from './calendar-utils';

const PAGE_SIZE = 8;

function percent(metric: MetricValue): string {
  if (metric.value === null) return '—';
  return `${(metric.value * 100).toFixed(0)}%`;
}

function outcomeLabel(value: string | null | undefined): string {
  switch (value) {
    case 'MET':
      return 'Cumpriu';
    case 'NOT_MET':
      return 'Não cumpriu';
    case 'MET_UNTIL_CLOSE':
      return 'Cumpriu até o encerramento';
    case 'NOT_APPLICABLE':
      return 'Não se aplica';
    default:
      return '—';
  }
}

function outcomeClass(value: string | null | undefined): string {
  switch (value) {
    case 'MET':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'NOT_MET':
      return 'border-rose-200 bg-rose-50 text-rose-800';
    case 'MET_UNTIL_CLOSE':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    default:
      return 'border-border bg-transparent text-muted-foreground';
  }
}

function Metric({
  label,
  metric,
}: {
  label: string;
  metric: MetricValue;
}) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {percent(metric)}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
        {metric.numerator} de {metric.denominator}
      </p>
    </div>
  );
}

export function ClosedPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);
  const casesQuery = useQuery({
    queryKey: ['cases', 'closed', deferredSearch, page],
    queryFn: () =>
      apiFetch<CaseListResponse>(
        casesUrl('closed', deferredSearch, page, PAGE_SIZE),
      ),
    placeholderData: keepPreviousData,
  });
  const metricsQuery = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiFetch<Metrics>('/metrics'),
  });

  const total = casesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (casesQuery.isLoading || metricsQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 md:px-8 md:py-8">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (casesQuery.isError || metricsQuery.isError || !metricsQuery.data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <Card className="p-6 text-sm text-destructive">
          Não foi possível carregar os concluídos.
        </Card>
      </div>
    );
  }

  const metrics = metricsQuery.data;
  const cases = casesQuery.data?.cases ?? [];
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Resultado e encerramento
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Concluídos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateBr(metrics.today)} · {total}{' '}
          {total === 1 ? 'caso encerrado' : 'casos encerrados'}
          {deferredSearch ? ` · busca “${deferredSearch}”` : ''}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">Qualidade do acompanhamento</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Indicadores calculados sobre os casos encerrados.
          </p>
        </div>
        <div className="grid divide-y sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          <Metric label="Sem informação" metric={metrics.withoutInformation} />
          <Metric label="Diagnóstico em até 30 d" metric={metrics.diagnoses30} />
          <Metric label="Tratamento em até 60 d" metric={metrics.treatments60} />
          <Metric label="Descoberta tardia" metric={metrics.lateEntry} />
          <Metric label="IA sem alteração" metric={metrics.aiPrimary} />
          <Metric label="Campos da IA alterados" metric={metrics.aiSecondary} />
          <div className="px-4 py-3.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Tempo até cadastro
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {metrics.averageRequestToRegistrationDays === null
                ? '—'
                : `${metrics.averageRequestToRegistrationDays.toFixed(1)} d`}
            </p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Encerrados por exceção
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {metrics.closedExceptionCount}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Casos fechados</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Consulte o resultado e o último marco de cada caso.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, iniciais ou CNS"
            aria-label="Buscar por nome, iniciais ou CNS"
            className="pl-8"
          />
        </div>
      </div>

      {cases.length === 0 ? (
        <Card className="p-8 text-sm text-muted-foreground">
          {deferredSearch
            ? `Nenhum caso encontrado para “${deferredSearch}”.`
            : 'Nenhum caso fechado.'}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] gap-4 border-b bg-muted/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground md:grid">
            <span>Paciente</span>
            <span>30 dias</span>
            <span>60 dias</span>
            <span className="text-right">Último marco</span>
          </div>

          <div className="divide-y">
            {cases.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <Link
                    className="text-sm font-medium hover:underline"
                    to={`/casos/${item.id}`}
                  >
                    {item.fullName}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {item.initials}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground md:hidden">
                    30 dias:{' '}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn('font-normal', outcomeClass(item.outcome30))}
                  >
                    {outcomeLabel(item.outcome30)}
                  </Badge>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground md:hidden">
                    60 dias:{' '}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn('font-normal', outcomeClass(item.outcome60))}
                  >
                    {outcomeLabel(item.outcome60)}
                  </Badge>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {formatDateBr(
                      item.closedAt ?? item.treatmentStartedAt ?? item.reportDate,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
            <p className="text-[11px] text-muted-foreground tabular-nums">
              Mostrando {start}–{end} de {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                Página {page} de {totalPages}
              </span>
              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages}
                aria-label="Próxima página"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
