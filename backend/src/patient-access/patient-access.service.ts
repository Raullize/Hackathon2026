import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type {
  AccessTokenResponse,
  PatientView,
} from '@careflow/contracts';
import { Clock } from '../clock/clock';
import { CASE_REPOSITORY, type CaseRepository } from '../cases/cases.repository';
import { computeCaseStatus } from '../cases/domain/compute-case-status';
import { addDays, diffDays } from '../cases/domain/dates';
import { DEADLINE_RULES } from '../cases/domain/deadline-rules';
import { buildMessages } from '../cases/domain/messages';
import { isClosedStatus } from '../cases/domain/transitions';
import { PrismaService } from '../prisma/prisma.service';

const RIGHTS = [
  '30 dias para realizar os exames de diagnóstico',
  '60 dias para iniciar o tratamento',
  'Consulta de posição em fila de espera (Lei 14.758/2023)',
];

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PatientAccessService {
  constructor(
    @Inject(CASE_REPOSITORY)
    private readonly cases: CaseRepository,
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async createToken(
    caseId: string,
    userId: string,
  ): Promise<AccessTokenResponse> {
    const found = await this.cases.findById(caseId);

    if (!found) {
      throw new NotFoundException('Caso não encontrado');
    }

    const today = this.clock.today();
    const computed = computeCaseStatus(found.case, found.events, today);

    if (
      isClosedStatus(computed.status) &&
      computed.closedAt &&
      diffDays(today, addDays(computed.closedAt, DEADLINE_RULES.closedLinkGraceDays)) > 0
    ) {
      throw new ConflictException('Link não pode ser gerado para caso antigo');
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const now = this.clock.now();

    await this.prisma.$transaction(async (tx) => {
      await tx.patientAccessToken.updateMany({
        where: { caseId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.patientAccessToken.create({
        data: { caseId, tokenHash, createdById: userId },
      });
    });

    return {
      token,
      path: `/p/${token}`,
    };
  }

  async getPublicView(token: string): Promise<PatientView> {
    const record = await this.prisma.patientAccessToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!record || record.revokedAt) {
      throw new NotFoundException('Link inválido');
    }

    const found = await this.cases.findById(record.caseId);

    if (!found) {
      throw new NotFoundException('Link inválido');
    }

    const today = this.clock.today();
    const computed = computeCaseStatus(found.case, found.events, today);
    const closed = isClosedStatus(computed.status);

    if (
      closed &&
      computed.closedAt &&
      diffDays(today, addDays(computed.closedAt, DEADLINE_RULES.closedLinkGraceDays)) > 0
    ) {
      throw new NotFoundException('Link inválido');
    }

    let guidance: string | null = null;
    if (computed.status === 'DISCARDED' || computed.status === 'CLOSED_EXCEPTION') {
      guidance = 'Esta etapa do seu acompanhamento terminou. Procure a sua UBS para o seguimento.';
    } else if (computed.status === 'TREATMENT_STARTED') {
      guidance = 'Seu tratamento começou. A equipe continua acompanhando você.';
    }

    return {
      state: closed ? 'CLOSED' : 'OPEN',
      nextStep: closed ? null : computed.nextStep,
      day: closed ? null : computed.day,
      dayTotal: closed ? null : computed.dayTotal,
      dueDate: closed ? null : computed.dueDate,
      rights: RIGHTS,
      messages: buildMessages(found.events, computed.status, today),
      guidance,
    };
  }
}
