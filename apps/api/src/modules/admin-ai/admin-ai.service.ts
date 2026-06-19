import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { Repository } from 'typeorm';
import { AiPlantStatus } from '../../common/enums/ai-plant-status.enum';
import { AttendanceStatus } from '../../common/enums/attendance-status.enum';
import { ReviewStatus } from '../../common/enums/review-status.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { AiAgronomAnalysis } from '../../entities/ai-agronom-analysis.entity';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Brigade } from '../../entities/brigade.entity';
import { NurseryObject } from '../../entities/nursery-object.entity';
import { Product } from '../../entities/product.entity';
import { Section } from '../../entities/section.entity';
import { Task } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';
import { WorkLog } from '../../entities/work-log.entity';
import { AdminAiQuestionDto } from './dto/admin-ai-question.dto';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type RiskItem = {
  level: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
  source: string;
};

function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePhotoUrls(raw: string): string[] {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

@Injectable()
export class AdminAiService {
  constructor(
    @InjectRepository(WorkLog)
    private readonly workLogRepo: Repository<WorkLog>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepo: Repository<AttendanceRecord>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Brigade)
    private readonly brigadeRepo: Repository<Brigade>,
    @InjectRepository(NurseryObject)
    private readonly objectRepo: Repository<NurseryObject>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(AiAgronomAnalysis)
    private readonly aiAgronomRepo: Repository<AiAgronomAnalysis>,
  ) {}

  private todayRange() {
    const now = new Date();
    return {
      today: format(now, 'yyyy-MM-dd'),
      start: startOfDay(now),
      end: endOfDay(now),
    };
  }

  private async getTodayWorkLogs() {
    const { start, end } = this.todayRange();
    return this.workLogRepo
      .createQueryBuilder('workLog')
      .leftJoinAndSelect('workLog.section', 'section')
      .leftJoinAndSelect('section.object', 'object')
      .leftJoinAndSelect('workLog.workType', 'workType')
      .where('workLog.submittedAt >= :start', { start })
      .andWhere('workLog.submittedAt <= :end', { end })
      .orderBy('workLog.submittedAt', 'DESC')
      .getMany();
  }

  private async getOverdueTasks() {
    const { today } = this.todayRange();
    return this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.section', 'section')
      .leftJoinAndSelect('section.object', 'object')
      .leftJoinAndSelect('task.workType', 'workType')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.brigade', 'brigade')
      .where('task.dueDate IS NOT NULL')
      .andWhere('task.dueDate < :today', { today })
      .andWhere('task.status NOT IN (:...done)', {
        done: [TaskStatus.VERIFIED, TaskStatus.COMPLETED],
      })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }

  private async getStaleSections(days = 7) {
    const threshold = subDays(new Date(), days);
    const sections = await this.sectionRepo.find({ relations: { object: true }, order: { code: 'ASC' } });
    const logs = await this.workLogRepo.find({
      select: { sectionId: true, submittedAt: true },
      order: { submittedAt: 'DESC' },
    });
    const lastBySection = new Map<number, Date>();
    for (const log of logs) {
      if (!lastBySection.has(log.sectionId)) lastBySection.set(log.sectionId, log.submittedAt);
    }
    return sections
      .map((section) => ({
        section,
        lastWork: lastBySection.get(section.id) ?? null,
      }))
      .filter((row) => !row.lastWork || row.lastWork < threshold);
  }

  private async getLowProducts() {
    const rows = await this.productRepo.find({ order: { currentQuantity: 'ASC' } });
    return rows.filter((p) => p.isActual && num(p.currentQuantity) <= 5);
  }

  private async buildRiskItems(): Promise<RiskItem[]> {
    const { today, start, end } = this.todayRange();
    const risks: RiskItem[] = [];

    const [attendance, overdueTasks, staleSections, lowProducts, pendingReports, todayLogs, objects, aiProblems] =
      await Promise.all([
        this.attendanceRepo.find({ where: { workDate: today }, order: { workerFullName: 'ASC' } }),
        this.getOverdueTasks(),
        this.getStaleSections(7),
        this.getLowProducts(),
        this.workLogRepo.find({ where: { reviewStatus: ReviewStatus.PENDING }, take: 50 }),
        this.getTodayWorkLogs(),
        this.objectRepo.find({ order: { name: 'ASC' } }),
        this.aiAgronomRepo.find({
          where: undefined,
          relations: { object: true, section: true },
          order: { createdAt: 'DESC' },
          take: 20,
        }),
      ]);

    for (const row of attendance.filter((a) => a.status === AttendanceStatus.ON_DUTY && !a.checkOutTime)) {
      risks.push({
        level: 'HIGH',
        title: `${row.workerFullName} не отметил уход`,
        description: `Сотрудник начал смену, но табель за сегодня не закрыт.`,
        recommendation: 'Связаться с сотрудником или закрыть незавершенный табель после проверки.',
        source: 'Табель',
      });
    }

    for (const task of overdueTasks.slice(0, 10)) {
      risks.push({
        level: task.priority === 'HIGH' ? 'URGENT' : 'HIGH',
        title: `Просрочена задача: ${task.description || task.workType?.name || `#${task.id}`}`,
        description: `Срок: ${task.dueDate}. Участок: ${task.section?.code ?? task.sectionId}. Статус: ${task.status}.`,
        recommendation: 'Назначить ответственного или проверить фактическое выполнение.',
        source: 'Задачи',
      });
    }

    for (const row of staleSections.slice(0, 10)) {
      const days = row.lastWork
        ? Math.floor((Date.now() - row.lastWork.getTime()) / 86_400_000)
        : null;
      risks.push({
        level: days == null || days > 14 ? 'HIGH' : 'MEDIUM',
        title: `Участок ${row.section.code} давно не обслуживался`,
        description: `${row.section.object?.name ?? 'Объект'} / ${row.section.name}: ${
          days == null ? 'нет отчетов' : `${days} дн. без работ`
        }.`,
        recommendation: 'Проверить участок и при необходимости назначить задачу.',
        source: 'Объекты и участки',
      });
    }

    for (const product of lowProducts.slice(0, 10)) {
      risks.push({
        level: num(product.currentQuantity) <= 0 ? 'URGENT' : 'MEDIUM',
        title: `Заканчивается товар: ${product.name}`,
        description: `Остаток: ${num(product.currentQuantity)} ${product.unit ?? ''}.`,
        recommendation: 'Пополнить склад или провести инвентаризацию.',
        source: 'Склад',
      });
    }

    const noPhoto = todayLogs.filter((log) => parsePhotoUrls(log.photoUrls).length === 0);
    if (noPhoto.length > 0) {
      risks.push({
        level: 'MEDIUM',
        title: `Есть отчеты без фото: ${noPhoto.length}`,
        description: 'Часть сегодняшних QR-отчетов отправлена без фотофиксации.',
        recommendation: 'Проверить отчеты и напомнить сотрудникам прикладывать фото.',
        source: 'Журнал работ',
      });
    }

    const noGeo = todayLogs.filter((log) => !log.latitude || !log.longitude);
    if (noGeo.length > 0) {
      risks.push({
        level: 'MEDIUM',
        title: `Есть отчеты без геолокации: ${noGeo.length}`,
        description: 'Часть сегодняшних QR-отчетов отправлена без координат.',
        recommendation: 'Проверить настройки геолокации на устройствах сотрудников.',
        source: 'Журнал работ',
      });
    }

    if (pendingReports.length > 0) {
      risks.push({
        level: pendingReports.length >= 10 ? 'HIGH' : 'LOW',
        title: `Отчеты требуют проверки: ${pendingReports.length}`,
        description: 'В журнале есть отчеты со статусом ожидания проверки.',
        recommendation: 'Открыть журнал работ и проверить новые отчеты.',
        source: 'Журнал работ',
      });
    }

    const todayObjects = new Set(todayLogs.map((log) => log.section?.object?.id).filter(Boolean));
    for (const object of objects) {
      if (!todayObjects.has(object.id)) {
        risks.push({
          level: 'LOW',
          title: `По объекту "${object.name}" сегодня нет отчетов`,
          description: 'За текущий день по объекту не зафиксированы QR-отчеты.',
          recommendation: 'Проверить план работ по объекту.',
          source: 'Объекты',
        });
      }
    }

    for (const analysis of aiProblems.filter((a) => [AiPlantStatus.BAD, AiPlantStatus.CRITICAL].includes(a.status))) {
      risks.push({
        level: analysis.status === AiPlantStatus.CRITICAL ? 'URGENT' : 'HIGH',
        title: `AI-Агроном отметил проблему: ${analysis.object?.name ?? 'объект'}`,
        description: `${analysis.section?.code ?? 'участок не указан'}: ${analysis.aiComment}`,
        recommendation: 'Проверить участок и назначить агрономическую задачу.',
        source: 'AI-Агроном',
      });
    }

    risks.sort((a, b) => {
      const rank: Record<RiskLevel, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return rank[a.level] - rank[b.level];
    });

    return risks;
  }

  async getSummary() {
    const { today } = this.todayRange();
    const [todayLogs, attendance, overdueTasks, staleSections, lowProducts, pendingReports, risks] =
      await Promise.all([
        this.getTodayWorkLogs(),
        this.attendanceRepo.find({ where: { workDate: today } }),
        this.getOverdueTasks(),
        this.getStaleSections(7),
        this.getLowProducts(),
        this.workLogRepo.count({ where: { reviewStatus: ReviewStatus.PENDING } }),
        this.buildRiskItems(),
      ]);

    const openAttendance = attendance.filter((row) => !row.checkOutTime);
    const summaryLines = [
      `Сегодня выполнено QR-отчетов: ${todayLogs.length}.`,
      `На работу вышло сотрудников: ${attendance.length}.`,
      `Не отметили уход: ${openAttendance.length}.`,
      `Просроченных задач: ${overdueTasks.length}.`,
      `Участков без обслуживания более 7 дней: ${staleSections.length}.`,
      `Товаров с низким остатком: ${lowProducts.length}.`,
      `Отчетов ожидают проверки: ${pendingReports}.`,
    ];

    return {
      date: today,
      completedWorksToday: todayLogs.length,
      employeesCheckedInToday: attendance.length,
      employeesWithoutCheckout: openAttendance.map((row) => row.workerFullName),
      overdueTasks: overdueTasks.length,
      staleSections: staleSections.slice(0, 10).map((row) => ({
        id: row.section.id,
        code: row.section.code,
        name: row.section.name,
        objectName: row.section.object?.name ?? '—',
        lastWork: row.lastWork,
      })),
      lowStockProducts: lowProducts.slice(0, 10).map((product) => ({
        id: product.id,
        name: product.name,
        article: product.article,
        currentQuantity: num(product.currentQuantity),
        unit: product.unit,
      })),
      reportsPendingReview: pendingReports,
      summary: summaryLines.join(' '),
      recommendations: risks.slice(0, 8).map((risk) => risk.recommendation),
    };
  }

  async getRisks() {
    return this.buildRiskItems();
  }

  async answerQuestion(dto: AdminAiQuestionDto) {
    const q = dto.question.toLowerCase();
    const [todayLogs, attendance, overdueTasks, staleSections, lowProducts] = await Promise.all([
      this.getTodayWorkLogs(),
      this.attendanceRepo.find({ where: { workDate: this.todayRange().today } }),
      this.getOverdueTasks(),
      this.getStaleSections(7),
      this.getLowProducts(),
    ]);

    if (q.includes('не уш') || q.includes('уход')) {
      const names = attendance.filter((row) => !row.checkOutTime).map((row) => row.workerFullName);
      return {
        answer: names.length ? `Сегодня не отметили уход: ${names.join(', ')}.` : 'Все сотрудники с начатой сменой отметили уход.',
      };
    }

    if (q.includes('давно') || q.includes('обслуж')) {
      return {
        answer:
          staleSections.length > 0
            ? `Давно не обслуживались: ${staleSections
                .slice(0, 10)
                .map((row) => `${row.section.code} (${row.section.name})`)
                .join(', ')}.`
            : 'Участков без обслуживания более 7 дней не найдено.',
      };
    }

    if (q.includes('товар') || q.includes('склад') || q.includes('заканч')) {
      return {
        answer:
          lowProducts.length > 0
            ? `Заканчиваются товары: ${lowProducts
                .slice(0, 10)
                .map((p) => `${p.name} (${num(p.currentQuantity)} ${p.unit ?? ''})`)
                .join(', ')}.`
            : 'Критически низких остатков не найдено.',
      };
    }

    if (q.includes('просроч')) {
      return {
        answer:
          overdueTasks.length > 0
            ? `Просроченные задачи: ${overdueTasks
                .slice(0, 10)
                .map((task) => task.description || task.workType?.name || `#${task.id}`)
                .join(', ')}.`
            : 'Просроченных задач не найдено.',
      };
    }

    if (q.includes('больше всего') || q.includes('лидер')) {
      const since = subDays(new Date(), 7);
      const logs = await this.workLogRepo
        .createQueryBuilder('workLog')
        .where('workLog.submittedAt >= :since', { since })
        .getMany();
      const counts = new Map<string, number>();
      for (const log of logs) counts.set(log.workerFullName, (counts.get(log.workerFullName) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      return {
        answer: top.length
          ? `Больше всего работ за неделю: ${top.map(([name, count]) => `${name} — ${count}`).join(', ')}.`
          : 'За неделю работ не найдено.',
      };
    }

    return {
      answer: `Кратко по данным платформы: сегодня отчетов ${todayLogs.length}, сотрудников в табеле ${attendance.length}, просроченных задач ${overdueTasks.length}, низких остатков ${lowProducts.length}, участков без обслуживания более 7 дней ${staleSections.length}.`,
    };
  }
}
