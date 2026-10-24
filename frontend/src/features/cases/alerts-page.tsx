import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Alert } from '@careflow/contracts';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, apiFetch } from '@/lib/api-client';
import { formatDateBr, todayInSaoPaulo } from './calendar-utils';
import { alertReasonLabel as reasonLabel, alertRecipientLabel as recipientLabel } from './labels';

export function AlertsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiFetch<Alert[]>('/alerts'),
  });

  const acknowledge = useMutation({
    mutationFn: (alert: Alert) =>
      apiFetch(`/cases/${alert.caseId}/events`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'ALERT_ACKNOWLEDGED',
          occurredAt: todayInSaoPaulo(),
          alertKey: alert.key,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alerta marcado como ciente.');
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível registrar.',
      ),
  });

  if (query.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-3 px-4 py-6 md:px-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar os alertas.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
        <p className="text-sm text-muted-foreground">
          {query.data.length} alerta(s) ativo(s), calculados na leitura.
        </p>
      </div>

      {query.data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum alerta agora.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {query.data.map((alert) => (
            <Card key={alert.key}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link className="hover:underline" to={`/casos/${alert.caseId}`}>
                      {alert.fullName}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {alert.initials}
                      </span>
                    </Link>
                  </CardTitle>
                  <Badge variant="outline">{reasonLabel[alert.reason]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Destinatário:</span>{' '}
                  {recipientLabel[alert.recipient]}
                </p>
                <p>
                  <span className="font-medium">Ação:</span> {alert.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  Referência: {formatDateBr(alert.referenceDate)}
                </p>
                {alert.acknowledgedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Ciente em {formatDateBr(alert.acknowledgedAt)}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledge.mutate(alert)}
                    disabled={acknowledge.isPending}
                  >
                    Ciente
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
