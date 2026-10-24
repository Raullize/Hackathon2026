import type { CaseBadge, CaseStatus, CaseTrigger } from '@careflow/contracts';

export const colorLabel: Record<string, string> = {
  green: 'No prazo',
  yellow: 'Atenção',
  red: 'Vencido',
};

export const colorClasses: Record<string, string> = {
  green: 'border-emerald-500/60 bg-emerald-50 text-emerald-950',
  yellow: 'border-amber-500/70 bg-amber-50 text-amber-950',
  red: 'border-rose-500/70 bg-rose-50 text-rose-950',
};

export const statusLabel: Record<CaseStatus, string> = {
  SUSPECTED: 'Suspeita registrada',
  EXAM_SCHEDULED: 'Exame agendado',
  EXAM_DONE: 'Exame realizado',
  EXAM_TO_RESCHEDULE: 'Aguardando agendamento',
  REPORT_PENDING_CONFIRMATION: 'Laudo aguardando confirmação',
  DIAGNOSIS_CONFIRMED: 'Diagnóstico confirmado',
  TREATMENT_STARTED: 'Tratamento iniciado',
  DISCARDED: 'Descartado',
  CLOSED_EXCEPTION: 'Encerrado por exceção',
};

export const triggerLabel: Record<CaseTrigger, string> = {
  BIRADS_4: 'BI-RADS 4',
  BIRADS_5: 'BI-RADS 5',
  CLINICAL_SUSPICION: 'Suspeita clínica',
};

export function badgeLabel(badge: CaseBadge): string {
  switch (badge.type) {
    case 'EXCEPTION':
      return `Exceção: ${badge.reason.toLowerCase().replaceAll('_', ' ')}`;
    case 'SILENCE':
      return `Sem notícia há ${badge.days} dias`;
    case 'MISSED_DATE':
      return `Data passou sem registro`;
    case 'REPORT_PENDING':
      return 'Laudo aguardando confirmação';
    case 'LATE_ENTRY':
      return `Descoberta tardia (${badge.daysLate} dias)`;
  }
}
