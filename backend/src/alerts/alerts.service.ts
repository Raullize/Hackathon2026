import { Inject, Injectable } from '@nestjs/common';
import type { Alert } from '@careflow/contracts';
import { Clock } from '../clock/clock';
import { CASE_REPOSITORY, type CaseRepository } from '../cases/cases.repository';
import { buildAlerts } from '../cases/domain/alerts';

@Injectable()
export class AlertsService {
  constructor(
    @Inject(CASE_REPOSITORY)
    private readonly repository: CaseRepository,
    private readonly clock: Clock,
  ) {}

  async list(): Promise<Alert[]> {
    const today = this.clock.today();
    const cases = await this.repository.findMany('open');

    return cases.flatMap((item) =>
      buildAlerts(item.case, item.events, today),
    );
  }
}
