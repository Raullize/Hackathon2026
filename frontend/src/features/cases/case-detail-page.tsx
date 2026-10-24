import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import type {
  AccessTokenResponse,
  Alert,
  CaseDetail,
  CaseEventInput,
  CaseEventType,
  ReportExtractionView,
  TreatmentType,
  ExceptionReason,
  ContactChannel,
  CloseReason,
  Malignancy,
} from '@careflow/contracts';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiError, apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  formatDateBr,
  todayInSaoPaulo,
} from './calendar-utils';
import {
  alertReasonLabel,
  alertRecipientLabel,
  badgeLabel,
  colorClasses,
  colorLabel,
  statusLabel,
  triggerLabel,
} from './labels';

const eventLabel: Partial<Record<CaseEventType, string>> = {
  CASE_CREATED: 'Caso criado',
  EXAM_SCHEDULED: 'Exame agendado',
  EXAM_DONE: 'Exame realizado',
  REPORT_RECEIVED: 'Laudo recebido',
  REPORT_CONFIRMED: 'Laudo confirmado',
  TREATMENT_STARTED: 'Tratamento iniciado',
  EXCEPTION_NOTED: 'Exceção registrada',
  CASE_CLOSED_EXCEPTION: 'Caso encerrado por exceção',
  CORRECTION: 'Correção',
  ALERT_ACKNOWLEDGED: 'Ciente de alerta',
  CONTACT_LOGGED: 'Cobrança registrada',
};

const actionLabel: Partial<Record<CaseEventType, string>> = {
  EXAM_SCHEDULED: 'Agendar exame',
  EXAM_DONE: 'Registrar exame realizado',
  REPORT_RECEIVED: 'Registrar laudo recebido',
  TREATMENT_STARTED: 'Registrar início do tratamento',
  EXCEPTION_NOTED: 'Registrar exceção',
  CONTACT_LOGGED: 'Registrar cobrança',
  CASE_CLOSED_EXCEPTION: 'Encerrar caso',
};

const exceptionLabels: Record<ExceptionReason, string> = {
  REFUSAL: 'Recusa',
  ABSENCE: 'Ausência',
  CONTRAINDICATION: 'Contraindicação',
  CLINICAL_PENDING: 'Pendência clínica',
  TRANSPORT: 'Transporte',
  NO_CAPACITY: 'Falta de vaga',
};

const channelLabels: Record<ContactChannel, string> = {
  PHONE: 'Ligação',
  EMAIL: 'E-mail',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
};

const closeLabels: Record<CloseReason, string> = {
  DEFINITIVE_REFUSAL: 'Recusa definitiva',
  DEATH: 'Óbito',
};

function asErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir.';
}

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<CaseEventType | ''>('');
  const [eventDate, setEventDate] = useState(todayInSaoPaulo());
  const [examLabel, setExamLabel] = useState('biópsia');
  const [scheduledFor, setScheduledFor] = useState('');
  const [location, setLocation] = useState('');
  const [treatmentType, setTreatmentType] =
    useState<TreatmentType>('SURGERY');
  const [exceptionReason, setExceptionReason] =
    useState<ExceptionReason>('NO_CAPACITY');
  const [note, setNote] = useState('');
  const [contactChannel, setContactChannel] =
    useState<ContactChannel>('PHONE');
  const [closeReason, setCloseReason] =
    useState<CloseReason>('DEFINITIVE_REFUSAL');
  const [reportText, setReportText] = useState('');
  const [extraction, setExtraction] = useState<ReportExtractionView | null>(
    null,
  );
  const [confirmExamType, setConfirmExamType] = useState('');
  const [confirmReportDate, setConfirmReportDate] = useState('');
  const [confirmMalignancy, setConfirmMalignancy] =
    useState<Malignancy>('inconclusive');
  const [confirmEvidence, setConfirmEvidence] = useState('');
  const [link, setLink] = useState<AccessTokenResponse | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['case', id],
    queryFn: () => apiFetch<CaseDetail>(`/cases/${id}`),
    enabled: Boolean(id),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['case', id] });
    await queryClient.invalidateQueries({ queryKey: ['cases'] });
    await queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  const eventMutation = useMutation({
    mutationFn: (event: CaseEventInput) =>
      apiFetch(`/cases/${id}/events`, {
        method: 'POST',
        body: JSON.stringify(event),
      }),
    onSuccess: async () => {
      await invalidate();
      setAction('');
      setNote('');
      setScheduledFor('');
      setLocation('');
      toast.success('Evento registrado.');
    },
    onError: (error) => toast.error(asErrorMessage(error)),
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      apiFetch<AccessTokenResponse>(`/cases/${id}/access-tokens`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setLink(data);
      setLinkOpen(true);
    },
    onError: (error) => toast.error(asErrorMessage(error)),
  });

  const extractionMutation = useMutation({
    mutationFn: () =>
      apiFetch<ReportExtractionView>(`/cases/${id}/report-extractions`, {
        method: 'POST',
        body: JSON.stringify({ reportText }),
      }),
    onSuccess: (data) => {
      setExtraction(data);
      setConfirmExamType(data.suggestion.examType);
      setConfirmReportDate(data.suggestion.reportDate ?? '');
      setConfirmMalignancy(data.suggestion.malignancy);
      setConfirmEvidence(data.suggestion.evidenceQuote);
      toast.success('Laudo estruturado. Revise e confirme.');
    },
    onError: (error) => toast.error(asErrorMessage(error)),
  });

  if (detailQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 md:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Caso não encontrado ou API indisponível.
          </CardContent>
        </Card>
      </main>
    );
  }

  const detail = detailQuery.data;
  const allowed = new Set(detail.allowedEventTypes);
  const availableActions = (Object.keys(actionLabel) as CaseEventType[]).filter(
    (type) => allowed.has(type),
  );
  const color = detail.color ?? 'green';

  function submitEvent(event: CaseEventInput) {
    eventMutation.mutate(event);
  }

  function handleActionSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!action) return;

    let event: CaseEventInput;
    switch (action) {
      case 'EXAM_SCHEDULED':
        event = {
          type: action,
          occurredAt: eventDate,
          examLabel,
          scheduledFor,
          location,
        };
        break;
      case 'EXAM_DONE':
        event = { type: action, occurredAt: eventDate, examLabel };
        break;
      case 'REPORT_RECEIVED':
        event = { type: action, occurredAt: eventDate };
        break;
      case 'TREATMENT_STARTED':
        event = { type: action, occurredAt: eventDate, treatmentType };
        break;
      case 'EXCEPTION_NOTED':
        event = {
          type: action,
          occurredAt: eventDate,
          reason: exceptionReason,
          note: note || undefined,
        };
        break;
      case 'CONTACT_LOGGED':
        event = {
          type: action,
          occurredAt: eventDate,
          channel: contactChannel,
          note: note || undefined,
        };
        break;
      case 'CASE_CLOSED_EXCEPTION':
        if (!window.confirm('Confirma o encerramento do caso?')) return;
        event = {
          type: action,
          occurredAt: eventDate,
          reason: closeReason,
          note: note || undefined,
        };
        break;
      default:
        return;
    }

    submitEvent(event);
  }

  function handleConfirmReport(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!extraction) return;

    submitEvent({
      type: 'REPORT_CONFIRMED',
      occurredAt: eventDate,
      extractionId: extraction.extractionId,
      examType: confirmExamType,
      reportDate: confirmReportDate,
      malignancy: confirmMalignancy,
      evidenceQuote: confirmEvidence,
    });
    setExtraction(null);
    setReportText('');
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link className="text-sm text-muted-foreground hover:text-foreground" to="/">
            ← Voltar ao calendário
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {detail.initials}
          </h1>
          <p className="text-sm text-muted-foreground">
            {detail.ageYears} anos · {triggerLabel[detail.trigger]} ·{' '}
            {statusLabel[detail.status]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => linkMutation.mutate()}
            disabled={linkMutation.isPending}
          >
            Gerar link da paciente
          </Button>
          <Badge className={cn('border px-3 py-1', colorClasses[color])}>
            {colorLabel[color]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relógio</CardTitle>
              <CardDescription>Prazo legal e próximo passo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Situação</p>
                <p className="text-lg font-semibold">
                  {detail.day !== null && detail.dayTotal
                    ? `Dia ${detail.day} de ${detail.dayTotal}`
                    : 'Encerrado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencimento</p>
                <p className="text-lg font-semibold">
                  {formatDateBr(detail.dueDate)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Próximo passo</p>
                <p className="font-medium">
                  {detail.nextStep?.label ?? 'Sem próximo passo'}
                  {detail.nextStep?.scheduledFor
                    ? ` · ${formatDateBr(detail.nextStep.scheduledFor)}`
                    : ''}
                </p>
                {detail.nextStep?.location ? (
                  <p className="text-sm text-muted-foreground">
                    {detail.nextStep.location}
                  </p>
                ) : null}
              </div>
              {detail.badges.length > 0 ? (
                <div className="flex flex-wrap gap-1 sm:col-span-2">
                  {detail.badges.map((badge) => (
                    <Badge key={`${badge.type}-${badgeLabel(badge)}`} variant="outline">
                      {badgeLabel(badge)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento registrado.
                </p>
              ) : (
                <ol className="space-y-3">
                  {detail.timeline.map((event) => (
                    <li key={event.id} className="border-l-2 pl-3">
                      <p className="text-sm font-medium">
                        {eventLabel[event.type] ?? event.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ocorrido em {formatDateBr(event.occurredAt)} · registrado
                        em {formatDateBr(event.recordedAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extrações de laudo</CardTitle>
              <CardDescription>
                Sugestões salvas. A confirmação é feita pela navegadora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.extractions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma extração registrada.
                </p>
              ) : (
                detail.extractions.map((item) => {
                  const extractionItem = item as ReportExtractionView;
                  return (
                    <div
                      key={extractionItem.extractionId}
                      className="rounded-md border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {extractionItem.suggestion.examType} ·{' '}
                        {extractionItem.suggestion.malignancy} ·{' '}
                        {extractionItem.provider}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Laudo: {formatDateBr(extractionItem.suggestion.reportDate)}
                      </p>
                      <p className="mt-1 text-xs">
                        “{extractionItem.suggestion.evidenceQuote}”
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>
                Ações permitidas para o estado atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ação disponível.
                </p>
              ) : (
                <form className="space-y-3" onSubmit={handleActionSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="action">Ação</Label>
                    <select
                      id="action"
                      className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                      value={action}
                      onChange={(event) =>
                        setAction(event.target.value as CaseEventType | '')
                      }
                    >
                      <option value="">Selecione</option>
                      {availableActions.map((type) => (
                        <option key={type} value={type}>
                          {actionLabel[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {action ? (
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Data do evento</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(event) => setEventDate(event.target.value)}
                        required
                      />
                    </div>
                  ) : null}
                  {action === 'EXAM_SCHEDULED' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="examLabel">Exame</Label>
                        <Input
                          id="examLabel"
                          value={examLabel}
                          onChange={(event) => setExamLabel(event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scheduledFor">Data agendada</Label>
                        <Input
                          id="scheduledFor"
                          type="date"
                          value={scheduledFor}
                          onChange={(event) => setScheduledFor(event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Local</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          required
                        />
                      </div>
                    </>
                  ) : null}
                  {action === 'EXAM_DONE' ? (
                    <div className="space-y-2">
                      <Label htmlFor="doneExamLabel">Exame</Label>
                      <Input
                        id="doneExamLabel"
                        value={examLabel}
                        onChange={(event) => setExamLabel(event.target.value)}
                        required
                      />
                    </div>
                  ) : null}
                  {action === 'TREATMENT_STARTED' ? (
                    <div className="space-y-2">
                      <Label htmlFor="treatmentType">Tratamento</Label>
                      <select
                        id="treatmentType"
                        className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                        value={treatmentType}
                        onChange={(event) =>
                          setTreatmentType(event.target.value as TreatmentType)
                        }
                      >
                        <option value="SURGERY">Cirurgia</option>
                        <option value="CHEMOTHERAPY">Quimioterapia</option>
                        <option value="RADIOTHERAPY">Radioterapia</option>
                      </select>
                    </div>
                  ) : null}
                  {action === 'EXCEPTION_NOTED' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="exceptionReason">Motivo</Label>
                        <select
                          id="exceptionReason"
                          className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                          value={exceptionReason}
                          onChange={(event) =>
                            setExceptionReason(
                              event.target.value as ExceptionReason,
                            )
                          }
                        >
                          {Object.entries(exceptionLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <NoteField value={note} onChange={setNote} />
                    </>
                  ) : null}
                  {action === 'CONTACT_LOGGED' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contactChannel">Canal</Label>
                        <select
                          id="contactChannel"
                          className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                          value={contactChannel}
                          onChange={(event) =>
                            setContactChannel(event.target.value as ContactChannel)
                          }
                        >
                          {Object.entries(channelLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <NoteField value={note} onChange={setNote} />
                    </>
                  ) : null}
                  {action === 'CASE_CLOSED_EXCEPTION' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="closeReason">Motivo</Label>
                        <select
                          id="closeReason"
                          className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                          value={closeReason}
                          onChange={(event) =>
                            setCloseReason(event.target.value as CloseReason)
                          }
                        >
                          {Object.entries(closeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <NoteField value={note} onChange={setNote} />
                    </>
                  ) : null}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!action || eventMutation.isPending}
                  >
                    {eventMutation.isPending ? 'Registrando...' : 'Registrar'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {allowed.has('REPORT_RECEIVED') || allowed.has('REPORT_CONFIRMED') ? (
            <Card>
              <CardHeader>
                <CardTitle>Laudo</CardTitle>
                <CardDescription>
                  Registre o recebimento e estruture o texto com a IA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={reportText}
                  onChange={(event) => setReportText(event.target.value)}
                  placeholder="Cole o laudo em texto livre..."
                  className="min-h-32"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => extractionMutation.mutate()}
                  disabled={!reportText.trim() || extractionMutation.isPending}
                >
                  {extractionMutation.isPending
                    ? 'Analisando...'
                    : 'Analisar laudo'}
                </Button>
                {extraction ? (
                  <form className="space-y-3" onSubmit={handleConfirmReport}>
                    <p className="text-xs text-muted-foreground">
                      Sugestão: {extraction.suggestion.examType} ·{' '}
                      {extraction.provider}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="confirmExamType">Tipo de exame</Label>
                      <Input
                        id="confirmExamType"
                        value={confirmExamType}
                        onChange={(event) => setConfirmExamType(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmReportDate">Data do laudo</Label>
                      <Input
                        id="confirmReportDate"
                        type="date"
                        value={confirmReportDate}
                        onChange={(event) => setConfirmReportDate(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmMalignancy">Resultado</Label>
                      <select
                        id="confirmMalignancy"
                        className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                        value={confirmMalignancy}
                        onChange={(event) =>
                          setConfirmMalignancy(event.target.value as Malignancy)
                        }
                      >
                        <option value="malignant">Maligno</option>
                        <option value="benign">Benigno</option>
                        <option value="inconclusive">Inconclusivo</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmEvidence">Trecho de evidência</Label>
                      <Textarea
                        id="confirmEvidence"
                        value={confirmEvidence}
                        onChange={(event) => setConfirmEvidence(event.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Confirmar laudo
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Mensagens simuladas</CardTitle>
              <CardDescription>
                SMS/e-mail simulados, sem envio real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {detail.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma mensagem ainda.
                </p>
              ) : (
                detail.messages.map((message) => (
                  <div key={message.id} className="rounded-md border p-2 text-xs">
                    <p>{message.text}</p>
                    <p className="mt-1 text-muted-foreground">
                      {formatDateBr(message.occurredAt)} ·{' '}
                      {message.channels.join('/')}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas do caso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(detail.alerts as Alert[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum alerta ativo.
                </p>
              ) : (
                (detail.alerts as Alert[]).map((alert) => (
                  <div key={alert.key} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{alertReasonLabel[alert.reason]}</p>
                    <p className="text-xs text-muted-foreground">
                      {alertRecipientLabel[alert.recipient]} · {alert.action}
                    </p>
                    {alert.acknowledgedAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ciente em {formatDateBr(alert.acknowledgedAt)}
                      </p>
                    ) : (
                      <Button
                        className="mt-2"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          submitEvent({
                            type: 'ALERT_ACKNOWLEDGED',
                            occurredAt: todayInSaoPaulo(),
                            alertKey: alert.key,
                          })
                        }
                        disabled={eventMutation.isPending}
                      >
                        Ciente
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link da paciente</DialogTitle>
                <DialogDescription>
                  O link é mostrado uma única vez. Compartilhe apenas com a
                  paciente.
                </DialogDescription>
              </DialogHeader>
              {link ? (
                <div className="space-y-3">
                  <code className="block break-all rounded-md bg-muted p-3 text-xs">
                    {link.path}
                  </code>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      const url = `${window.location.origin}${link.path}`;
                      void navigator.clipboard?.writeText(url);
                      toast.success('Link copiado.');
                    }}
                  >
                    Copiar link
                  </Button>
                  <a
                    className="block text-center text-sm underline"
                    href={link.path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir visão da paciente
                  </a>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  );
}

function NoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="note">Observação</Label>
      <Textarea
        id="note"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Opcional"
      />
    </div>
  );
}
