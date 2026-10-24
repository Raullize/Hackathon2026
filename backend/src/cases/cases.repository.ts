import type {
  CaseEventRecord,
  CaseEventType,
  CaseSource,
  CaseStatus,
  CaseTrigger,
  IsoDate,
} from './domain/case.types';

export const CASE_REPOSITORY = Symbol('CASE_REPOSITORY');

export class ExtractionConsumptionError extends Error {
  constructor() {
    super('Extraction already consumed or not found');
    this.name = 'ExtractionConsumptionError';
  }
}

export interface CaseData {
  id: string;
  fullName: string;
  initials: string;
  cns: string;
  birthDate: IsoDate;
  trigger: CaseTrigger;
  requestedAt: IsoDate;
  status: CaseStatus;
  createdAt: IsoDate;
}

export interface CaseWithEvents {
  case: CaseData;
  events: CaseEventRecord[];
}

export interface CreateCaseData {
  fullName: string;
  initials: string;
  cns: string;
  birthDate: IsoDate;
  trigger: CaseTrigger;
  requestedAt: IsoDate;
  source: CaseSource;
  createdById: string;
  recordedAt: Date;
}

export interface AppendEventData {
  caseId: string;
  type: CaseEventType;
  occurredAt: IsoDate;
  recordedAt: Date;
  userId: string;
  payload: Record<string, unknown>;
  correctsEventId?: string | null;
  status: CaseStatus;
  requestedAt?: IsoDate;
  consumeExtractionId?: string;
}

export type CaseScope = 'open' | 'closed';

export interface CaseRepository {
  create(data: CreateCaseData): Promise<CaseWithEvents>;
  findById(id: string): Promise<CaseWithEvents | null>;
  findMany(scope: CaseScope): Promise<CaseWithEvents[]>;
  appendEvent(data: AppendEventData): Promise<CaseWithEvents>;
}
