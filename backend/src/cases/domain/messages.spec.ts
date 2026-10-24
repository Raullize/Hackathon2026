import { MARIA_TIMELINE } from './__fixtures__/maria.timeline';
import { buildMessages, containsForbiddenPatientWord } from './messages';

describe('buildMessages', () => {
  it('builds creation, scheduling and silence messages', () => {
    const messages = buildMessages(
      MARIA_TIMELINE,
      'EXAM_SCHEDULED',
      '2026-10-30',
    );

    expect(messages).toHaveLength(3);
    expect(messages[0]?.text).toContain('05/10/2026');
    expect(messages[1]?.text).toContain('25/10/2026');
    expect(messages[2]?.text).toContain('Ainda não recebemos notícia');
    expect(messages.every((message) => message.channels.includes('SMS'))).toBe(
      true,
    );
  });

  it('does not include forbidden patient words', () => {
    const messages = buildMessages(
      MARIA_TIMELINE,
      'EXAM_SCHEDULED',
      '2026-10-30',
    );

    for (const message of messages) {
      expect(containsForbiddenPatientWord(message.text)).toBe(false);
    }
  });
});
