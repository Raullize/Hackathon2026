import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  caseCreateSchema,
  type CaseCreate,
  type CaseIntakeView,
  type CaseSource,
  type CaseTrigger,
  type CaseView,
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
import { ApiError, apiFetch } from '@/lib/api-client';

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

  function update<K extends keyof CaseCreate>(key: K, value: CaseCreate[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const extractMutation = useMutation({
    mutationFn: () =>
      apiFetch<CaseIntakeView>('/case-intake/extractions', {
        method: 'POST',
        body: JSON.stringify({ requestText }),
      }),
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
    mutationFn: (input: CaseCreate) =>
      apiFetch<CaseView>('/cases', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
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
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo caso</h1>
        <p className="text-sm text-muted-foreground">
          Cole o pedido, confira a sugestão da IA e confirme os dados da paciente.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedido da UBS</CardTitle>
            <CardDescription>
              Texto livre do encaminhamento. PDF é apenas visão futura; no MVP, use
              texto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
              placeholder="Cole aqui o pedido de mamografia/biópsia..."
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
              <Button type="button" variant="outline" disabled>
                Anexar PDF (em breve)
              </Button>
            </div>
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
            <CardTitle>Dados do caso</CardTitle>
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
                <p className="text-sm text-destructive" role="alert">
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
    </main>
  );
}
