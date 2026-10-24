import { Injectable } from '@nestjs/common';

const CPF = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
const CNS_GROUPED = /\b\d{3}(?:[ .-]?\d{3}){4}\b/g;
const CNS_PLAIN = /\b\d{15}\b/g;
const LABELED_PATIENT = /\b(Paciente|Nome)\s*:\s*[^\n,;.]+/gi;

@Injectable()
export class IntakeSanitizer {
  sanitize(text: string): string {
    return text
      .replace(CNS_PLAIN, '[CNS]')
      .replace(CNS_GROUPED, '[CNS]')
      .replace(CPF, '[CPF]')
      .replace(LABELED_PATIENT, (match) => {
        const label = match.split(':')[0]?.trim() ?? 'Paciente';
        return `${label}: [NOME]`;
      });
  }
}
