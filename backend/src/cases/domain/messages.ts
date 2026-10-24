import type { PatientMessage } from '@careflow/contracts';
import type { CaseEventRecord, CaseStatus, IsoDate } from './case.types';
import { addDays, diffDays, isValidIsoDate } from './dates';
import { DEADLINE_RULES } from './deadline-rules';
import { isClosedStatus } from './transitions';

const NEWS_EVENTS = new Set([
  'CASE_CREATED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'REPORT_RECEIVED',
  'REPORT_CONFIRMED',
  'TREATMENT_STARTED',
  'EXCEPTION_NOTED',
]);

const FORBIDDEN_PATIENT_WORDS = [
  'câncer',
  'cancer',
  'tumor',
  'maligno',
  'carcinoma',
  'maligna',
  'neoplasia',
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function containsForbiddenPatientWord(value: string): boolean {
  const normalized = normalize(value);
  return FORBIDDEN_PATIENT_WORDS.some((word) =>
    normalized.includes(normalize(word)),
  );
}

function formatBr(value: string): string {
  if (!isValidIsoDate(value)) return value;
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function buildMessages(
  events: CaseEventRecord[],
  status: string,
  today: IsoDate,
): PatientMessage[] {
  const ordered = [...events].sort(
    (a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id),
  );
  const created = ordered.find((event) => event.type === 'CASE_CREATED');
  const requestedAt = created ? asString(created.payload.requestedAt) : null;
  const due30 = requestedAt
    ? addDays(requestedAt, DEADLINE_RULES.D30.days)
    : null;

  const messages: PatientMessage[] = [];

  for (const event of ordered) {
    let text: string | null = null;

    switch (event.type) {
      case 'CASE_CREATED':
        if (requestedAt && due30) {
          text =
            `Olá! A sua UBS fez um pedido de exames para investigação da mama em ` +
            `${formatBr(requestedAt)}. Pela lei, você tem direito a fazer esses ` +
            `exames em até 30 dias, até ${formatBr(due30)}. Vamos avisar você de ` +
            'cada passo.';
        }
        break;
      case 'EXAM_SCHEDULED': {
        const examLabel = asString(event.payload.examLabel);
        const scheduledFor = asString(event.payload.scheduledFor);
        const location = asString(event.payload.location);
        if (examLabel && scheduledFor && location) {
          text =
            `Seu exame (${examLabel}) está marcado para ` +
            `${formatBr(scheduledFor)}, em ${location}.`;
        }
        break;
      }
      case 'REPORT_CONFIRMED': {
        const malignancy = event.payload.malignancy;
        const reportDate = asString(event.payload.reportDate);
        if (malignancy === 'inconclusive' && due30) {
          text =
            'Precisamos remarcar o seu exame. A equipe vai entrar em contato com ' +
            'a nova data. O seu prazo de 30 dias continua valendo: até ' +
            `${formatBr(due30)}.`;
        } else if (malignancy === 'malignant' && reportDate) {
          const due60 = addDays(reportDate, DEADLINE_RULES.D60.days);
          text =
            'Seu resultado está pronto, e a equipe vai entrar em contato. Você ' +
            'tem direito a iniciar o tratamento em até 60 dias, até ' +
            `${formatBr(due60)}.`;
        } else if (malignancy === 'benign') {
          text =
            'Seu resultado está pronto. Procure a sua UBS para combinar o ' +
            'seguimento.';
        }
        break;
      }
      case 'TREATMENT_STARTED':
        text =
          `Seu tratamento começou em ${formatBr(event.occurredAt)}. A equipe ` +
          'continua acompanhando você.';
        break;
      default:
        break;
    }

    if (text) {
      messages.push({
        id: event.id,
        occurredAt: event.occurredAt,
        text,
        channels: ['SMS', 'EMAIL'],
      });
    }
  }

  if (!isClosedStatus(status as CaseStatus)) {
    const lastNews = ordered
      .filter((event) => NEWS_EVENTS.has(event.type))
      .at(-1);
    if (lastNews) {
      const silenceStart = addDays(lastNews.recordedAt, DEADLINE_RULES.silenceDays);
      if (diffDays(today, silenceStart) >= 0) {
        messages.push({
          id: `silence-${lastNews.id}`,
          occurredAt: silenceStart,
          text:
            'Olá! Ainda não recebemos notícia do seu próximo passo. Se você já ' +
            'fez o exame ou tem uma data marcada, avise a sua UBS.',
          channels: ['SMS', 'EMAIL'],
        });
      }
    }
  }

  return messages.sort(
    (a, b) =>
      a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id),
  );
}
