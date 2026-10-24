import { IdentifierFilter } from './identifier-filter';

describe('IdentifierFilter', () => {
  const filter = new IdentifierFilter();

  it('removes CPF, CNS and patient name', () => {
    const result = filter.filter(
      'Paciente Maria Teste da Silva, CPF 123.456.789-00, CNS 123 456 789 012 345. Carcinoma ductal.',
      { fullName: 'Maria Teste da Silva', cns: '123456789012345' },
    );

    expect(result).not.toContain('Maria');
    expect(result).not.toContain('Teste');
    expect(result).not.toContain('Silva');
    expect(result).not.toContain('123.456.789-00');
    expect(result).not.toContain('123 456 789 012 345');
    expect(result).toContain('[NOME]');
    expect(result).toContain('[CPF]');
    expect(result).toContain('[CNS]');
    expect(result).toContain('Carcinoma ductal');
  });

  it('removes a plain 15-digit CNS', () => {
    const result = filter.filter('CNS 123456789012345', {
      fullName: 'Outra Pessoa',
      cns: '123456789012345',
    });

    expect(result).toBe('CNS [CNS]');
  });
});
