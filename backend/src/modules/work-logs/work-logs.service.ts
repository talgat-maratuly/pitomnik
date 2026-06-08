import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { endOfDay, parseISO, startOfDay, startOfMonth, subDays } from 'date-fns';
import { serializePhotoUrls } from '../../common/photo-urls';
import { mapWorkLogsWithPhotos, withPhotoUrlsArray } from '../../common/work-log-response';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { WorkLogQueryDto } from './dto/work-log-query.dto';

const workLogInclude = {
  section: { include: { object: true } },
  workType: true,
} as const;

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: WorkLogQueryDto): Prisma.WorkLogWhereInput {
    const where: Prisma.WorkLogWhereInput = {};

    if (query.dateFrom) {
      where.submittedAt = {
        ...(where.submittedAt as Prisma.DateTimeFilter | undefined),
        gte: startOfDay(parseISO(query.dateFrom)),
      };
    }
    if (query.dateTo) {
      where.submittedAt = {
        ...(where.submittedAt as Prisma.DateTimeFilter | undefined),
        lte: endOfDay(parseISO(query.dateTo)),
      };
    }
    if (query.workerFullName?.trim()) {
      where.workerFullName = { contains: query.workerFullName.trim() };
    }
    if (query.sectionId) {
      where.sectionId = query.sectionId;
    }
    if (query.workTypeId) {
      where.workTypeId = query.workTypeId;
    }
    if (query.objectId) {
      where.section = { objectId: query.objectId };
    }

    return where;
  }

  async findAll(query: WorkLogQueryDto) {
    const rows = await this.prisma.workLog.findMany({
      where: this.buildWhere(query),
      orderBy: { submittedAt: 'desc' },
      include: workLogInclude,
    });
    return mapWorkLogsWithPhotos(rows);
  }

  async findOne(id: number) {
    const row = await this.prisma.workLog.findUnique({
      where: { id },
      include: workLogInclude,
    });
    if (!row) throw new NotFoundException('Запись не найдена');
    return withPhotoUrlsArray(row);
  }

  async create(dto: CreateWorkLogDto) {
    const section = await this.prisma.section.findUnique({ where: { id: dto.sectionId } });
    if (!section) throw new NotFoundException('Участок не найден');

    if (dto.workTypeId) {
      const wt = await this.prisma.workType.findUnique({ where: { id: dto.workTypeId } });
      if (!wt) throw new NotFoundException('Вид работы не найден');
    }

    const hasCoords = dto.latitude != null && dto.longitude != null;

    const row = await this.prisma.workLog.create({
      data: {
        sectionId: dto.sectionId,
        workerFullName: dto.workerFullName.trim(),
        workTypeId: dto.workTypeId ?? null,
        customWorkType: dto.customWorkType?.trim() || null,
        workVolume: dto.workVolume.trim(),
        comment: dto.comment?.trim() ?? '',
        photoUrls: serializePhotoUrls(dto.photoUrls ?? []),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        locationAccuracy: dto.locationAccuracy ?? null,
        locationAllowed: dto.locationAllowed ?? hasCoords,
        submittedAt: new Date(),
      },
      include: workLogInclude,
    });
    return withPhotoUrlsArray(row);
  }

  async remove(id: number) {
    await this.findOne(id);
    const row = await this.prisma.workLog.delete({ where: { id }, include: workLogInclude });
    return withPhotoUrlsArray(row);
  }

  async getStats() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = subDays(now, 7);
    const monthStart = startOfMonth(now);

    const [today, week, month, recent, allLogs, sections] = await Promise.all([
      this.prisma.workLog.count({ where: { submittedAt: { gte: todayStart } } }),
      this.prisma.workLog.count({ where: { submittedAt: { gte: weekStart } } }),
      this.prisma.workLog.count({ where: { submittedAt: { gte: monthStart } } }),
      this.prisma.workLog.findMany({
        take: 8,
        orderBy: { submittedAt: 'desc' },
        include: workLogInclude,
      }),
      this.prisma.workLog.findMany({
        select: { workerFullName: true, sectionId: true, submittedAt: true },
      }),
      this.prisma.section.findMany({ include: { object: true } }),
    ]);

    const workerCounts = new Map<string, number>();
    for (const row of allLogs) {
      workerCounts.set(row.workerFullName, (workerCounts.get(row.workerFullName) ?? 0) + 1);
    }
    const topWorkers = [...workerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const sectionLast = new Map<number, string>();
    for (const row of allLogs) {
      const prev = sectionLast.get(row.sectionId);
      if (!prev || row.submittedAt.toISOString() > prev) {
        sectionLast.set(row.sectionId, row.submittedAt.toISOString());
      }
    }

    const staleSections = sections
      .map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        objectName: s.object.name,
        lastWork: sectionLast.get(s.id) ?? null,
      }))
      .sort((a, b) => {
        if (!a.lastWork && !b.lastWork) return 0;
        if (!a.lastWork) return -1;
        if (!b.lastWork) return 1;
        return new Date(a.lastWork).getTime() - new Date(b.lastWork).getTime();
      })
      .slice(0, 8);

    return {
      today,
      week,
      month,
      recent: mapWorkLogsWithPhotos(recent),
      topWorkers,
      staleSections,
    };
  }
}
