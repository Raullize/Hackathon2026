import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { PatientView } from '@careflow/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-client';
import { formatDateBr } from './calendar-utils';

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
      <main className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Link indisponível</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Este link expirou ou não está mais disponível. Procure a sua UBS.
          </CardContent>
        </Card>
      </main>
    );
  }

  const view = query.data;

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          CareFlow
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Seu acompanhamento
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
            <p>
              Dia {view.day} de {view.dayTotal}
            </p>
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
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {view.rights.map((right) => (
              <li key={right}>{right}</li>
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
