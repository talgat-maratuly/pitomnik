import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { endOfDay, parseISO, startOfDay, startOfMonth, subDays } from 'date-fns';
import { Repository } from 'typeorm';
import { serializePhotoUrls } from '../../common/photo-urls';
import { mapWorkLogsWithPhotos, withPhotoUrlsArray } from '../../common/work-log-response';
import { Section } from '../../entities/section.entity';
import { WorkLog } from '../../entities/work-log.entity';
import { WorkType } from '../../entities/work-type.entity';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { WorkLogQueryDto } from './dto/work-log-query.dto';

@Injectable()
export class WorkLogsService {
  constructor(
    @InjectRepository(WorkLog)
    private readonly workLogRepo: Repository<WorkLog>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(WorkType)
    private readonly workTypeRepo: Repository<WorkType>,
  ) {}

  private applyFilters(qb: ReturnType<Repository<WorkLog>['createQueryBuilder']>, query: WorkLogQueryDto) {
    if (query.dateFrom) {
      qb.andWhere('workLog.submittedAt >= :dateFrom', {
        dateFrom: startOfDay(parseISO(query.dateFrom)),
      });
    }
    if (query.dateTo) {
      qb.andWhere('workLog.submittedAt <= :dateTo', {
        dateTo: endOfDay(parseISO(query.dateTo)),
      });
    }
    if (query.workerFullName?.trim()) {
      qb.andWhere('workLog.workerFullName ILIKE :worker', {
        worker: `%${query.workerFullName.trim()}%`,
      });
    }
    if (query.sectionId) {
      qb.andWhere('workLog.sectionId = :sectionId', { sectionId: query.sectionId });
    }
    if (query.workTypeId) {
      qb.andWhere('workLog.workTypeId = :workTypeId', { workTypeId: query.workTypeId });
    }
    if (query.objectId) {
      qb.andWhere('section.objectId = :objectId', { objectId: query.objectId });
    }
    return qb;
  }

  private baseQuery() {
    return this.workLogRepo
      .createQueryBuilder('workLog')
      .leftJoinAndSelect('workLog.section', 'section')
      .leftJoinAndSelect('section.object', 'object')
      .leftJoinAndSelect('workLog.workType', 'workType');
  }

  async findAll(query: WorkLogQueryDto) {
    const qb = this.applyFilters(this.baseQuery(), query);
    qb.orderBy('workLog.submittedAt', 'DESC');
    const rows = await qb.getMany();
    return mapWorkLogsWithPhotos(rows);
  }

  async findOne(id: number) {
    const row = await this.baseQuery().where('workLog.id = :id', { id }).getOne();
    if (!row) throw new NotFoundException('Запись не найдена');
    return withPhotoUrlsArray(row);
  }

  async create(dto: CreateWorkLogDto) {
    const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId } });
    if (!section) throw new NotFoundException('Участок не найден');

    if (dto.workTypeId) {
      const wt = await this.workTypeRepo.findOne({ where: { id: dto.workTypeId } });
      if (!wt) throw new NotFoundException('Вид работы не найден');
    }

    const hasCoords = dto.latitude != null && dto.longitude != null;

    const row = this.workLogRepo.create({
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
    });
    const saved = await this.workLogRepo.save(row);
    return this.findOne(saved.id);
  }

  async remove(id: number) {
    const row = await this.findOne(id);
    await this.workLogRepo.delete(id);
    return row;
  }

  async getStats() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = subDays(now, 7);
    const monthStart = startOfMonth(now);

    const [todayCount, week, month, recent, allLogs, sections] = await Promise.all([
      this.workLogRepo
        .createQueryBuilder('workLog')
        .where('workLog.submittedAt >= :todayStart', { todayStart })
        .getCount(),
      this.workLogRepo
        .createQueryBuilder('workLog')
        .where('workLog.submittedAt >= :weekStart', { weekStart })
        .getCount(),
      this.workLogRepo
        .createQueryBuilder('workLog')
        .where('workLog.submittedAt >= :monthStart', { monthStart })
        .getCount(),
      this.baseQuery().orderBy('workLog.submittedAt', 'DESC').take(8).getMany(),
      this.workLogRepo.find({
        select: { workerFullName: true, sectionId: true, submittedAt: true },
      }),
      this.sectionRepo.find({ relations: { object: true } }),
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
      today: todayCount,
      week,
      month,
      recent: mapWorkLogsWithPhotos(recent),
      topWorkers,
      staleSections,
    };
  }
}
