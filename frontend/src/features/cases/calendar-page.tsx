import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { CaseListResponse, CaseView } from '@careflow/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-client';
import { CaseCard } from './case-card';
import { DemoBar } from './demo-bar';
import { casesUrl, formatDateBr, groupCases } from './calendar-utils';

function Column({
  title,
  cases,
  tone = 'default',
}: {
  title: string;
  cases: CaseView[];
  tone?: 'default' | 'danger' | 'later';
}) {
  return (
    <section
      className={
        tone === 'danger'
          ? 'flex w-full shrink-0 flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50/40 p-3 md:w-64'
          : tone === 'later'
            ? 'flex w-full shrink-0 flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-3 md:w-64'
            : 'flex w-full shrink-0 flex-col gap-2 rounded-lg border bg-background p-3 md:w-64'
      }
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {cases.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Nenhum caso
        </p>
      ) : (
        cases.map((item) => <CaseCard key={item.id} item={item} />)
      )}
    </section>
  );
}

export function CalendarPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({
    queryKey: ['cases', 'open', deferredSearch],
    queryFn: () => apiFetch<CaseListResponse>(casesUrl('open', deferredSearch)),
  });

  if (query.isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar o calendário. Verifique a API e tente
            novamente.
          </CardContent>
        </Card>
      </main>
    );
  }

  const visibleCases = query.data.cases;
  const groups = groupCases(visibleCases, query.data.today);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground">
            Hoje: {formatDateBr(query.data.today)} · {visibleCases.length}{' '}
            caso(s) aberto(s)
            {deferredSearch ? ` · busca “${deferredSearch}”` : ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/casos/novo">Novo caso</Link>
        </Button>
      </div>

      <DemoBar />

      <Input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nome, iniciais ou CNS"
        aria-label="Buscar por nome, iniciais ou CNS"
        className="max-w-sm"
      />

      {query.data.cases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-muted-foreground">
              Nenhum caso aberto. Cadastre o primeiro a partir do pedido da UBS.
            </p>
            <Button asChild variant="outline">
              <Link to="/casos/novo">Cadastrar caso</Link>
            </Button>
          </CardContent>
        </Card>
      ) : visibleCases.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum caso encontrado para “{deferredSearch}”.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3 md:flex-row md:overflow-x-auto md:pb-2">
          <Column
            title={`Vencidos (${groups.overdue.length})`}
            cases={groups.overdue}
            tone="danger"
          />
          {groups.weeks.map((week) => (
            <Column
              key={week.start}
              title={week.label}
              cases={week.cases}
            />
          ))}
          <Column
            title={`Depois (${groups.later.length})`}
            cases={groups.later}
            tone="later"
          />
        </div>
      )}
    </main>
  );
}
