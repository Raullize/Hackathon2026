import { FileText, Paperclip, UserRound, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  caseCreateSchema,
  type CaseCreate,
  type CaseSource,
  type CaseTrigger,
} from '@careflow/contracts';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { createCase, extractCaseIntake } from '@/features/cases/api';

const initialForm: CaseCreate = {
  fullName: '',
  cns: '',
  birthDate: '',
  trigger: 'BIRADS_5',
  requestedAt: '',
  source: 'UBS_BRIDGE',
};

export function NewCasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CaseCreate>(initialForm);
  const [requestText, setRequestText] = useState('');
  const [examLabel, setExamLabel] = useState<string | null>(null);
  const [evidenceQuote, setEvidenceQuote] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof CaseCreate>(key: K, value: CaseCreate[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const extractMutation = useMutation({
    mutationFn: () => extractCaseIntake(requestText),
    onSuccess: (data) => {
      setExamLabel(data.suggestion.examLabel);
      setEvidenceQuote(data.suggestion.evidenceQuote);
      setForm((current) => ({
        ...current,
        trigger: data.suggestion.trigger,
        requestedAt: data.suggestion.requestedAt ?? current.requestedAt,
      }));
      toast.success(
        data.provider === 'gemini'
          ? 'Pedido estruturado pelo Gemini.'
          : 'Pedido estruturado pela regra local.',
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível analisar o pedido.',
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: CaseCreate) => createCase(input),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Caso cadastrado.');
      navigate(`/casos/${created.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível cadastrar.',
      );
    },
  });

  function handleExtract() {
    if (requestText.trim().length === 0) {
      toast.error('Cole o texto do pedido antes de analisar.');
      return;
    }
    extractMutation.mutate();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = caseCreateSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    createMutation.mutate(parsed.data);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Entrada de caso
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Cadastrar caso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole o pedido, confira a sugestão e confirme os dados da paciente.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-4 text-muted-foreground" />
              Pedido recebido
            </CardTitle>
            <CardDescription>
              Texto livre do encaminhamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
              placeholder="Cole aqui o texto do encaminhamento, com data do pedido, gatilho e exame solicitado."
              className="min-h-40"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleExtract}
                disabled={extractMutation.isPending}
              >
                {extractMutation.isPending ? 'Analisando...' : 'Analisar pedido'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip aria-hidden="true" />
                Anexar PDF
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setAttachedFile(file.name);
                    event.target.value = '';
                  }
                }}
              />
            </div>
            {attachedFile ? (
              <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">{attachedFile}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  aria-label="Remover PDF"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            ) : null}
            {examLabel ? (
              <p className="text-sm text-muted-foreground">
                Exame sugerido: <span className="font-medium">{examLabel}</span>
              </p>
            ) : null}
            {evidenceQuote ? (
              <blockquote className="rounded-md border-l-2 bg-muted/50 p-2 text-xs text-muted-foreground">
                “{evidenceQuote}”
              </blockquote>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound aria-hidden="true" className="size-4 text-muted-foreground" />
              Dados do caso
            </CardTitle>
            <CardDescription>
              A IA não cria o caso. Confira e confirme os campos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cns">CNS</Label>
                  <Input
                    id="cns"
                    value={form.cns}
                    onChange={(event) =>
                      update('cns', event.target.value.replace(/\D/g, '').slice(0, 15))
                    }
                    inputMode="numeric"
                    maxLength={15}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(event) => update('birthDate', event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requestedAt">Data do pedido</Label>
                  <Input
                    id="requestedAt"
                    type="date"
                    value={form.requestedAt}
                    onChange={(event) => update('requestedAt', event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger">Gatilho</Label>
                  <Select
                    value={form.trigger}
                    onValueChange={(value) =>
                      update('trigger', value as CaseTrigger)
                    }
                  >
                    <SelectTrigger id="trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BIRADS_5">BI-RADS 5</SelectItem>
                      <SelectItem value="BIRADS_4">BI-RADS 4</SelectItem>
                      <SelectItem value="CLINICAL_SUSPICION">
                        Suspeita clínica
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Origem do caso</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => update('source', value as CaseSource)}
                >
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UBS_BRIDGE">Ponte da UBS</SelectItem>
                    <SelectItem value="REGULATION">Regulação</SelectItem>
                    <SelectItem value="SISCAN">SISCAN</SelectItem>
                    <SelectItem value="PROVIDER">Prestador</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formError ? (
                <p
                  className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Salvando...' : 'Cadastrar caso'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
