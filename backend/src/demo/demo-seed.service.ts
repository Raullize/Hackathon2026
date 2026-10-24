import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Clock } from '../clock/clock';
import type { CaseTrigger, IsoDate } from '../cases/domain/case.types';
import { addDays } from '../cases/domain/dates';
import { PrismaService } from '../prisma/prisma.service';

interface DemoEventSeed {
  type: Prisma.CaseEventCreateManyInput['type'];
  occurredAt: IsoDate;
  recordedAt?: IsoDate;
  payload: Prisma.InputJsonValue;
}

interface DemoCaseSeed {
  fullName: string;
  initials: string;
  cns: string;
  birthDate: IsoDate;
  trigger: CaseTrigger;
  requestedAt: IsoDate;
  status: Prisma.CaseCreateInput['status'];
  events: DemoEventSeed[];
}

function dbDate(iso: IsoDate): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

function reportPayload(
  malignancy: 'malignant' | 'benign' | 'inconclusive',
  reportDate: IsoDate,
): Prisma.InputJsonValue {
  return {
    extractionId: '00000000-0000-4000-8000-000000000099',
    examType: 'anatomopatológico',
    reportDate,
    malignancy,
    evidenceQuote: 'trecho fictício do laudo',
    suggestion: {
      examType: 'anatomopatológico',
      reportDate,
      malignancy,
      confidence: 'medium',
      evidenceQuote: 'trecho fictício do laudo',
      provider: 'mock',
    },
    confirmed: {
      examType: 'anatomopatológico',
      reportDate,
      malignancy,
      evidenceQuote: 'trecho fictício do laudo',
    },
    changedFields: [],
  };
}

function buildSeeds(today: IsoDate): DemoCaseSeed[] {
  return [
    {
      fullName: 'Maria Fictícia da Silva',
      initials: 'M.F.S.',
      cns: '000000000000001',
      birthDate: '1965-04-12',
      trigger: 'BIRADS_5',
      requestedAt: addDays(today, -18),
      status: 'EXAM_SCHEDULED',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -18),
          payload: {
            trigger: 'BIRADS_5',
            requestedAt: addDays(today, -18),
            source: 'UBS_BRIDGE',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -3),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, 2),
            location: 'Hospital Ana Nery',
          },
        },
      ],
    },
    {
      fullName: 'Joana Exemplo Pereira',
      initials: 'J.E.P.',
      cns: '000000000000002',
      birthDate: '1958-02-20',
      trigger: 'BIRADS_5',
      requestedAt: addDays(today, -34),
      status: 'EXAM_TO_RESCHEDULE',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -34),
          payload: {
            trigger: 'BIRADS_5',
            requestedAt: addDays(today, -34),
            source: 'REGULATION',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -22),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, -18),
            location: 'Hospital Ana Nery',
          },
        },
        {
          type: 'EXAM_DONE',
          occurredAt: addDays(today, -15),
          payload: { examLabel: 'biópsia' },
        },
        {
          type: 'REPORT_RECEIVED',
          occurredAt: addDays(today, -12),
          payload: {},
        },
        {
          type: 'REPORT_CONFIRMED',
          occurredAt: addDays(today, -12),
          payload: reportPayload('inconclusive', addDays(today, -12)),
        },
        {
          type: 'EXCEPTION_NOTED',
          occurredAt: addDays(today, -3),
          payload: { reason: 'NO_CAPACITY', note: 'sem vaga' },
        },
      ],
    },
    {
      fullName: 'Rita Teste Oliveira',
      initials: 'R.T.O.',
      cns: '000000000000003',
      birthDate: '1970-08-11',
      trigger: 'BIRADS_4',
      requestedAt: addDays(today, -12),
      status: 'SUSPECTED',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -12),
          payload: {
            trigger: 'BIRADS_4',
            requestedAt: addDays(today, -12),
            source: 'UBS_BRIDGE',
          },
        },
      ],
    },
    {
      fullName: 'Clara Modelo Santos',
      initials: 'C.M.S.',
      cns: '000000000000004',
      birthDate: '1962-11-02',
      trigger: 'CLINICAL_SUSPICION',
      requestedAt: addDays(today, -25),
      status: 'EXAM_DONE',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -25),
          payload: {
            trigger: 'CLINICAL_SUSPICION',
            requestedAt: addDays(today, -25),
            source: 'PROVIDER',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -20),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, -15),
            location: 'Hospital Ana Nery',
          },
        },
        {
          type: 'EXAM_DONE',
          occurredAt: addDays(today, -1),
          payload: { examLabel: 'biópsia' },
        },
      ],
    },
    {
      fullName: 'Lúcia Amostra Costa',
      initials: 'L.A.C.',
      cns: '000000000000005',
      birthDate: '1955-06-25',
      trigger: 'BIRADS_4',
      requestedAt: addDays(today, -20),
      status: 'REPORT_PENDING_CONFIRMATION',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -20),
          payload: {
            trigger: 'BIRADS_4',
            requestedAt: addDays(today, -20),
            source: 'SISCAN',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -16),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, -10),
            location: 'Hospital Ana Nery',
          },
        },
        {
          type: 'EXAM_DONE',
          occurredAt: addDays(today, -5),
          payload: { examLabel: 'biópsia' },
        },
        {
          type: 'REPORT_RECEIVED',
          occurredAt: addDays(today, -1),
          payload: {},
        },
      ],
    },
    {
      fullName: 'Helena Simulada Rocha',
      initials: 'H.S.R.',
      cns: '000000000000006',
      birthDate: '1968-03-14',
      trigger: 'BIRADS_4',
      requestedAt: addDays(today, -40),
      status: 'DISCARDED',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -40),
          payload: {
            trigger: 'BIRADS_4',
            requestedAt: addDays(today, -40),
            source: 'UBS_BRIDGE',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -30),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, -27),
            location: 'Hospital Ana Nery',
          },
        },
        {
          type: 'EXAM_DONE',
          occurredAt: addDays(today, -25),
          payload: { examLabel: 'biópsia' },
        },
        {
          type: 'REPORT_RECEIVED',
          occurredAt: addDays(today, -24),
          payload: {},
        },
        {
          type: 'REPORT_CONFIRMED',
          occurredAt: addDays(today, -23),
          payload: reportPayload('benign', addDays(today, -23)),
        },
      ],
    },
    {
      fullName: 'Beatriz Ensaio Lima',
      initials: 'B.E.L.',
      cns: '000000000000007',
      birthDate: '1960-09-30',
      trigger: 'BIRADS_5',
      requestedAt: addDays(today, -80),
      status: 'TREATMENT_STARTED',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -80),
          payload: {
            trigger: 'BIRADS_5',
            requestedAt: addDays(today, -80),
            source: 'UBS_BRIDGE',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -70),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, -65),
            location: 'Hospital Ana Nery',
          },
        },
        {
          type: 'EXAM_DONE',
          occurredAt: addDays(today, -60),
          payload: { examLabel: 'biópsia' },
        },
        {
          type: 'REPORT_RECEIVED',
          occurredAt: addDays(today, -56),
          payload: {},
        },
        {
          type: 'REPORT_CONFIRMED',
          occurredAt: addDays(today, -55),
          payload: reportPayload('malignant', addDays(today, -55)),
        },
        {
          type: 'TREATMENT_STARTED',
          occurredAt: addDays(today, -10),
          payload: { treatmentType: 'SURGERY' },
        },
      ],
    },
    {
      fullName: 'Sônia Piloto Alves',
      initials: 'S.P.A.',
      cns: '000000000000008',
      birthDate: '1957-12-05',
      trigger: 'BIRADS_5',
      requestedAt: addDays(today, -28),
      status: 'DIAGNOSIS_CONFIRMED',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -28),
          payload: {
            trigger: 'BIRADS_5',
            requestedAt: addDays(today, -28),
            source: 'REGULATION',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -20),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, -15),
            location: 'Hospital Ana Nery',
          },
        },
        {
          type: 'EXAM_DONE',
          occurredAt: addDays(today, -10),
          payload: { examLabel: 'biópsia' },
        },
        {
          type: 'REPORT_RECEIVED',
          occurredAt: addDays(today, -6),
          payload: {},
        },
        {
          type: 'REPORT_CONFIRMED',
          occurredAt: addDays(today, -5),
          payload: reportPayload('malignant', addDays(today, -5)),
        },
      ],
    },
    {
      fullName: 'Teresa Prova Gomes',
      initials: 'T.P.G.',
      cns: '000000000000009',
      birthDate: '1963-07-19',
      trigger: 'BIRADS_5',
      requestedAt: addDays(today, -100),
      status: 'DIAGNOSIS_CONFIRMED',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -100),
          payload: {
            trigger: 'BIRADS_5',
            requestedAt: addDays(today, -100),
            source: 'UBS_BRIDGE',
          },
        },
        {
          type: 'EXAM_SCHEDULED',
          occurredAt: addDays(today, -80),
          payload: {
            examLabel: 'biópsia',
            scheduledFor: addDays(today, -75),
            location: 'Hospital Ana Nery',
          },
        },
        {
          type: 'EXAM_DONE',
          occurredAt: addDays(today, -70),
          payload: { examLabel: 'biópsia' },
        },
        {
          type: 'REPORT_RECEIVED',
          occurredAt: addDays(today, -66),
          payload: {},
        },
        {
          type: 'REPORT_CONFIRMED',
          occurredAt: addDays(today, -65),
          payload: reportPayload('malignant', addDays(today, -65)),
        },
        {
          type: 'EXCEPTION_NOTED',
          occurredAt: addDays(today, -12),
          payload: { reason: 'TRANSPORT', note: 'sem transporte' },
        },
      ],
    },
    {
      fullName: 'Vera Fictícia Dias',
      initials: 'V.F.D.',
      cns: '000000000000010',
      birthDate: '1950-01-22',
      trigger: 'CLINICAL_SUSPICION',
      requestedAt: addDays(today, -30),
      status: 'CLOSED_EXCEPTION',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -30),
          payload: {
            trigger: 'CLINICAL_SUSPICION',
            requestedAt: addDays(today, -30),
            source: 'UBS_BRIDGE',
          },
        },
        {
          type: 'CASE_CLOSED_EXCEPTION',
          occurredAt: addDays(today, -8),
          payload: { reason: 'DEFINITIVE_REFUSAL', note: 'recusa' },
        },
      ],
    },
    {
      fullName: 'Nora Atraso Fictícia',
      initials: 'N.A.F.',
      cns: '000000000000011',
      birthDate: '1966-05-08',
      trigger: 'BIRADS_4',
      requestedAt: addDays(today, -45),
      status: 'SUSPECTED',
      events: [
        {
          type: 'CASE_CREATED',
          occurredAt: addDays(today, -45),
          recordedAt: addDays(today, -2),
          payload: {
            trigger: 'BIRADS_4',
            requestedAt: addDays(today, -45),
            source: 'OTHER',
          },
        },
      ],
    },
  ];
}

@Injectable()
export class DemoSeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async seed(userId: string): Promise<number> {
    const seeds = buildSeeds(this.clock.today());

    await this.prisma.$transaction(async (tx) => {
      await tx.reportExtraction.deleteMany();
      await tx.patientAccessToken.deleteMany();
      await tx.caseEvent.deleteMany();
      await tx.case.deleteMany();

      for (const seed of seeds) {
        const created = await tx.case.create({
          data: {
            fullName: seed.fullName,
            initials: seed.initials,
            cns: seed.cns,
            birthDate: dbDate(seed.birthDate),
            trigger: seed.trigger,
            requestedAt: dbDate(seed.requestedAt),
            status: seed.status,
            createdById: userId,
          },
        });

        await tx.caseEvent.createMany({
          data: seed.events.map((event) => ({
            caseId: created.id,
            type: event.type,
            occurredAt: dbDate(event.occurredAt),
            recordedAt: dbDate(event.recordedAt ?? event.occurredAt),
            userId,
            payload: event.payload,
          })),
        });
      }
    });

    return seeds.length;
  }
}
