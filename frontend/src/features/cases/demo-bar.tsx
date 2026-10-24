import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { formatDateBr } from './calendar-utils';

interface DemoStatus {
  today: string;
  offsetDays: number;
}

export function DemoBar() {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const status = useQuery({
    queryKey: ['demo-status'],
    queryFn: () => apiFetch<DemoStatus>('/demo/status'),
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['demo-status'] });
    await queryClient.invalidateQueries({ queryKey: ['cases'] });
    await queryClient.invalidateQueries({ queryKey: ['case'] });
    await queryClient.invalidateQueries({ queryKey: ['alerts'] });
    await queryClient.invalidateQueries({ queryKey: ['metrics'] });
  };

  const advance = useMutation({
    mutationFn: (days: number) =>
      apiFetch<DemoStatus>('/demo/clock/advance', {
        method: 'POST',
        body: JSON.stringify({ days }),
      }),
    onSuccess: async () => {
      await invalidate();
      toast.success('Relógio avançado.');
    },
    onError: () => toast.error('Não foi possível avançar o relógio.'),
  });

  const resetClock = useMutation({
    mutationFn: () =>
      apiFetch<DemoStatus>('/demo/clock/reset', { method: 'POST' }),
    onSuccess: invalidate,
    onError: () => toast.error('Não foi possível resetar o relógio.'),
  });

  const resetDemo = useMutation({
    mutationFn: () =>
      apiFetch<{ cases: number }>('/demo/reset', { method: 'POST' }),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Demo recarregada com ${data.cases} casos.`);
    },
    onError: () => toast.error('Não foi possível recarregar a demo.'),
  });

  if (status.isError || !status.data) {
    return null;
  }

  if (collapsed) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setCollapsed(false)}
        aria-label="Abrir simulação de tempo"
        aria-expanded={false}
        title={`Simulação de tempo · ${formatDateBr(status.data.today)}`}
        className="border-dashed text-muted-foreground"
      >
        <CalendarClock aria-hidden="true" />
      </Button>
    );
  }

  const offset = status.data.offsetDays;
  const offsetLabel =
    offset === 0 ? 'hoje real' : `${offset > 0 ? '+' : ''}${offset} dia(s)`;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-card px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2 pr-1">
        <CalendarClock aria-hidden="true" className="size-4 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Simulação de tempo
          </p>
          <p className="text-xs font-medium tabular-nums">
            {formatDateBr(status.data.today)}
            <span className="ml-2 font-normal text-muted-foreground">
              {offsetLabel}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="xs"
          variant="outline"
          onClick={() => advance.mutate(1)}
          disabled={advance.isPending}
        >
          +1 dia
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => advance.mutate(7)}
          disabled={advance.isPending}
        >
          +7 dias
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => resetClock.mutate()}
          disabled={resetClock.isPending}
        >
          <RotateCcw aria-hidden="true" />
          Zerar
        </Button>
        <Button
          size="xs"
          variant="secondary"
          onClick={() => resetDemo.mutate()}
          disabled={resetDemo.isPending}
        >
          Recarregar demo
        </Button>
      </div>

      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        onClick={() => setCollapsed(true)}
        aria-label="Minimizar simulação de tempo"
        aria-expanded={true}
        className="ml-auto text-muted-foreground"
        title="Minimizar"
      >
        <ChevronUp aria-hidden="true" />
      </Button>
    </div>
  );
}
