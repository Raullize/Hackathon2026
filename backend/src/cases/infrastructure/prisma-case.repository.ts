import { Injectable } from '@nestjs/common';
import { Prisma, type Case as PrismaCase, type CaseEvent as PrismaCaseEvent } from '@prisma/client';
import { Clock } from '../../clock/clock';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ExtractionConsumptionError,
  type AppendEventData,
  type CaseData,
  type CaseRepository,
  type CaseScope,
  type CaseWithEvents,
  type CreateCaseData,
} from '../cases.repository';
import type {
  CaseEventType,
  CaseStatus,
  CaseTrigger,
  IsoDate,
} from '../domain/case.types';

const OPEN_STATUSES: CaseStatus[] = [
  'SUSPECTED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'EXAM_TO_RESCHEDULE',
  'REPORT_PENDING_CONFIRMATION',
  'DIAGNOSIS_CONFIRMED',
];

const CLOSED_STATUSES: CaseStatus[] = [
  'TREATMENT_STARTED',
  'DISCARDED',
  'CLOSED_EXCEPTION',
];

function isoDateFromDb(value: Date): IsoDate {
  return value.toISOString().slice(0, 10);
}

function dbDateFromIso(value: IsoDate): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function payloadFromDb(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapCase(caseRecord: PrismaCase): CaseData {
  return {
    id: caseRecord.id,
    fullName: caseRecord.fullName,
    initials: caseRecord.initials,
    cns: caseRecord.cns,
    birthDate: isoDateFromDb(caseRecord.birthDate),
    trigger: caseRecord.trigger as CaseTrigger,
    requestedAt: isoDateFromDb(caseRecord.requestedAt),
    status: caseRecord.status as CaseStatus,
    createdAt: caseRecord.createdAt.toISOString(),
  };
}

@Injectable()
export class PrismaCaseRepository implements CaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async create(data: CreateCaseData): Promise<CaseWithEvents> {
    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.case.create({
        data: {
          fullName: data.fullName,
          initials: data.initials,
          cns: data.cns,
          birthDate: dbDateFromIso(data.birthDate),
          trigger: data.trigger,
          requestedAt: dbDateFromIso(data.requestedAt),
          status: 'SUSPECTED',
          createdById: data.createdById,
        },
      });

      await tx.caseEvent.create({
        data: {
          caseId: created.id,
          type: 'CASE_CREATED',
          occurredAt: dbDateFromIso(data.requestedAt),
          recordedAt: data.recordedAt,
          userId: data.createdById,
          payload: {
            trigger: data.trigger,
            requestedAt: data.requestedAt,
            source: data.source,
          },
        },
      });

      return created;
    });

    const withEvents = await this.findById(result.id);
    if (!withEvents) {
      throw new Error('Created case could not be loaded');
    }

    return withEvents;
  }

  async findById(id: string): Promise<CaseWithEvents | null> {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: [{ recordedAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return caseRecord ? this.mapWithEvents(caseRecord) : null;
  }

  async findMany(scope: CaseScope): Promise<CaseWithEvents[]> {
    const statuses = scope === 'open' ? OPEN_STATUSES : CLOSED_STATUSES;
    const cases = await this.prisma.case.findMany({
      where: { status: { in: statuses } },
      include: {
        events: {
          orderBy: [{ recordedAt: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ requestedAt: 'asc' }, { createdAt: 'asc' }],
    });

    return cases.map((caseRecord) => this.mapWithEvents(caseRecord));
  }

  async appendEvent(data: AppendEventData): Promise<CaseWithEvents> {
    await this.prisma.$transaction(async (tx) => {
      const event = await tx.caseEvent.create({
        data: {
          caseId: data.caseId,
          type: data.type,
          occurredAt: dbDateFromIso(data.occurredAt),
          recordedAt: data.recordedAt,
          userId: data.userId,
          correctsEventId: data.correctsEventId ?? null,
          payload: data.payload as Prisma.InputJsonValue,
        },
      });

      if (data.consumeExtractionId) {
        const consumed = await tx.reportExtraction.updateMany({
          where: {
            id: data.consumeExtractionId,
            caseId: data.caseId,
            consumedAt: null,
          },
          data: {
            consumedAt: data.recordedAt,
            consumedByEventId: event.id,
          },
        });

        if (consumed.count === 0) {
          throw new ExtractionConsumptionError();
        }
      }

      await tx.case.update({
        where: { id: data.caseId },
        data: {
          status: data.status,
          ...(data.requestedAt
            ? { requestedAt: dbDateFromIso(data.requestedAt) }
            : {}),
        },
      });
    });

    const withEvents = await this.findById(data.caseId);
    if (!withEvents) {
      throw new Error('Updated case could not be loaded');
    }

    return withEvents;
  }

  private mapWithEvents(
    caseRecord: PrismaCase & { events: PrismaCaseEvent[] },
  ): CaseWithEvents {
    return {
      case: mapCase(caseRecord),
      events: caseRecord.events.map((event) => ({
        id: event.id,
        caseId: event.caseId,
        type: event.type as CaseEventType,
        occurredAt: isoDateFromDb(event.occurredAt),
        recordedAt: this.clock.toLocalDate(event.recordedAt),
        userId: event.userId,
        payload: payloadFromDb(event.payload),
        correctsEventId: event.correctsEventId,
      })),
    };
  }
}
