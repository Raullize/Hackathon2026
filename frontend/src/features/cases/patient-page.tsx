import { Check, Route } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { PatientView } from '@careflow/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-client';
import { formatDateBr } from './calendar-utils';
import { cn } from '@/lib/utils';

export function PatientPage() {
  const { token } = useParams<{ token: string }>();
  const query = useQuery({
    queryKey: ['public-patient', token],
    queryFn: () => apiFetch<PatientView>(`/public/p/${token}`),
    enabled: Boolean(token),
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Link indisponível</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Este link expirou ou não está mais disponível. Procure a sua UBS.
          </CardContent>
        </Card>
      </div>
    );
  }

  const view = query.data;

  const progress =
    view.day !== null && view.dayTotal
      ? Math.min(100, Math.max(0, (view.day / view.dayTotal) * 100))
      : 0;

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Route aria-hidden="true" className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">CareFlow</p>
          <p className="text-[11px] text-muted-foreground">
            Acompanhamento da paciente
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Seu acompanhamento
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Próximo passo e direitos
        </h1>
      </div>

      {view.guidance ? (
        <Card>
          <CardContent className="p-4 text-sm">{view.guidance}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximo passo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">
            {view.nextStep?.label ?? 'Acompanhamento concluído'}
          </p>
          {view.nextStep?.scheduledFor ? (
            <p>Data: {formatDateBr(view.nextStep.scheduledFor)}</p>
          ) : null}
          {view.nextStep?.location ? (
            <p>Local: {view.nextStep.location}</p>
          ) : null}
          {view.day !== null && view.dayTotal ? (
            <div className="pt-1">
              <p className="text-sm font-medium tabular-nums">
                Dia {view.day} de {view.dayTotal}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    progress >= 80 ? 'bg-rose-600' : 'bg-primary',
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
          {view.dueDate ? (
            <p className="text-muted-foreground">
              Prazo: {formatDateBr(view.dueDate)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seus direitos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {view.rights.map((right) => (
              <li key={right} className="flex gap-2">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                />
                <span>{right}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {view.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda.
            </p>
          ) : (
            view.messages.map((message) => (
              <div key={message.id} className="rounded-md border p-3 text-sm">
                <p>{message.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateBr(message.occurredAt)} · SMS/e-mail
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
