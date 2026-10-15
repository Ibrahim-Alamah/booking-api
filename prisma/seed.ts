import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // تنظيف الجداول قبل الإضافة لتجنب التكرار عند التشغيل أكثر من مرة
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();

  // إضافة بعض المواعيد الثابتة كما هو مطلوب
  await prisma.slot.createMany({
    data: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        startsAt: new Date('2030-01-15T09:00:00.000Z'),
        endsAt: new Date('2030-01-15T09:30:00.000Z'),
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        startsAt: new Date('2030-01-15T09:30:00.000Z'),
        endsAt: new Date('2030-01-15T10:00:00.000Z'),
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        startsAt: new Date('2030-01-15T10:00:00.000Z'),
        endsAt: new Date('2030-01-15T10:30:00.000Z'),
      },
    ],
  });

  console.log('Seed completed successfully: Inserted 3 predefined slots.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
