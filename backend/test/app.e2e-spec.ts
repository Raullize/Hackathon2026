import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('App (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns liveness and readiness', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      });

    await request(app.getHttpServer())
      .get('/api/health/ready')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.database).toBe('up');
      });
  });

  it('rejects protected case routes without authentication', async () => {
    await request(app.getHttpServer()).get('/api/cases').expect(401);
  });

  it('registers, logs in and reads the authenticated user', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'E2E User', email, password })
      .expect(201)
      .expect(({ body }) => {
        expect(body.accessToken).toEqual(expect.any(String));
        expect(body.user.email).toBe(email);
      });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = login.body.accessToken as string;

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe(email);
      });
  });
});
