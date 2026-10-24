import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  Alert,
  CaseDetail,
  CaseListResponse,
  Metrics,
  PatientView,
} from '@careflow/contracts';
import {
  getCase,
  getMetrics,
  getPublicPatient,
  listAlerts,
  listCases,
} from './api';
import { getClockStatus, type ClockStatus } from './demo-api';

export const CLOSED_PAGE_SIZE = 8;

export const caseKeys = {
  all: ['cases'] as const,
  open: (search: string) => ['cases', 'open', search] as const,
  closed: (search: string, page: number) =>
    ['cases', 'closed', search, page] as const,
  detail: (id: string | undefined) => ['case', id] as const,
  alerts: ['alerts'] as const,
  metrics: ['metrics'] as const,
  clock: ['demo-status'] as const,
  publicPatient: (token: string | undefined) =>
    ['public-patient', token] as const,
};

export function useOpenCases(search: string): UseQueryResult<CaseListResponse> {
  return useQuery({
    queryKey: caseKeys.open(search),
    queryFn: () => listCases({ scope: 'open', search }),
    placeholderData: keepPreviousData,
  });
}

export function useClosedCases(
  search: string,
  page: number,
): UseQueryResult<CaseListResponse> {
  return useQuery({
    queryKey: caseKeys.closed(search, page),
    queryFn: () =>
      listCases({
        scope: 'closed',
        search,
        page,
        pageSize: CLOSED_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCaseDetail(id: string | undefined): UseQueryResult<CaseDetail> {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => getCase(id as string),
    enabled: Boolean(id),
  });
}

export function useAlerts(): UseQueryResult<Alert[]> {
  return useQuery({
    queryKey: caseKeys.alerts,
    queryFn: listAlerts,
  });
}

export function useMetrics(): UseQueryResult<Metrics> {
  return useQuery({
    queryKey: caseKeys.metrics,
    queryFn: getMetrics,
  });
}

export function useClockStatus(): UseQueryResult<ClockStatus> {
  return useQuery({
    queryKey: caseKeys.clock,
    queryFn: getClockStatus,
    retry: false,
  });
}

export function usePublicPatient(
  token: string | undefined,
): UseQueryResult<PatientView> {
  return useQuery({
    queryKey: caseKeys.publicPatient(token),
    queryFn: () => getPublicPatient(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}
