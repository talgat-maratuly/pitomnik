import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_WORK_TYPES = [
  'Полив',
  'Прополка',
  'Подкормка',
  'Обрезка',
  'Посадка',
  'Пересадка',
  'Уборка',
  'Другое',
];

async function main() {
  for (const name of DEFAULT_WORK_TYPES) {
    await prisma.workType.upsert({
      where: { name },
      create: {
        name,
        isActive: true,
        isOther: name === 'Другое',
      },
      update: {},
    });
  }
  await prisma.sectionCodeCounter.upsert({
    where: { id: 1 },
    create: { id: 1, value: 0 },
    update: {},
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
