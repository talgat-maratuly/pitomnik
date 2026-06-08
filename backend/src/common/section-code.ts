import { PrismaService } from '../prisma/prisma.service';

export async function nextSectionCode(prisma: PrismaService): Promise<string> {
  const counter = await prisma.sectionCodeCounter.upsert({
    where: { id: 1 },
    create: { id: 1, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `PIT-${String(counter.value).padStart(3, '0')}`;
}
