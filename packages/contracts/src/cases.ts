import { z } from 'zod';

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

export const caseStatusSchema = z.enum([
  'SUSPECTED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'EXAM_TO_RESCHEDULE',
  'REPORT_PENDING_CONFIRMATION',
  'DIAGNOSIS_CONFIRMED',
  'TREATMENT_STARTED',
  'DISCARDED',
  'CLOSED_EXCEPTION',
]);

export const caseTriggerSchema = z.enum([
  'BIRADS_4',
  'BIRADS_5',
  'CLINICAL_SUSPICION',
]);

export const caseSourceSchema = z.enum([
  'UBS_BRIDGE',
  'REGULATION',
  'SISCAN',
  'PROVIDER',
  'OTHER',
]);

export const treatmentTypeSchema = z.enum([
  'SURGERY',
  'CHEMOTHERAPY',
  'RADIOTHERAPY',
]);

export const exceptionReasonSchema = z.enum([
  'REFUSAL',
  'ABSENCE',
  'CONTRAINDICATION',
  'CLINICAL_PENDING',
  'TRANSPORT',
  'NO_CAPACITY',
]);

export const closeReasonSchema = z.enum(['DEFINITIVE_REFUSAL', 'DEATH']);

export const contactChannelSchema = z.enum([
  'PHONE',
  'EMAIL',
  'SMS',
  'WHATSAPP',
]);

export const malignancySchema = z.enum([
  'malignant',
  'benign',
  'inconclusive',
]);

export const caseEventTypeSchema = z.enum([
  'CASE_CREATED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'REPORT_RECEIVED',
  'REPORT_CONFIRMED',
  'TREATMENT_STARTED',
  'EXCEPTION_NOTED',
  'CASE_CLOSED_EXCEPTION',
  'CORRECTION',
  'ALERT_ACKNOWLEDGED',
  'CONTACT_LOGGED',
  'PATIENT_NOTIFIED',
]);

export const caseCreateSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  cns: z.string().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos'),
  birthDate: isoDateSchema,
  trigger: caseTriggerSchema,
  requestedAt: isoDateSchema,
  source: caseSourceSchema,
});

const caseEventBase = {
  occurredAt: isoDateSchema,
};

export const caseCreatedEventSchema = z.object({
  type: z.literal('CASE_CREATED'),
  ...caseEventBase,
  trigger: caseTriggerSchema,
  requestedAt: isoDateSchema,
  source: caseSourceSchema,
});

export const examScheduledEventSchema = z.object({
  type: z.literal('EXAM_SCHEDULED'),
  ...caseEventBase,
  examLabel: z.string().trim().min(1).max(80),
  scheduledFor: isoDateSchema,
  location: z.string().trim().min(1).max(200),
});

export const examDoneEventSchema = z.object({
  type: z.literal('EXAM_DONE'),
  ...caseEventBase,
  examLabel: z.string().trim().min(1).max(80),
});

export const reportReceivedEventSchema = z.object({
  type: z.literal('REPORT_RECEIVED'),
  ...caseEventBase,
});

export const reportConfirmedEventSchema = z.object({
  type: z.literal('REPORT_CONFIRMED'),
  ...caseEventBase,
  extractionId: z.string().uuid(),
  examType: z.string().trim().min(1).max(80),
  reportDate: isoDateSchema,
  malignancy: malignancySchema,
  evidenceQuote: z.string().trim().min(1).max(2000),
});

export const treatmentStartedEventSchema = z.object({
  type: z.literal('TREATMENT_STARTED'),
  ...caseEventBase,
  treatmentType: treatmentTypeSchema,
});

export const exceptionNotedEventSchema = z.object({
  type: z.literal('EXCEPTION_NOTED'),
  ...caseEventBase,
  reason: exceptionReasonSchema,
  note: z.string().trim().max(500).optional(),
});

export const caseClosedExceptionEventSchema = z.object({
  type: z.literal('CASE_CLOSED_EXCEPTION'),
  ...caseEventBase,
  reason: closeReasonSchema,
  note: z.string().trim().max(500).optional(),
});

export const correctionEventSchema = z.object({
  type: z.literal('CORRECTION'),
  ...caseEventBase,
  correctsEventId: z.string().uuid(),
  changes: z.record(z.string(), z.unknown()),
  reason: z.string().trim().min(1).max(500),
});

export const alertAcknowledgedEventSchema = z.object({
  type: z.literal('ALERT_ACKNOWLEDGED'),
  ...caseEventBase,
  alertKey: z.string().trim().min(1).max(200),
});

export const contactLoggedEventSchema = z.object({
  type: z.literal('CONTACT_LOGGED'),
  ...caseEventBase,
  channel: contactChannelSchema,
  note: z.string().trim().max(500).optional(),
});

export const patientChannelSchema = z.enum(['SMS', 'EMAIL', 'WHATSAPP']);

export const patientNotifiedEventSchema = z.object({
  type: z.literal('PATIENT_NOTIFIED'),
  ...caseEventBase,
  channel: patientChannelSchema,
  text: z.string().trim().min(1).max(1000),
  stepLabel: z.string().trim().max(120).optional(),
});

export const caseEventInputSchema = z.discriminatedUnion('type', [
  caseCreatedEventSchema,
  examScheduledEventSchema,
  examDoneEventSchema,
  reportReceivedEventSchema,
  reportConfirmedEventSchema,
  treatmentStartedEventSchema,
  exceptionNotedEventSchema,
  caseClosedExceptionEventSchema,
  correctionEventSchema,
  alertAcknowledgedEventSchema,
  contactLoggedEventSchema,
  patientNotifiedEventSchema,
]);

export const caseBadgeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('EXCEPTION'),
    reason: exceptionReasonSchema,
    since: isoDateSchema,
  }),
  z.object({
    type: z.literal('SILENCE'),
    days: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('MISSED_DATE'),
    scheduledFor: isoDateSchema,
  }),
  z.object({
    type: z.literal('REPORT_PENDING'),
  }),
  z.object({
    type: z.literal('LATE_ENTRY'),
    daysLate: z.number().int().nonnegative(),
  }),
]);

export const nextStepSchema = z.object({
  label: z.string(),
  scheduledFor: isoDateSchema.nullable(),
  location: z.string().nullable(),
});

export const outcome30Schema = z.enum([
  'MET',
  'NOT_MET',
  'MET_UNTIL_CLOSE',
]);

export const outcome60Schema = z.enum([
  'MET',
  'NOT_MET',
  'MET_UNTIL_CLOSE',
  'NOT_APPLICABLE',
]);

export const patientNotificationViewSchema = z.object({
  channel: patientChannelSchema,
  text: z.string(),
  stepLabel: z.string().nullable(),
  occurredAt: isoDateSchema,
});

export const caseViewSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  initials: z.string(),
  trigger: caseTriggerSchema,
  status: caseStatusSchema,
  source: caseSourceSchema,
  requestedAt: isoDateSchema,
  reportDate: isoDateSchema.nullable(),
  treatmentStartedAt: isoDateSchema.nullable(),
  clock: z.enum(['D30', 'D60']).nullable(),
  day: z.number().int().nullable(),
  dayTotal: z.union([z.literal(30), z.literal(60)]).nullable(),
  dueDate: isoDateSchema.nullable(),
  daysRemaining: z.number().int().nullable(),
  color: z.enum(['green', 'yellow', 'red']).nullable(),
  badges: z.array(caseBadgeSchema),
  nextStep: nextStepSchema.nullable(),
  outcome30: outcome30Schema.nullable(),
  outcome60: outcome60Schema.nullable(),
  closedAt: isoDateSchema.nullable(),
  allowedEventTypes: z.array(caseEventTypeSchema),
  lastPatientNotification: patientNotificationViewSchema.nullable(),
});

export const caseEventViewSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  type: caseEventTypeSchema,
  occurredAt: isoDateSchema,
  recordedAt: z.string(),
  userId: z.string().uuid(),
  correctsEventId: z.string().uuid().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export const patientMessageSchema = z.object({
  id: z.string(),
  occurredAt: isoDateSchema,
  text: z.string(),
  channels: z.array(z.enum(['SMS', 'EMAIL'])),
});

export const caseDetailSchema = caseViewSchema.extend({
  cns: z.string(),
  ageYears: z.number().int().nonnegative(),
  timeline: z.array(caseEventViewSchema),
  messages: z.array(patientMessageSchema),
  alerts: z.array(z.unknown()),
  extractions: z.array(z.unknown()),
});

export const caseListResponseSchema = z.object({
  today: isoDateSchema,
  cases: z.array(caseViewSchema),
  total: z.number().int().nonnegative().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
});

export const caseListQuerySchema = z.object({
  scope: z.enum(['open', 'closed']).default('open'),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export const demoAdvanceSchema = z.object({
  days: z.number().int().min(1).max(60),
});

export const alertReasonSchema = z.enum([
  'DEADLINE_WARNING',
  'SILENCE',
  'MISSED_DATE',
  'NEAR_DUE',
  'OVERDUE',
  'LATE_ENTRY',
  'OVERDUE_NO_CAPACITY',
]);

export const alertRecipientSchema = z.enum([
  'NAVIGATOR',
  'REGULATION',
  'COORDINATION',
  'CRS2',
]);

export const alertSchema = z.object({
  key: z.string(),
  caseId: z.string().uuid(),
  fullName: z.string(),
  initials: z.string(),
  reason: alertReasonSchema,
  recipient: alertRecipientSchema,
  action: z.string(),
  clock: z.enum(['D30', 'D60']).nullable(),
  referenceDate: isoDateSchema,
  acknowledgedAt: isoDateSchema.nullable(),
  acknowledgedBy: z.string().nullable(),
});

export const patientViewSchema = z.object({
  state: z.enum(['OPEN', 'CLOSED']),
  nextStep: nextStepSchema.nullable(),
  day: z.number().int().nullable(),
  dayTotal: z.union([z.literal(30), z.literal(60)]).nullable(),
  dueDate: isoDateSchema.nullable(),
  rights: z.array(z.string()),
  messages: z.array(patientMessageSchema),
  guidance: z.string().nullable(),
});

export const accessTokenResponseSchema = z.object({
  token: z.string(),
  path: z.string(),
});

export const metricValueSchema = z.object({
  numerator: z.number().int().nonnegative(),
  denominator: z.number().int().nonnegative(),
  value: z.number().nullable(),
});

export const metricsSchema = z.object({
  today: isoDateSchema,
  withoutInformation: metricValueSchema,
  diagnoses30: metricValueSchema,
  treatments60: metricValueSchema,
  aiPrimary: metricValueSchema,
  aiSecondary: metricValueSchema,
  lateEntry: metricValueSchema,
  averageRequestToRegistrationDays: z.number().nullable(),
  closedExceptionCount: z.number().int().nonnegative(),
});

export const reportSuggestionCoreSchema = z.object({
  examType: z.string().trim().min(1).max(80),
  reportDate: isoDateSchema.nullable(),
  malignancy: malignancySchema,
  confidence: z.enum(['high', 'medium', 'low']),
  evidenceQuote: z.string().trim().min(1).max(2000),
});

export const reportSuggestionSchema = reportSuggestionCoreSchema.extend({
  provider: z.enum(['gemini', 'mock']),
});

export const reportExtractionRequestSchema = z.object({
  reportText: z.string().trim().min(1).max(16000),
});

export const reportExtractionViewSchema = z.object({
  extractionId: z.string().uuid(),
  provider: z.enum(['gemini', 'mock']),
  fallbackReason: z.string().nullable(),
  suggestion: reportSuggestionSchema,
});

export const caseIntakeSuggestionSchema = z.object({
  requestedAt: isoDateSchema.nullable(),
  trigger: caseTriggerSchema,
  examLabel: z.string().trim().min(1).max(80),
  evidenceQuote: z.string().trim().min(1).max(2000),
});

export const caseIntakeRequestSchema = z.object({
  requestText: z.string().trim().min(1).max(16000),
});

export const caseIntakeViewSchema = z.object({
  provider: z.enum(['gemini', 'mock']),
  fallbackReason: z.string().nullable(),
  suggestion: caseIntakeSuggestionSchema,
});

export type CaseStatus = z.infer<typeof caseStatusSchema>;
export type CaseTrigger = z.infer<typeof caseTriggerSchema>;
export type CaseSource = z.infer<typeof caseSourceSchema>;
export type CaseEventType = z.infer<typeof caseEventTypeSchema>;
export type TreatmentType = z.infer<typeof treatmentTypeSchema>;
export type ExceptionReason = z.infer<typeof exceptionReasonSchema>;
export type CloseReason = z.infer<typeof closeReasonSchema>;
export type ContactChannel = z.infer<typeof contactChannelSchema>;
export type PatientChannel = z.infer<typeof patientChannelSchema>;
export type Malignancy = z.infer<typeof malignancySchema>;
export type CaseCreate = z.infer<typeof caseCreateSchema>;
export type CaseEventInput = z.infer<typeof caseEventInputSchema>;
export type CaseBadge = z.infer<typeof caseBadgeSchema>;
export type NextStep = z.infer<typeof nextStepSchema>;
export type Outcome30 = z.infer<typeof outcome30Schema>;
export type Outcome60 = z.infer<typeof outcome60Schema>;
export type CaseView = z.infer<typeof caseViewSchema>;
export type CaseEventView = z.infer<typeof caseEventViewSchema>;
export type PatientMessage = z.infer<typeof patientMessageSchema>;
export type CaseDetail = z.infer<typeof caseDetailSchema>;
export type CaseListResponse = z.infer<typeof caseListResponseSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type PatientView = z.infer<typeof patientViewSchema>;
export type AccessTokenResponse = z.infer<typeof accessTokenResponseSchema>;
export type MetricValue = z.infer<typeof metricValueSchema>;
export type Metrics = z.infer<typeof metricsSchema>;
export type DemoAdvance = z.infer<typeof demoAdvanceSchema>;
export type ReportSuggestionCore = z.infer<typeof reportSuggestionCoreSchema>;
export type ReportSuggestion = z.infer<typeof reportSuggestionSchema>;
export type ReportExtractionRequest = z.infer<typeof reportExtractionRequestSchema>;
export type ReportExtractionView = z.infer<typeof reportExtractionViewSchema>;
export type CaseIntakeSuggestion = z.infer<typeof caseIntakeSuggestionSchema>;
export type CaseIntakeView = z.infer<typeof caseIntakeViewSchema>;
export type CaseIntakeRequest = z.infer<typeof caseIntakeRequestSchema>;
