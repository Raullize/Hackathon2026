import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { CaseListResponse, MetricValue, Metrics } from '@careflow/contracts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-client';
import { formatDateBr } from './calendar-utils';
import { colorLabel } from './labels';

function percent(metric: MetricValue): string {
  if (metric.value === null) return '—';
  return `${(metric.value * 100).toFixed(0)}%`;
}

function MetricCard({ title, metric }: { title: string; metric: MetricValue }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{percent(metric)}</p>
        <p className="text-xs text-muted-foreground">
          {metric.numerator} de {metric.denominator}
        </p>
      </CardContent>
    </Card>
  );
}

export function ClosedPage() {
  const casesQuery = useQuery({
    queryKey: ['cases', 'closed'],
    queryFn: () => apiFetch<CaseListResponse>('/cases?scope=closed'),
  });
  const metricsQuery = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiFetch<Metrics>('/metrics'),
  });

  if (casesQuery.isLoading || metricsQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 md:px-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
      </main>
    );
  }

  if (casesQuery.isError || metricsQuery.isError || !metricsQuery.data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar os concluídos.
          </CardContent>
        </Card>
      </main>
    );
  }

  const metrics = metricsQuery.data;
  const cases = casesQuery.data?.cases ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Concluídos</h1>
        <p className="text-sm text-muted-foreground">
          Hoje: {formatDateBr(metrics.today)} · {cases.length} caso(s) fechado(s)
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Sem informação" metric={metrics.withoutInformation} />
        <MetricCard title="Diagnóstico em até 30 dias" metric={metrics.diagnoses30} />
        <MetricCard title="Tratamento em até 60 dias" metric={metrics.treatments60} />
        <MetricCard title="IA sem alteração" metric={metrics.aiPrimary} />
        <MetricCard title="Campos da IA alterados" metric={metrics.aiSecondary} />
        <MetricCard title="Descoberta tardia" metric={metrics.lateEntry} />
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo até cadastro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.averageRequestToRegistrationDays === null
                ? '—'
                : `${metrics.averageRequestToRegistrationDays.toFixed(1)} d`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Encerrados por exceção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.closedExceptionCount}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Casos fechados</h2>
        {cases.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum caso fechado.
            </CardContent>
          </Card>
        ) : (
          cases.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link className="font-medium hover:underline" to={`/casos/${item.id}`}>
                    {item.initials}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Fechado em {formatDateBr(item.closedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    30 dias: {item.outcome30 ?? '—'}
                  </Badge>
                  <Badge variant="outline">
                    60 dias: {item.outcome60 ?? '—'}
                  </Badge>
                  {item.color ? (
                    <Badge variant="secondary">{colorLabel[item.color]}</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}
