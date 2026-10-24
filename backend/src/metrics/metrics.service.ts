import { Inject, Injectable } from '@nestjs/common';
import type { MetricValue, Metrics } from '@careflow/contracts';
import { Clock } from '../clock/clock';
import { CASE_REPOSITORY, type CaseRepository } from '../cases/cases.repository';
import type { CaseEventRecord } from '../cases/domain/case.types';
import { computeCaseStatus } from '../cases/domain/compute-case-status';
import { applyCorrections } from '../cases/domain/corrections';
import { addDays, diffDays, isValidIsoDate } from '../cases/domain/dates';
import { DEADLINE_RULES } from '../cases/domain/deadline-rules';
import { isClosedStatus } from '../cases/domain/transitions';

function metric(numerator: number, denominator: number): MetricValue {
  return {
    numerator,
    denominator,
    value: denominator > 0 ? numerator / denominator : null,
  };
}

function latestReport(events: CaseEventRecord[]): CaseEventRecord | undefined {
  return events.filter((event) => event.type === 'REPORT_CONFIRMED').at(-1);
}

@Injectable()
export class MetricsService {
  constructor(
    @Inject(CASE_REPOSITORY)
    private readonly repository: CaseRepository,
    private readonly clock: Clock,
  ) {}

  async getMetrics(): Promise<Metrics> {
    const today = this.clock.today();
    const cases = await this.repository.findAll();

    let openCount = 0;
    let withoutInfo = 0;
    let conclusive = 0;
    let diagnosesMet = 0;
    let openD30Overdue = 0;
    let started = 0;
    let treatmentsMet = 0;
    let openD60Overdue = 0;
    let confirmedReports = 0;
    let unchangedReports = 0;
    let changedFields = 0;
    let lateEntry = 0;
    let closedExceptionCount = 0;
    let registrationDaysTotal = 0;
    let registrationSamples = 0;

    for (const item of cases) {
      const events = applyCorrections(item.events);
      const computed = computeCaseStatus(item.case, events, today);
      const open = !isClosedStatus(computed.status);

      if (open) {
        openCount += 1;
        if (
          computed.badges.some(
            (badge) => badge.type === 'SILENCE' || badge.type === 'MISSED_DATE',
          )
        ) {
          withoutInfo += 1;
        }
      }

      if (computed.status === 'CLOSED_EXCEPTION') {
        closedExceptionCount += 1;
      }

      if (computed.badges.some((badge) => badge.type === 'LATE_ENTRY')) {
        lateEntry += 1;
      }

      const report = latestReport(events);
      const reportDate =
        typeof report?.payload.reportDate === 'string' &&
        isValidIsoDate(report.payload.reportDate)
          ? report.payload.reportDate
          : null;
      const conclusiveReport =
        report && report.payload.malignancy !== 'inconclusive';

      if (conclusiveReport && reportDate) {
        conclusive += 1;
        const due30 = addDays(
          computed.requestedAt,
          DEADLINE_RULES.D30.days,
        );
        if (diffDays(reportDate, due30) <= 0) diagnosesMet += 1;
      } else if (
        open &&
        computed.clock === 'D30' &&
        (computed.daysRemaining ?? 0) < 0
      ) {
        openD30Overdue += 1;
      }

      if (computed.treatmentStartedAt && reportDate) {
        started += 1;
        const due60 = addDays(reportDate, DEADLINE_RULES.D60.days);
        if (diffDays(computed.treatmentStartedAt, due60) <= 0) {
          treatmentsMet += 1;
        }
      } else if (
        open &&
        computed.status === 'DIAGNOSIS_CONFIRMED' &&
        computed.clock === 'D60' &&
        (computed.daysRemaining ?? 0) < 0
      ) {
        openD60Overdue += 1;
      }

      if (report) {
        confirmedReports += 1;
        const changed = Array.isArray(report.payload.changedFields)
          ? report.payload.changedFields.length
          : 0;
        changedFields += changed;
        if (changed === 0) unchangedReports += 1;
      }

      const created = events.find((event) => event.type === 'CASE_CREATED');
      const requestedAt =
        typeof created?.payload.requestedAt === 'string'
          ? created.payload.requestedAt
          : null;
      if (created && requestedAt && isValidIsoDate(requestedAt)) {
        registrationDaysTotal += Math.max(
          0,
          diffDays(created.recordedAt, requestedAt),
        );
        registrationSamples += 1;
      }
    }

    return {
      today,
      withoutInformation: metric(withoutInfo, openCount),
      diagnoses30: metric(diagnosesMet, conclusive + openD30Overdue),
      treatments60: metric(treatmentsMet, started + openD60Overdue),
      aiPrimary: metric(unchangedReports, confirmedReports),
      aiSecondary: metric(changedFields, confirmedReports * 4),
      lateEntry: metric(lateEntry, cases.length),
      averageRequestToRegistrationDays:
        registrationSamples > 0
          ? registrationDaysTotal / registrationSamples
          : null,
      closedExceptionCount,
    };
  }
}
