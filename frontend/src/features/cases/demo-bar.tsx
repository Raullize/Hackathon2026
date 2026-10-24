import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs">
      <span className="font-medium">
        Demo: {formatDateBr(status.data.today)} (offset {status.data.offsetDays})
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => advance.mutate(1)}
        disabled={advance.isPending}
      >
        +1 dia
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => advance.mutate(7)}
        disabled={advance.isPending}
      >
        +7 dias
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => resetClock.mutate()}
        disabled={resetClock.isPending}
      >
        Resetar relógio
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => resetDemo.mutate()}
        disabled={resetDemo.isPending}
      >
        Recarregar demo
      </Button>
    </div>
  );
}
