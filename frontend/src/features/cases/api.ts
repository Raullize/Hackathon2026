import type {
  AccessTokenResponse,
  Alert,
  CaseCreate,
  CaseDetail,
  CaseEventInput,
  CaseIntakeView,
  CaseListResponse,
  CaseView,
  ContactChannel,
  Metrics,
  PatientView,
  ReportExtractionView,
} from '@careflow/contracts';
import { apiFetch } from '@/lib/api-client';

export type CaseScope = 'open' | 'closed';

export interface CaseListParams {
  scope: CaseScope;
  search?: string;
  page?: number;
  pageSize?: number;
}

function casesUrl({ scope, search, page, pageSize }: CaseListParams): string {
  const params = new URLSearchParams({ scope });
  if (search?.trim()) params.set('q', search.trim());
  if (page !== undefined) params.set('page', String(page));
  if (pageSize !== undefined) params.set('pageSize', String(pageSize));
  return `/cases?${params.toString()}`;
}

export function listCases(params: CaseListParams): Promise<CaseListResponse> {
  return apiFetch<CaseListResponse>(casesUrl(params));
}

export function getCase(id: string): Promise<CaseDetail> {
  return apiFetch<CaseDetail>(`/cases/${id}`);
}

export function createCase(input: CaseCreate): Promise<CaseView> {
  return apiFetch<CaseView>('/cases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function appendCaseEvent(
  id: string,
  event: CaseEventInput,
): Promise<void> {
  return apiFetch(`/cases/${id}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export function extractReport(
  id: string,
  reportText: string,
): Promise<ReportExtractionView> {
  return apiFetch<ReportExtractionView>(`/cases/${id}/report-extractions`, {
    method: 'POST',
    body: JSON.stringify({ reportText }),
  });
}

export function createPatientLink(id: string): Promise<AccessTokenResponse> {
  return apiFetch<AccessTokenResponse>(`/cases/${id}/access-tokens`, {
    method: 'POST',
  });
}

export function extractCaseIntake(requestText: string): Promise<CaseIntakeView> {
  return apiFetch<CaseIntakeView>('/case-intake/extractions', {
    method: 'POST',
    body: JSON.stringify({ requestText }),
  });
}

export function listAlerts(): Promise<Alert[]> {
  return apiFetch<Alert[]>('/alerts');
}

export function acknowledgeAlert(
  caseId: string,
  alertKey: string,
  occurredAt: string,
): Promise<void> {
  return appendCaseEvent(caseId, {
    type: 'ALERT_ACKNOWLEDGED',
    occurredAt,
    alertKey,
  });
}

export function logContact(
  caseId: string,
  channel: ContactChannel,
  note: string,
  occurredAt: string,
): Promise<void> {
  return appendCaseEvent(caseId, {
    type: 'CONTACT_LOGGED',
    occurredAt,
    channel,
    note,
  });
}

export function getMetrics(): Promise<Metrics> {
  return apiFetch<Metrics>('/metrics');
}

export function getPublicPatient(token: string): Promise<PatientView> {
  return apiFetch<PatientView>(`/public/p/${token}`);
}
