import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter.js';

describe('Booking API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const slotId1 = '11111111-1111-4111-8111-111111111111';
  const slotId2 = '22222222-2222-4222-8222-222222222222';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    
    prisma = app.get(PrismaService);
    
    await prisma.booking.deleteMany();
    await prisma.slot.deleteMany();
    await prisma.slot.createMany({
      data: [
        {
          id: slotId1,
          startsAt: new Date('2030-01-15T09:00:00.000Z'),
          endsAt: new Date('2030-01-15T09:30:00.000Z'),
        },
        {
          id: slotId2,
          startsAt: new Date('2030-01-15T09:30:00.000Z'),
          endsAt: new Date('2030-01-15T10:00:00.000Z'),
        }
      ]
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('4. Successful booking', () => {
    it('should return 201 and slot should disappear from available slots', async () => {
      // 1. Check slot is available
      let res = await request(app.getHttpServer()).get('/slots').expect(200);
      expect(res.body.slots.some((s: any) => s.id === slotId1)).toBeTruthy();

      // 2. Book slot
      const bookRes = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: slotId1,
          customerName: 'Alex Morgan',
          customerEmail: 'alex@example.com'
        })
        .expect(201);
      
      expect(bookRes.body.booking.status).toBe('active');

      // 3. Check slot is NOT available
      res = await request(app.getHttpServer()).get('/slots').expect(200);
      expect(res.body.slots.some((s: any) => s.id === slotId1)).toBeFalsy();
    });
  });

  describe('5. Concurrency (Race condition)', () => {
    it('should allow only one active booking when two requests are sent concurrently', async () => {
      // Ensure slotId2 is available
      await prisma.booking.deleteMany({ where: { slotId: slotId2 } });

      const req1 = request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: slotId2,
          customerName: 'User 1',
          customerEmail: 'u1@example.com'
        });

      const req2 = request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: slotId2,
          customerName: 'User 2',
          customerEmail: 'u2@example.com'
        });

      // Send concurrently
      const responses = await Promise.all([req1, req2]);

      const statuses = responses.map(r => r.status);
      
      // One should be 201 (Created), the other 409 (Conflict)
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      // Verify only 1 active booking in DB
      const count = await prisma.booking.count({
        where: { slotId: slotId2, status: 'active' }
      });
      expect(count).toBe(1);
    });
  });

  describe('6. Cancellation', () => {
    it('cancelling should return 200, free up the slot, and allow rebooking', async () => {
      // Find the active booking for slotId2
      const booking = await prisma.booking.findFirst({
        where: { slotId: slotId2, status: 'active' }
      });
      
      expect(booking).toBeDefined();
      
      // 1. Cancel the booking
      const cancelRes = await request(app.getHttpServer())
        .delete(`/bookings/${booking!.id}`)
        .expect(200);
        
      expect(cancelRes.body.booking.status).toBe('cancelled');

      // 2. Verify slot is available again
      const slotsRes = await request(app.getHttpServer()).get('/slots').expect(200);
      expect(slotsRes.body.slots.some((s: any) => s.id === slotId2)).toBeTruthy();

      // 3. Rebook the slot
      const rebookRes = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: slotId2,
          customerName: 'Alex Rebook',
          customerEmail: 'rebook@example.com'
        })
        .expect(201);
        
      expect(rebookRes.body.booking.status).toBe('active');
    });
  });
});
