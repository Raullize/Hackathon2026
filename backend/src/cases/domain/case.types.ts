export type IsoDate = string;

export type CaseStatus =
  | 'SUSPECTED'
  | 'EXAM_SCHEDULED'
  | 'EXAM_DONE'
  | 'EXAM_TO_RESCHEDULE'
  | 'REPORT_PENDING_CONFIRMATION'
  | 'DIAGNOSIS_CONFIRMED'
  | 'TREATMENT_STARTED'
  | 'DISCARDED'
  | 'CLOSED_EXCEPTION';

export type CaseTrigger = 'BIRADS_4' | 'BIRADS_5' | 'CLINICAL_SUSPICION';

export type CaseSource =
  | 'UBS_BRIDGE'
  | 'REGULATION'
  | 'SISCAN'
  | 'PROVIDER'
  | 'OTHER';

export type CaseEventType =
  | 'CASE_CREATED'
  | 'EXAM_SCHEDULED'
  | 'EXAM_DONE'
  | 'REPORT_RECEIVED'
  | 'REPORT_CONFIRMED'
  | 'TREATMENT_STARTED'
  | 'EXCEPTION_NOTED'
  | 'CASE_CLOSED_EXCEPTION'
  | 'CORRECTION'
  | 'ALERT_ACKNOWLEDGED'
  | 'CONTACT_LOGGED';

export type TreatmentType = 'SURGERY' | 'CHEMOTHERAPY' | 'RADIOTHERAPY';

export type ExceptionReason =
  | 'REFUSAL'
  | 'ABSENCE'
  | 'CONTRAINDICATION'
  | 'CLINICAL_PENDING'
  | 'TRANSPORT'
  | 'NO_CAPACITY';

export type CloseReason = 'DEFINITIVE_REFUSAL' | 'DEATH';

export type ContactChannel = 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export type Malignancy = 'malignant' | 'benign' | 'inconclusive';

export interface CaseRecord {
  id: string;
  initials: string;
  trigger: CaseTrigger;
  requestedAt: IsoDate;
  status: CaseStatus;
}

export interface CaseEventRecord {
  id: string;
  caseId: string;
  type: CaseEventType;
  occurredAt: IsoDate;
  recordedAt: IsoDate;
  payload: Record<string, unknown>;
  correctsEventId?: string | null;
}

export type CaseBadge =
  | { type: 'EXCEPTION'; reason: ExceptionReason; since: IsoDate }
  | { type: 'SILENCE'; days: number }
  | { type: 'MISSED_DATE'; scheduledFor: IsoDate }
  | { type: 'REPORT_PENDING' }
  | { type: 'LATE_ENTRY'; daysLate: number };

export interface NextStep {
  label: string;
  scheduledFor: IsoDate | null;
  location: string | null;
}

export type Outcome30 = 'MET' | 'NOT_MET' | 'MET_UNTIL_CLOSE' | null;
export type Outcome60 =
  | 'MET'
  | 'NOT_MET'
  | 'MET_UNTIL_CLOSE'
  | 'NOT_APPLICABLE'
  | null;

export interface ComputedCase {
  trigger: CaseTrigger;
  source: CaseSource;
  requestedAt: IsoDate;
  reportDate: IsoDate | null;
  treatmentStartedAt: IsoDate | null;
  status: CaseStatus;
  clock: 'D30' | 'D60' | null;
  day: number | null;
  dayTotal: 30 | 60 | null;
  dueDate: IsoDate | null;
  daysRemaining: number | null;
  color: 'green' | 'yellow' | 'red' | null;
  badges: CaseBadge[];
  nextStep: NextStep | null;
  outcome30: Outcome30;
  outcome60: Outcome60;
  closedAt: IsoDate | null;
  allowedEventTypes: CaseEventType[];
}
