import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObjectsModule } from './modules/objects/objects.module';
import { SectionsModule } from './modules/sections/sections.module';
import { WorkTypesModule } from './modules/work-types/work-types.module';
import { WorkLogsModule } from './modules/work-logs/work-logs.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { QrModule } from './modules/qr/qr.module';
import { ExportModule } from './modules/export/export.module';
import { getTypeOrmPostgresFromConfig } from './database/database.config';
import {
  NurseryObject,
  Section,
  SectionCodeCounter,
  WorkLog,
  WorkType,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...getTypeOrmPostgresFromConfig(config),
        entities: [NurseryObject, Section, WorkType, WorkLog, SectionCodeCounter],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: config.get('DB_MIGRATE') !== 'false',
      }),
    }),
    ObjectsModule,
    SectionsModule,
    WorkTypesModule,
    WorkLogsModule,
    UploadsModule,
    QrModule,
    ExportModule,
  ],
})
export class AppModule {}
