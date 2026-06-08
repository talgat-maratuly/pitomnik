import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadEnvFiles } from '../database/load-env';
import { getTypeOrmPostgresOptions } from '../database/database.config';
import {
  NurseryObject,
  Section,
  SectionCodeCounter,
  WorkLog,
  WorkType,
} from '../entities';

loadEnvFiles();

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
  const dataSource = new DataSource({
    ...getTypeOrmPostgresOptions(),
    entities: [NurseryObject, Section, WorkType, WorkLog, SectionCodeCounter],
  });
  await dataSource.initialize();

  const workTypeRepo = dataSource.getRepository(WorkType);
  for (const name of DEFAULT_WORK_TYPES) {
    const existing = await workTypeRepo.findOne({ where: { name } });
    if (!existing) {
      await workTypeRepo.save(
        workTypeRepo.create({
          name,
          isActive: true,
          isOther: name === 'Другое',
        }),
      );
    }
  }

  const counterRepo = dataSource.getRepository(SectionCodeCounter);
  const counter = await counterRepo.findOne({ where: { id: 1 } });
  if (!counter) {
    await counterRepo.save(counterRepo.create({ id: 1, value: 0 }));
  }

  await dataSource.destroy();
  console.log('Seed completed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
