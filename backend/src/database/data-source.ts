import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getTypeOrmPostgresOptions } from './database.config';
import {
  NurseryObject,
  Section,
  SectionCodeCounter,
  WorkLog,
  WorkType,
} from '../entities';

config();

export default new DataSource({
  ...getTypeOrmPostgresOptions(),
  entities: [NurseryObject, Section, WorkType, WorkLog, SectionCodeCounter],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
