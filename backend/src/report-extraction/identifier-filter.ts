import { Injectable } from '@nestjs/common';

const CPF = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
const CNS_GROUPED = /\b\d{3}(?:[ .-]?\d{3}){4}\b/g;
const CNS_PLAIN = /\b\d{15}\b/g;
const IGNORED_NAME_PARTS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class IdentifierFilter {
  filter(
    text: string,
    patient: { fullName: string; cns: string },
  ): string {
    let result = text
      .replace(CNS_PLAIN, '[CNS]')
      .replace(CNS_GROUPED, '[CNS]')
      .replace(CPF, '[CPF]');

    const parts = new Set(
      [patient.fullName, ...patient.fullName.split(/\s+/)]
        .map((part) => part.trim())
        .filter(
          (part) =>
            part.length >= 3 && !IGNORED_NAME_PARTS.has(part.toLowerCase()),
        ),
    );

    for (const part of parts) {
      result = result.replace(new RegExp(escapeRegExp(part), 'gi'), '[NOME]');
    }

    if (patient.cns.length >= 4) {
      result = result.replace(new RegExp(escapeRegExp(patient.cns), 'g'), '[CNS]');
    }

    return result;
  }
}
