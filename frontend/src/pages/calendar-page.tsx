import { Plus, Search } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CaseView } from '@careflow/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CaseCard } from '@/features/cases/components/case-card';
import { DemoBar } from '@/features/cases/components/demo-bar';
import { formatDateBr, groupCases } from '@/features/cases/calendar-utils';
import { useOpenCases } from '@/features/cases/hooks';

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
      className={cn(
        'flex w-full shrink-0 flex-col gap-2 rounded-lg border bg-muted/25 p-2.5 md:w-64',
        tone === 'later' && 'border-dashed bg-transparent',
        tone === 'danger' && 'bg-card',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-0.5 pb-0.5">
        <h2
          className={cn(
            'text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground',
            tone === 'danger' && 'text-rose-700',
          )}
        >
          {title}
        </h2>
        {tone === 'danger' ? (
          <span className="size-1.5 rounded-full bg-rose-600" aria-hidden="true" />
        ) : null}
      </div>
      {cases.length === 0 ? (
        <p className="rounded-md border border-dashed bg-background/60 p-3 text-xs text-muted-foreground">
          Nenhum caso
        </p>
      ) : (
        <div className="space-y-2">
          {cases.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export function CalendarPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const query = useOpenCases(deferredSearch);

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 md:px-8 md:py-8">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar o calendário. Verifique a API e tente
            novamente.
          </CardContent>
        </Card>
      </div>
    );
  }

  const visibleCases = query.data.cases;
  const groups = groupCases(visibleCases, query.data.today);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Painel operacional
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Calendário de prazos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateBr(query.data.today)} · {visibleCases.length}{' '}
            {visibleCases.length === 1 ? 'caso aberto' : 'casos abertos'}
            {deferredSearch ? ` · busca “${deferredSearch}”` : ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/casos/novo">
            <Plus aria-hidden="true" />
            Novo caso
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, iniciais ou CNS"
            aria-label="Buscar por nome, iniciais ou CNS"
            className="pl-8"
          />
        </div>
        <div className="ml-auto">
          <DemoBar />
        </div>
      </div>

      {query.data.cases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-8">
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
          <CardContent className="p-8 text-sm text-muted-foreground">
            Nenhum caso encontrado para “{deferredSearch}”.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:overflow-x-auto">
          <Column
            title={`Vencidos (${groups.overdue.length})`}
            cases={groups.overdue}
            tone="danger"
          />
          {groups.weeks.map((week) => (
            <Column key={week.start} title={week.label} cases={week.cases} />
          ))}
          <Column
            title={`Depois (${groups.later.length})`}
            cases={groups.later}
            tone="later"
          />
        </div>
      )}
    </div>
  );
}
