import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  caseEventInputSchema,
  type CaseCreate,
  type CaseDetail,
  type CaseEventInput,
  type CaseEventView,
  type CaseListResponse,
  type CaseView,
} from '@careflow/contracts';
import { Clock } from '../clock/clock';
import {
  CASE_REPOSITORY,
  ExtractionConsumptionError,
  type CaseRepository,
  type CaseScope,
  type CaseWithEvents,
} from './cases.repository';
import type {
  CaseEventRecord,
  ComputedCase,
  IsoDate,
} from './domain/case.types';
import { applyCorrections, InvalidCorrectionError } from './domain/corrections';
import { computeCaseStatus } from './domain/compute-case-status';
import { diffDays } from './domain/dates';
import { applyEvent, InvalidTransitionError } from './domain/transitions';
import { buildAlerts } from './domain/alerts';
import { containsForbiddenPatientWord } from './domain/messages';
import { buildMessages } from './domain/messages';
import {
  REPORT_EXTRACTION_REPOSITORY,
  type ReportExtractionRecord,
  type ReportExtractionRepository,
} from '../report-extraction/report-extraction.repository';

const IGNORED_NAME_PARTS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function initialsFromName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(
      (part) => part.length > 2 && !IGNORED_NAME_PARTS.has(part.toLowerCase()),
    );

  if (parts.length === 0) {
    return '?';
  }

  return parts
    .map((part) => part[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .join('.');
}

function ageYears(birthDate: IsoDate, today: IsoDate): number {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  const current = new Date(`${today}T00:00:00.000Z`);
  let age = current.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    current.getUTCMonth() < birth.getUTCMonth() ||
    (current.getUTCMonth() === birth.getUTCMonth() &&
      current.getUTCDate() < birth.getUTCDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return Math.max(0, age);
}

function asPayload(event: CaseEventInput): Record<string, unknown> {
  const { type: _type, occurredAt: _occurredAt, ...payload } = event;
  return payload as Record<string, unknown>;
}

function asRequestedAt(events: CaseEventRecord[]): IsoDate | undefined {
  const created = events.find((event) => event.type === 'CASE_CREATED');
  const value = created?.payload.requestedAt;
  return typeof value === 'string' ? value : undefined;
}

function filterCases(
  cases: CaseWithEvents[],
  query: string,
): CaseWithEvents[] {
  const normalizedQuery = normalizeSearch(query.trim());
  const cnsQuery = query.replace(/\D/g, '');

  return cases.filter((item) => {
    const haystack = normalizeSearch(
      `${item.case.fullName} ${item.case.initials}`,
    );
    if (haystack.includes(normalizedQuery)) {
      return true;
    }
    return cnsQuery.length > 0 && item.case.cns.includes(cnsQuery);
  });
}

@Injectable()
export class CasesService {
  constructor(
    @Inject(CASE_REPOSITORY)
    private readonly repository: CaseRepository,
    @Inject(REPORT_EXTRACTION_REPOSITORY)
    private readonly extractions: ReportExtractionRepository,
    private readonly clock: Clock,
  ) {}

  async create(input: CaseCreate, userId: string): Promise<CaseView> {
    const today = this.clock.today();

    if (diffDays(input.requestedAt, today) > 0) {
      throw new BadRequestException('requestedAt não pode estar no futuro');
    }

    if (diffDays(today, input.birthDate) <= 0) {
      throw new BadRequestException('birthDate deve estar no passado');
    }

    const created = await this.repository.create({
      fullName: input.fullName,
      initials: initialsFromName(input.fullName),
      cns: input.cns,
      birthDate: input.birthDate,
      trigger: input.trigger,
      requestedAt: input.requestedAt,
      source: input.source,
      createdById: userId,
      recordedAt: this.clock.now(),
    });

    return this.toView(created, today);
  }

  async list(
    scope: CaseScope,
    query?: string,
    page?: number,
    pageSize?: number,
  ): Promise<CaseListResponse> {
    const today = this.clock.today();
    const cases = await this.repository.findMany(scope);
    const filtered = query?.trim() ? filterCases(cases, query) : cases;
    const total = filtered.length;

    if (page === undefined && pageSize === undefined) {
      return {
        today,
        cases: filtered.map((item) => this.toView(item, today)),
        total,
      };
    }

    const currentPage = page ?? 1;
    const size = pageSize ?? 20;
    const start = (currentPage - 1) * size;
    const paged = filtered.slice(start, start + size);

    return {
      today,
      cases: paged.map((item) => this.toView(item, today)),
      total,
      page: currentPage,
      pageSize: size,
    };
  }

  async findById(id: string): Promise<CaseDetail> {
    const found = await this.repository.findById(id);

    if (!found) {
      throw new NotFoundException('Caso não encontrado');
    }

    const today = this.clock.today();
    const extractions = await this.extractions.findByCaseId(id);
    return this.toDetail(found, today, extractions);
  }

  async appendEvent(
    id: string,
    input: CaseEventInput,
    userId: string,
  ): Promise<CaseView> {
    const found = await this.repository.findById(id);

    if (!found) {
      throw new NotFoundException('Caso não encontrado');
    }

    if (input.type === 'CASE_CREATED') {
      throw new ConflictException('O caso já foi criado');
    }

    const today = this.clock.today();
    const current = computeCaseStatus(found.case, found.events, today);
    let payload = asPayload(input);
    let nextStatus: ComputedCase['status'];

    try {
      nextStatus = applyEvent(current.status, { type: input.type, payload });
    } catch (error) {
      if (error instanceof InvalidTransitionError) {
        throw new ConflictException(
          `Transição inválida: ${input.type} em ${current.status}`,
        );
      }
      throw error;
    }

    this.assertEventDates(input, current, today);

    if (input.type === 'CORRECTION') {
      this.validateCorrection(found.events, input, current, today);
    }

    let consumeExtractionId: string | undefined;

    if (input.type === 'REPORT_CONFIRMED') {
      const extraction = await this.extractions.findById(input.extractionId);

      if (!extraction || extraction.caseId !== id) {
        throw new ConflictException('Extração inválida para este caso');
      }

      if (extraction.consumedAt) {
        throw new ConflictException('Extração já consumida');
      }

      const confirmed = {
        examType: input.examType,
        reportDate: input.reportDate,
        malignancy: input.malignancy,
        evidenceQuote: input.evidenceQuote,
      };
      const changedFields = (
        ['examType', 'reportDate', 'malignancy', 'evidenceQuote'] as const
      ).filter((field) => extraction.suggestion[field] !== confirmed[field]);

      payload = {
        ...payload,
        suggestion: extraction.suggestion,
        confirmed,
        changedFields,
      };
      consumeExtractionId = input.extractionId;
    }

    const recordedAt = this.clock.now();
    const correctionRecord: CaseEventRecord = {
      id: 'pending-correction',
      caseId: id,
      type: input.type,
      occurredAt: input.occurredAt,
      recordedAt: this.clock.toLocalDate(recordedAt),
      userId,
      payload,
      correctsEventId:
        input.type === 'CORRECTION' ? input.correctsEventId : null,
    };

    let requestedAt: IsoDate | undefined;

    if (input.type === 'CORRECTION') {
      try {
        const effective = applyCorrections([...found.events, correctionRecord]);
        requestedAt = asRequestedAt(effective);
      } catch (error) {
        if (error instanceof InvalidCorrectionError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
    }

    let updated: CaseWithEvents;

    try {
      updated = await this.repository.appendEvent({
        caseId: id,
        type: input.type,
        occurredAt: input.occurredAt,
        recordedAt,
        userId,
        payload,
        correctsEventId:
          input.type === 'CORRECTION' ? input.correctsEventId : null,
        status: nextStatus,
        requestedAt,
        consumeExtractionId,
      });
    } catch (error) {
      if (error instanceof ExtractionConsumptionError) {
        throw new ConflictException('Extração já consumida');
      }
      throw error;
    }

    return this.toView(updated, today);
  }

  private assertEventDates(
    input: CaseEventInput,
    current: ComputedCase,
    today: IsoDate,
  ): void {
    const requestedAt = current.requestedAt;

    if (diffDays(input.occurredAt, requestedAt) < 0) {
      throw new BadRequestException('occurredAt não pode ser antes do pedido');
    }

    if (diffDays(today, input.occurredAt) < 0) {
      throw new BadRequestException('occurredAt não pode estar no futuro');
    }

    if (input.type === 'EXAM_SCHEDULED') {
      if (diffDays(input.scheduledFor, requestedAt) < 0) {
        throw new BadRequestException(
          'scheduledFor não pode ser antes do pedido',
        );
      }
      if (
        containsForbiddenPatientWord(input.examLabel) ||
        containsForbiddenPatientWord(input.location)
      ) {
        throw new BadRequestException(
          'Exame/local contém termo não permitido para a paciente',
        );
      }
    }

    if (
      input.type === 'EXAM_DONE' &&
      containsForbiddenPatientWord(input.examLabel)
    ) {
      throw new BadRequestException(
        'Exame contém termo não permitido para a paciente',
      );
    }

    if (input.type === 'REPORT_CONFIRMED') {
      if (diffDays(input.reportDate, requestedAt) < 0) {
        throw new BadRequestException('reportDate não pode ser antes do pedido');
      }
      if (diffDays(today, input.reportDate) < 0) {
        throw new BadRequestException('reportDate não pode estar no futuro');
      }
    }

    if (input.type === 'TREATMENT_STARTED') {
      if (!current.reportDate) {
        throw new BadRequestException('reportDate ausente para iniciar tratamento');
      }
      if (diffDays(input.occurredAt, current.reportDate) < 0) {
        throw new BadRequestException(
          'treatmentStartedAt não pode ser antes do laudo',
        );
      }
    }
  }

  private validateCorrection(
    events: CaseEventRecord[],
    input: Extract<CaseEventInput, { type: 'CORRECTION' }>,
    current: ComputedCase,
    today: IsoDate,
  ): void {
    const target = events.find((event) => event.id === input.correctsEventId);

    if (!target) {
      throw new BadRequestException('Evento corrigido não encontrado');
    }

    if (target.type === 'CORRECTION') {
      throw new BadRequestException('Correção não pode corrigir outra correção');
    }

    const merged = {
      type: target.type,
      occurredAt:
        typeof input.changes.occurredAt === 'string'
          ? input.changes.occurredAt
          : target.occurredAt,
      ...target.payload,
      ...input.changes,
    };

    const parsed = caseEventInputSchema.safeParse(merged);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Correção inválida',
        issues: parsed.error.issues,
      });
    }

    const requestedAt =
      target.type === 'CASE_CREATED' &&
      typeof input.changes.requestedAt === 'string'
        ? input.changes.requestedAt
        : current.requestedAt;

    if (diffDays(requestedAt, today) > 0) {
      throw new BadRequestException('requestedAt não pode estar no futuro');
    }

    if (diffDays(parsed.data.occurredAt, requestedAt) < 0) {
      throw new BadRequestException('occurredAt não pode ser antes do pedido');
    }

    if (diffDays(today, parsed.data.occurredAt) < 0) {
      throw new BadRequestException('occurredAt não pode estar no futuro');
    }

    if (parsed.data.type === 'EXAM_SCHEDULED') {
      if (diffDays(parsed.data.scheduledFor, requestedAt) < 0) {
        throw new BadRequestException(
          'scheduledFor não pode ser antes do pedido',
        );
      }
      if (
        containsForbiddenPatientWord(parsed.data.examLabel) ||
        containsForbiddenPatientWord(parsed.data.location)
      ) {
        throw new BadRequestException(
          'Exame/local contém termo não permitido para a paciente',
        );
      }
    }

    if (parsed.data.type === 'REPORT_CONFIRMED') {
      if (diffDays(parsed.data.reportDate, requestedAt) < 0) {
        throw new BadRequestException('reportDate não pode ser antes do pedido');
      }
      if (diffDays(today, parsed.data.reportDate) < 0) {
        throw new BadRequestException('reportDate não pode estar no futuro');
      }
    }

    if (parsed.data.type === 'TREATMENT_STARTED') {
      if (!current.reportDate) {
        throw new BadRequestException('reportDate ausente para iniciar tratamento');
      }
      if (diffDays(parsed.data.occurredAt, current.reportDate) < 0) {
        throw new BadRequestException(
          'treatmentStartedAt não pode ser antes do laudo',
        );
      }
    }
  }

  private toView(item: CaseWithEvents, today: IsoDate): CaseView {
    const computed = computeCaseStatus(item.case, item.events, today);

    return {
      id: item.case.id,
      fullName: item.case.fullName,
      initials: item.case.initials,
      trigger: computed.trigger,
      status: computed.status,
      source: computed.source,
      requestedAt: computed.requestedAt,
      reportDate: computed.reportDate,
      treatmentStartedAt: computed.treatmentStartedAt,
      clock: computed.clock,
      day: computed.day,
      dayTotal: computed.dayTotal,
      dueDate: computed.dueDate,
      daysRemaining: computed.daysRemaining,
      color: computed.color,
      badges: computed.badges,
      nextStep: computed.nextStep,
      outcome30: computed.outcome30,
      outcome60: computed.outcome60,
      closedAt: computed.closedAt,
      allowedEventTypes: computed.allowedEventTypes,
    };
  }

  private toDetail(
    item: CaseWithEvents,
    today: IsoDate,
    extractions: ReportExtractionRecord[],
  ): CaseDetail {
    const view = this.toView(item, today);
    const timeline: CaseEventView[] = item.events.map((event) => ({
      id: event.id,
      caseId: event.caseId,
      type: event.type,
      occurredAt: event.occurredAt,
      recordedAt: event.recordedAt,
      userId: event.userId ?? '',
      correctsEventId: event.correctsEventId ?? null,
      payload: event.payload,
    }));

    return {
      ...view,
      cns: item.case.cns,
      ageYears: ageYears(item.case.birthDate, today),
      timeline,
      messages: buildMessages(item.events, view.status, today),
      alerts: buildAlerts(item.case, item.events, today),
      extractions: extractions.map((extraction) => ({
        extractionId: extraction.id,
        provider: extraction.provider,
        fallbackReason: extraction.fallbackReason,
        suggestion: extraction.suggestion,
      })),
    };
  }
}
