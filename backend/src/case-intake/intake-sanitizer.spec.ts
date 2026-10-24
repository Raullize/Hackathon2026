import { IntakeSanitizer } from './intake-sanitizer';

describe('IntakeSanitizer', () => {
  const sanitizer = new IntakeSanitizer();

  it('removes CPF, CNS and labeled patient name', () => {
    const result = sanitizer.sanitize(
      'Paciente: Maria Teste. CPF 123.456.789-00. CNS 123 456 789 012 345. Solicita biópsia.',
    );

    expect(result).not.toContain('Maria Teste');
    expect(result).not.toContain('123.456.789-00');
    expect(result).not.toContain('123 456 789 012 345');
    expect(result).toContain('Paciente: [NOME]');
    expect(result).toContain('[CPF]');
    expect(result).toContain('[CNS]');
  });
});
