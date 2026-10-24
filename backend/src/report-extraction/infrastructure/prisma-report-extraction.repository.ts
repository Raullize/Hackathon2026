import { Injectable } from '@nestjs/common';
import { reportSuggestionSchema } from '@careflow/contracts';
import type { ReportExtraction as PrismaReportExtraction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateReportExtractionData,
  ReportExtractionRecord,
  ReportExtractionRepository,
} from '../report-extraction.repository';

function mapExtraction(
  extraction: PrismaReportExtraction,
): ReportExtractionRecord {
  return {
    id: extraction.id,
    caseId: extraction.caseId,
    provider: extraction.provider as 'gemini' | 'mock',
    fallbackReason: extraction.fallbackReason,
    suggestion: reportSuggestionSchema.parse(extraction.suggestion),
    createdById: extraction.createdById,
    createdAt: extraction.createdAt,
    consumedAt: extraction.consumedAt,
  };
}

@Injectable()
export class PrismaReportExtractionRepository
  implements ReportExtractionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateReportExtractionData,
  ): Promise<ReportExtractionRecord> {
    const extraction = await this.prisma.reportExtraction.create({
      data: {
        caseId: data.caseId,
        provider: data.provider,
        fallbackReason: data.fallbackReason,
        suggestion: data.suggestion,
        createdById: data.createdById,
      },
    });

    return mapExtraction(extraction);
  }

  async findById(id: string): Promise<ReportExtractionRecord | null> {
    const extraction = await this.prisma.reportExtraction.findUnique({
      where: { id },
    });
    return extraction ? mapExtraction(extraction) : null;
  }

  async findByCaseId(caseId: string): Promise<ReportExtractionRecord[]> {
    const extractions = await this.prisma.reportExtraction.findMany({
      where: { caseId },
      orderBy: { createdAt: 'asc' },
    });
    return extractions.map(mapExtraction);
  }
}
