import {
  Bell,
  Check,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Alert, CaseView, ContactChannel } from '@careflow/contracts';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatDateBr, todayInSaoPaulo } from '@/features/cases/calendar-utils';
import { caseKeys, useAlerts, useOpenCases } from '@/features/cases/hooks';
import {
  acknowledgeAlert,
  logContact,
  notifyPatient,
} from '@/features/cases/api';
import {
  alertReasonLabel as reasonLabel,
  alertRecipientLabel as recipientLabel,
} from '@/features/cases/labels';

const channels: Array<{
  value: Extract<ContactChannel, 'SMS' | 'EMAIL' | 'WHATSAPP'>;
  label: string;
  icon: typeof MessageSquare;
}> = [
  { value: 'SMS', label: 'SMS', icon: MessageSquare },
  { value: 'EMAIL', label: 'E-mail', icon: Mail },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
];

const urgentReasons = new Set([
  'OVERDUE',
  'OVERDUE_NO_CAPACITY',
  'LATE_ENTRY',
  'MISSED_DATE',
]);

type PatientChannel = Extract<ContactChannel, 'SMS' | 'EMAIL' | 'WHATSAPP'>;

function patientMessage(item: CaseView): string {
  const next = item.nextStep;
  if (!next?.scheduledFor) return '';
  const location = next.location ? `, em ${next.location}` : '';
  return (
    `Olá! Seu próximo passo é ${next.label}, em ` +
    `${formatDateBr(next.scheduledFor)}${location}. ` +
    'Se precisar remarcar, procure a sua UBS.'
  );
}

function channelLabel(channel: PatientChannel): string {
  return channels.find((item) => item.value === channel)?.label ?? channel;
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [sent, setSent] = useState<
    Record<string, { channel: ContactChannel; at: string }>
  >({});
  const [selectedCase, setSelectedCase] = useState<CaseView | null>(null);
  const [patientChannel, setPatientChannel] = useState<PatientChannel>('SMS');
  const [message, setMessage] = useState('');
  const alertsQuery = useAlerts();
  const casesQuery = useOpenCases('');

  const acknowledge = useMutation({
    mutationFn: (alert: Alert) =>
      acknowledgeAlert(alert.caseId, alert.key, todayInSaoPaulo()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: caseKeys.alerts });
      toast.success('Notificação marcada como ciente.');
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível registrar.',
      ),
  });

  const notify = useMutation({
    mutationFn: async ({
      alert,
      channel,
    }: {
      alert: Alert;
      channel: ContactChannel;
    }) => {
      await logContact(
        alert.caseId,
        channel,
        `Notificação: ${reasonLabel[alert.reason]}`,
        todayInSaoPaulo(),
      );
      return { alert, channel };
    },
    onSuccess: async ({ alert, channel }) => {
      setSent((current) => ({
        ...current,
        [alert.key]: {
          channel,
          at: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      }));
      await queryClient.invalidateQueries({ queryKey: caseKeys.alerts });
      const label = channels.find((item) => item.value === channel)?.label;
      toast.success(`${label} enviado para ${recipientLabel[alert.recipient]}.`);
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível notificar.',
      ),
  });

  const sendPatientMessage = useMutation({
    mutationFn: async () => {
      if (!selectedCase) throw new Error('Caso não selecionado');
      await notifyPatient(
        selectedCase.id,
        patientChannel,
        message,
        selectedCase.nextStep?.label ?? 'Próximo passo',
        todayInSaoPaulo(),
      );
      return { item: selectedCase, channel: patientChannel };
    },
    onSuccess: async ({ item, channel }) => {
      await queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success(
        `${channelLabel(channel)} simulado enviado para ${item.fullName}.`,
      );
      setSelectedCase(null);
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível avisar.',
      ),
  });

  if (alertsQuery.isLoading || casesQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 md:px-8 md:py-8">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (alertsQuery.isError || casesQuery.isError || !alertsQuery.data || !casesQuery.data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar as notificações.
          </CardContent>
        </Card>
      </div>
    );
  }

  const patientCases = casesQuery.data.cases.filter(
    (item) => item.nextStep?.scheduledFor,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Fila de atenção
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Notificações
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notificações de prazo e avisos para a paciente.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Avisos à paciente</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Casos com um passo marcado, como exame ou consulta.
          </p>
        </div>

        {patientCases.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
              <Check aria-hidden="true" className="size-4 text-emerald-600" />
              Nenhum passo com data marcada.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] gap-4 border-b bg-muted/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground md:grid">
              <span>Paciente</span>
              <span>Próximo passo</span>
              <span className="text-right">Aviso</span>
            </div>
            <div className="divide-y">
              {patientCases.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center md:gap-4"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/casos/${item.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {item.fullName}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.initials} · {item.nextStep?.location ?? 'Local a definir'}
                    </p>
                  </div>
                  <div className="pl-0 text-sm md:pl-0">
                    <p>{item.nextStep?.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {formatDateBr(item.nextStep?.scheduledFor ?? null)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 md:flex-col md:items-end">
                    {item.lastPatientNotification ? (
                      <p className="flex items-center gap-1 text-[11px] text-emerald-700">
                        <Check aria-hidden="true" className="size-3" />
                        {channelLabel(item.lastPatientNotification.channel)} enviado em{' '}
                        {formatDateBr(item.lastPatientNotification.occurredAt)}
                      </p>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setSelectedCase(item);
                          setPatientChannel('SMS');
                          setMessage(patientMessage(item));
                        }}
                      >
                        <Send aria-hidden="true" />
                        Avisar paciente
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Notificações de prazo</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {alertsQuery.data.length}{' '}
            {alertsQuery.data.length === 1
              ? 'notificação ativa'
              : 'notificações ativas'}
            , calculadas na leitura.
          </p>
        </div>

        {alertsQuery.data.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
              <Check aria-hidden="true" className="size-4 text-emerald-600" />
              Nenhuma notificação ativa neste momento.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 border-b bg-muted/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground md:grid">
              <span>Paciente e motivo</span>
              <span>Destinatário e ação</span>
              <span className="text-right">Referência</span>
            </div>
            <div className="divide-y">
              {alertsQuery.data.map((alert) => (
                <div
                  key={alert.key}
                  className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-start md:gap-4"
                >
                  <div className="flex min-w-0 gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-1.5 size-1.5 shrink-0 rounded-full',
                        urgentReasons.has(alert.reason)
                          ? 'bg-rose-600'
                          : 'bg-amber-500',
                      )}
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/casos/${alert.caseId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {alert.fullName}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {alert.initials}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1.5 h-4 px-1.5 text-[10px] font-normal"
                      >
                        {reasonLabel[alert.reason]}
                      </Badge>
                    </div>
                  </div>

                  <div className="pl-4 text-sm md:pl-0">
                    <p className="font-medium">
                      {recipientLabel[alert.recipient]}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {alert.action}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pl-4 md:flex-col md:items-end md:pl-0">
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {formatDateBr(alert.referenceDate)}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={notify.isPending}
                          >
                            <Send aria-hidden="true" />
                            Notificar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>Enviar por</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {channels.map(({ value, label, icon: Icon }) => (
                            <DropdownMenuItem
                              key={value}
                              onSelect={() =>
                                notify.mutate({ alert, channel: value })
                              }
                            >
                              <Icon aria-hidden="true" />
                              {label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {alert.acknowledgedAt ? (
                        <span className="text-[11px] text-muted-foreground">
                          Ciente em {formatDateBr(alert.acknowledgedAt)}
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => acknowledge.mutate(alert)}
                          disabled={acknowledge.isPending}
                        >
                          <Bell aria-hidden="true" />
                          Ciente
                        </Button>
                      )}
                    </div>
                    {sent[alert.key] ? (
                      <p className="flex items-center justify-end gap-1 text-[11px] text-emerald-700">
                        <Check aria-hidden="true" className="size-3" />
                        {channels.find(
                          (item) => item.value === sent[alert.key]?.channel,
                        )?.label}{' '}
                        enviado às {sent[alert.key]?.at}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <Dialog
        open={Boolean(selectedCase)}
        onOpenChange={(open) => {
          if (!open) setSelectedCase(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avisar paciente</DialogTitle>
            <DialogDescription>
              Revise a mensagem simulada antes de enviar.
            </DialogDescription>
          </DialogHeader>
          {selectedCase ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{selectedCase.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCase.nextStep?.label} ·{' '}
                  {formatDateBr(selectedCase.nextStep?.scheduledFor ?? null)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="patient-channel">
                  Canal
                </label>
                <Select
                  value={patientChannel}
                  onValueChange={(value) =>
                    setPatientChannel(value as PatientChannel)
                  }
                >
                  <SelectTrigger id="patient-channel" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="patient-message">
                  Mensagem
                </label>
                <Textarea
                  id="patient-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-28"
                />
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => sendPatientMessage.mutate()}
                disabled={
                  sendPatientMessage.isPending ||
                  message.trim().length === 0
                }
              >
                <Send aria-hidden="true" />
                {sendPatientMessage.isPending
                  ? 'Enviando...'
                  : `Enviar ${channelLabel(patientChannel).toLowerCase()}`}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
