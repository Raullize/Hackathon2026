import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('Cases (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const email = `cases-${Date.now()}@example.com`;
  const password = 'password123';

  const auth = () => ({ Authorization: `Bearer ${token}` });

  function createCase(overrides: Record<string, unknown> = {}) {
    return request(app.getHttpServer())
      .post('/api/cases')
      .set(auth())
      .send({
        fullName: 'Maria Teste da Silva',
        cns: '000000000000001',
        birthDate: '1980-01-01',
        trigger: 'BIRADS_5',
        requestedAt: '2026-10-01',
        source: 'UBS_BRIDGE',
        ...overrides,
      });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Cases E2E', email, password })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication to list cases', async () => {
    await request(app.getHttpServer()).get('/api/cases').expect(401);
  });

  it('creates, lists and details a case with navigator identity fields', async () => {
    const created = await createCase().expect(201);

    expect(created.body).toMatchObject({
      fullName: 'Maria Teste da Silva',
      status: 'SUSPECTED',
      source: 'UBS_BRIDGE',
      requestedAt: '2026-10-01',
      trigger: 'BIRADS_5',
      allowedEventTypes: expect.arrayContaining(['EXAM_SCHEDULED']),
    });
    expect(created.body).not.toHaveProperty('cns');
    expect(created.body).not.toHaveProperty('birthDate');

    const list = await request(app.getHttpServer())
      .get('/api/cases?scope=open')
      .set(auth())
      .expect(200);

    expect(list.body.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(list.body.cases.some((item: { id: string }) => item.id === created.body.id)).toBe(true);

    const byName = await request(app.getHttpServer())
      .get('/api/cases?scope=open&q=Maria%20Teste')
      .set(auth())
      .expect(200);
    expect(
      byName.body.cases.some((item: { id: string }) => item.id === created.body.id),
    ).toBe(true);

    const byCns = await request(app.getHttpServer())
      .get('/api/cases?scope=open&q=000000000000001')
      .set(auth())
      .expect(200);
    expect(
      byCns.body.cases.some((item: { id: string }) => item.id === created.body.id),
    ).toBe(true);

    const detail = await request(app.getHttpServer())
      .get(`/api/cases/${created.body.id}`)
      .set(auth())
      .expect(200);

    expect(detail.body).toMatchObject({
      id: created.body.id,
      fullName: 'Maria Teste da Silva',
      cns: '000000000000001',
      ageYears: expect.any(Number),
      timeline: expect.any(Array),
      messages: expect.any(Array),
      alerts: expect.any(Array),
      extractions: [],
    });
    expect(detail.body).not.toHaveProperty('birthDate');
  });

  it('searches names without accents and by CNS digits', async () => {
    const created = await createCase({
      fullName: 'Sônia Acento da Silva',
      cns: '000000000000099',
    }).expect(201);

    const byName = await request(app.getHttpServer())
      .get('/api/cases?scope=open&q=sonia')
      .set(auth())
      .expect(200);
    expect(
      byName.body.cases.some((item: { id: string }) => item.id === created.body.id),
    ).toBe(true);

    const byFormattedCns = await request(app.getHttpServer())
      .get('/api/cases?scope=open&q=000.000.000-000099')
      .set(auth())
      .expect(200);
    expect(
      byFormattedCns.body.cases.some(
        (item: { id: string }) => item.id === created.body.id,
      ),
    ).toBe(true);
  });

  it('applies valid events and rejects invalid transitions', async () => {
    const created = await createCase().expect(201);
    const id = created.body.id as string;

    const scheduled = await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'EXAM_SCHEDULED',
        occurredAt: '2026-10-02',
        examLabel: 'biópsia',
        scheduledFor: '2026-10-20',
        location: 'Hospital Ana Nery',
      })
      .expect(201);

    expect(scheduled.body.status).toBe('EXAM_SCHEDULED');
    expect(scheduled.body.nextStep).toMatchObject({
      label: 'biópsia agendada',
      scheduledFor: '2026-10-20',
      location: 'Hospital Ana Nery',
    });

    await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'TREATMENT_STARTED',
        occurredAt: '2026-10-03',
        treatmentType: 'SURGERY',
      })
      .expect(409);

    const contact = await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'CONTACT_LOGGED',
        occurredAt: '2026-10-03',
        channel: 'PHONE',
        note: 'Ligação para a UBS',
      })
      .expect(201);

    expect(contact.body.status).toBe('EXAM_SCHEDULED');
  });


  it('rejects patient-facing exam text with forbidden words', async () => {
    const created = await createCase().expect(201);

    await request(app.getHttpServer())
      .post(`/api/cases/${created.body.id}/events`)
      .set(auth())
      .send({
        type: 'EXAM_SCHEDULED',
        occurredAt: '2026-10-02',
        examLabel: 'carcinoma',
        scheduledFor: '2026-10-20',
        location: 'Hospital',
      })
      .expect(400);
  });

  it('closes D30 and computes the outcome after a benign report', async () => {
    const created = await createCase().expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'REPORT_RECEIVED',
        occurredAt: '2026-10-03',
      })
      .expect(201);

    const extracted = await request(app.getHttpServer())
      .post(`/api/cases/${id}/report-extractions`)
      .set(auth())
      .send({
        reportText:
          'Fibroadenoma, negativo para malignidade. Data: 03/10/2026.',
      })
      .expect(201);

    const confirmed = await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'REPORT_CONFIRMED',
        occurredAt: '2026-10-03',
        extractionId: extracted.body.extractionId,
        examType: extracted.body.suggestion.examType,
        reportDate: extracted.body.suggestion.reportDate,
        malignancy: extracted.body.suggestion.malignancy,
        evidenceQuote: extracted.body.suggestion.evidenceQuote,
      })
      .expect(201);

    expect(confirmed.body).toMatchObject({
      status: 'DISCARDED',
      clock: null,
      color: null,
      outcome30: 'MET',
      outcome60: 'NOT_APPLICABLE',
    });
  });


  it('extracts and confirms a report, consuming the extraction once', async () => {
    const created = await createCase().expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'REPORT_RECEIVED',
        occurredAt: '2026-10-03',
      })
      .expect(201);

    const extracted = await request(app.getHttpServer())
      .post(`/api/cases/${id}/report-extractions`)
      .set(auth())
      .send({
        reportText:
          'Anatomopatológico. Carcinoma ductal invasivo. Data: 03/10/2026.',
      })
      .expect(201);

    expect(extracted.body).toMatchObject({
      provider: 'mock',
      suggestion: {
        examType: 'anatomopatológico',
        reportDate: '2026-10-03',
        malignancy: 'malignant',
        provider: 'mock',
      },
    });

    const confirmation = {
      type: 'REPORT_CONFIRMED',
      occurredAt: '2026-10-03',
      extractionId: extracted.body.extractionId,
      examType: extracted.body.suggestion.examType,
      reportDate: extracted.body.suggestion.reportDate,
      malignancy: extracted.body.suggestion.malignancy,
      evidenceQuote: extracted.body.suggestion.evidenceQuote,
    };

    const confirmed = await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send(confirmation)
      .expect(201);

    expect(confirmed.body).toMatchObject({
      status: 'DIAGNOSIS_CONFIRMED',
      clock: 'D60',
      outcome30: 'MET',
    });

    const detail = await request(app.getHttpServer())
      .get(`/api/cases/${id}`)
      .set(auth())
      .expect(200);

    expect(detail.body.extractions).toHaveLength(1);

    await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send(confirmation)
      .expect(409);
  });


  it('extracts an intake from sanitized request text', async () => {
    await request(app.getHttpServer())
      .post('/api/case-intake/extractions')
      .send({ requestText: 'BI-RADS 5' })
      .expect(401);

    const extracted = await request(app.getHttpServer())
      .post('/api/case-intake/extractions')
      .set(auth())
      .send({
        requestText:
          'Paciente: Maria Teste. CPF 123.456.789-00. CNS 123 456 789 012 345. Solicitação de biópsia de mama por BI-RADS 5. Data do pedido: 01/10/2026.',
      })
      .expect(201);

    expect(extracted.body).toMatchObject({
      provider: 'mock',
      suggestion: {
        requestedAt: '2026-10-01',
        trigger: 'BIRADS_5',
        examLabel: 'biópsia',
      },
    });
    expect(JSON.stringify(extracted.body)).not.toContain('123.456.789-00');
    expect(JSON.stringify(extracted.body)).not.toContain('123 456 789 012 345');
    expect(JSON.stringify(extracted.body)).not.toContain('Maria Teste');
  });


  it('generates and reads a patient link, revoking the previous one', async () => {
    const created = await createCase().expect(201);
    const id = created.body.id as string;

    const first = await request(app.getHttpServer())
      .post(`/api/cases/${id}/access-tokens`)
      .set(auth())
      .expect(201);

    expect(first.body.path).toBe(`/p/${first.body.token}`);

    const publicView = await request(app.getHttpServer())
      .get(`/api/public/p/${first.body.token}`)
      .expect(200);

    expect(publicView.body).toMatchObject({
      state: 'OPEN',
      rights: expect.any(Array),
      messages: expect.any(Array),
      guidance: null,
    });
    expect(JSON.stringify(publicView.body)).not.toContain('Maria Teste');
    expect(JSON.stringify(publicView.body)).not.toContain('000000000000001');
    expect(JSON.stringify(publicView.body)).not.toMatch(
      /câncer|cancer|tumor|maligno|carcinoma/i,
    );

    const second = await request(app.getHttpServer())
      .post(`/api/cases/${id}/access-tokens`)
      .set(auth())
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/public/p/${first.body.token}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/public/p/${second.body.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/public/p/token-invalido')
      .expect(404);
  });

  it('returns computed alerts and metrics', async () => {
    const created = await createCase({ requestedAt: '2026-09-01' }).expect(201);

    const alerts = await request(app.getHttpServer())
      .get('/api/alerts')
      .set(auth())
      .expect(200);

    expect(Array.isArray(alerts.body)).toBe(true);
    expect(alerts.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caseId: created.body.id,
          fullName: 'Maria Teste da Silva',
          reason: 'LATE_ENTRY',
          recipient: 'COORDINATION',
        }),
      ]),
    );
    for (const alert of alerts.body) {
      expect(alert.key).toContain(`${alert.caseId}:${alert.reason}:`);
    }

    const metrics = await request(app.getHttpServer())
      .get('/api/metrics')
      .set(auth())
      .expect(200);

    expect(metrics.body.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const key of [
      'withoutInformation',
      'diagnoses30',
      'treatments60',
      'aiPrimary',
      'aiSecondary',
      'lateEntry',
    ]) {
      expect(metrics.body[key].numerator).toBeGreaterThanOrEqual(0);
      expect(metrics.body[key].denominator).toBeGreaterThanOrEqual(0);
    }
    expect(metrics.body.closedExceptionCount).toBeGreaterThanOrEqual(0);
  });

  it('returns messages in case detail without forbidden words', async () => {
    const created = await createCase().expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/cases/${created.body.id}`)
      .set(auth())
      .expect(200);

    expect(detail.body.messages).toHaveLength(1);
    expect(detail.body.messages[0].channels).toEqual(['SMS', 'EMAIL']);
    expect(JSON.stringify(detail.body.messages)).not.toMatch(
      /câncer|cancer|tumor|maligno|carcinoma|maligna|neoplasia/i,
    );
  });

  it('creates a late-entry case with the original day zero', async () => {
    const created = await createCase({
      requestedAt: '2026-09-01',
      trigger: 'BIRADS_4',
    }).expect(201);

    expect(created.body.color).toBe('red');
    expect(created.body.dueDate).toBe('2026-10-01');
    expect(created.body.badges).toContainEqual(
      expect.objectContaining({ type: 'LATE_ENTRY' }),
    );
  });

  it('corrects the requested date and updates the view', async () => {
    const created = await createCase().expect(201);
    const id = created.body.id as string;

    const detail = await request(app.getHttpServer())
      .get(`/api/cases/${id}`)
      .set(auth())
      .expect(200);

    const createdEventId = detail.body.timeline[0].id as string;

    const corrected = await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'CORRECTION',
        occurredAt: '2026-10-04',
        correctsEventId: createdEventId,
        changes: { requestedAt: '2026-09-20' },
        reason: 'data do pedido corrigida',
      })
      .expect(201);

    expect(corrected.body.requestedAt).toBe('2026-09-20');
  });

  it('rejects events on a closed case', async () => {
    const created = await createCase().expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'CASE_CLOSED_EXCEPTION',
        occurredAt: '2026-10-02',
        reason: 'DEFINITIVE_REFUSAL',
        note: 'recusa definitiva',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'CONTACT_LOGGED',
        occurredAt: '2026-10-03',
        channel: 'PHONE',
      })
      .expect(409);
  });

  it('returns 404 for demo routes when DEMO_MODE is disabled', async () => {
    await request(app.getHttpServer())
      .get('/api/demo/status')
      .set(auth())
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/demo/clock/advance')
      .set(auth())
      .send({ days: 1 })
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/demo/reset')
      .set(auth())
      .expect(404);
  });

  it('returns 404 for a missing case', async () => {
    await request(app.getHttpServer())
      .get(`/api/cases/${randomUUID()}`)
      .set(auth())
      .expect(404);
  });
});
