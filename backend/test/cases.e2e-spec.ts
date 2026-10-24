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

  it('creates, lists and details a case without exposing PII', async () => {
    const created = await createCase().expect(201);

    expect(created.body).toMatchObject({
      status: 'SUSPECTED',
      source: 'UBS_BRIDGE',
      requestedAt: '2026-10-01',
      trigger: 'BIRADS_5',
      allowedEventTypes: expect.arrayContaining(['EXAM_SCHEDULED']),
    });
    expect(created.body).not.toHaveProperty('fullName');
    expect(created.body).not.toHaveProperty('cns');
    expect(created.body).not.toHaveProperty('birthDate');

    const list = await request(app.getHttpServer())
      .get('/api/cases?scope=open')
      .set(auth())
      .expect(200);

    expect(list.body.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(list.body.cases.some((item: { id: string }) => item.id === created.body.id)).toBe(true);

    const detail = await request(app.getHttpServer())
      .get(`/api/cases/${created.body.id}`)
      .set(auth())
      .expect(200);

    expect(detail.body).toMatchObject({
      id: created.body.id,
      ageYears: expect.any(Number),
      timeline: expect.any(Array),
      messages: [],
      alerts: [],
      extractions: [],
    });
    expect(detail.body).not.toHaveProperty('fullName');
    expect(detail.body).not.toHaveProperty('cns');
    expect(detail.body).not.toHaveProperty('birthDate');
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

    const confirmed = await request(app.getHttpServer())
      .post(`/api/cases/${id}/events`)
      .set(auth())
      .send({
        type: 'REPORT_CONFIRMED',
        occurredAt: '2026-10-03',
        extractionId: randomUUID(),
        examType: 'anatomopatológico',
        reportDate: '2026-10-03',
        malignancy: 'benign',
        evidenceQuote: 'negativo para malignidade',
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
  });

  it('returns 404 for a missing case', async () => {
    await request(app.getHttpServer())
      .get(`/api/cases/${randomUUID()}`)
      .set(auth())
      .expect(404);
  });
});
