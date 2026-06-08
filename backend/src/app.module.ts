import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ObjectsModule } from './modules/objects/objects.module';
import { SectionsModule } from './modules/sections/sections.module';
import { WorkTypesModule } from './modules/work-types/work-types.module';
import { WorkLogsModule } from './modules/work-logs/work-logs.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { QrModule } from './modules/qr/qr.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
