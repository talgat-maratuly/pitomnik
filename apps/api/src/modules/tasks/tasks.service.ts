import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskCategory } from '../../common/enums/task-category.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { Section } from '../../entities/section.entity';
import { Task } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';
import { WorkType } from '../../entities/work-type.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(WorkType)
    private readonly workTypeRepo: Repository<WorkType>,
  ) {}

  private baseQuery() {
    return this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.section', 'section')
      .leftJoinAndSelect('section.object', 'object')
      .leftJoinAndSelect('task.workType', 'workType')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.brigade', 'brigade')
      .leftJoinAndSelect('task.createdBy', 'createdBy');
  }

  private mapTask(row: Task) {
    return {
      id: row.id,
      sectionId: row.sectionId,
      workTypeId: row.workTypeId,
      assigneeUserId: row.assigneeUserId,
      brigadeId: row.brigadeId,
      dueDate: row.dueDate,
      priority: row.priority,
      description: row.description,
      status: row.status,
      category: row.category,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      section: row.section,
      workType: row.workType,
      assignee: row.assignee,
      brigade: row.brigade,
      createdBy: row.createdBy,
    };
  }

  private mapWorkerTask(row: Task) {
    return {
      id: row.id,
      dueDate: row.dueDate,
      status: row.status,
      priority: row.priority,
      description: row.description,
      sectionName: row.section?.name ?? '—',
      sectionCode: row.section?.code ?? '—',
      objectName: row.section?.object?.name ?? '—',
      workTypeName: row.workType?.name ?? null,
    };
  }

  private workerCanAccessTask(task: ReturnType<typeof this.mapTask>, user: User): boolean {
    if (task.assigneeUserId === user.id) return true;
    if (task.brigadeId != null && user.brigadeId != null && task.brigadeId === user.brigadeId) {
      return true;
    }
    return false;
  }

  async findMyTasks(user: User) {
    const qb = this.baseQuery().orderBy('task.dueDate', 'ASC', 'NULLS LAST');

    if (user.brigadeId) {
      qb.andWhere('(task.assigneeUserId = :userId OR task.brigadeId = :brigadeId)', {
        userId: user.id,
        brigadeId: user.brigadeId,
      });
    } else {
      qb.andWhere('task.assigneeUserId = :userId', { userId: user.id });
    }

    const rows = await qb.getMany();
    return rows.map((r) => this.mapWorkerTask(r));
  }

  async findMyTask(id: number, user: User) {
    const row = await this.baseQuery().where('task.id = :id', { id }).getOne();
    if (!row) throw new NotFoundException('Задача не найдена');
    const mapped = this.mapTask(row);
    if (!this.workerCanAccessTask(mapped, user)) {
      throw new ForbiddenException('Нет доступа к этой задаче');
    }
    return this.mapWorkerTask(row);
  }

  async findAllForUser(user: User) {
    const qb = this.baseQuery().orderBy('task.dueDate', 'ASC', 'NULLS LAST');

    if (user.role === UserRole.BRIGADIER) {
      qb.andWhere('(task.brigadeId = :brigadeId OR task.createdById = :userId)', {
        brigadeId: user.brigadeId,
        userId: user.id,
      });
    } else if (user.role === UserRole.AGRONOMIST) {
      qb.andWhere('task.category = :category', { category: TaskCategory.AGRO });
    }

    const rows = await qb.getMany();
    return rows.map((r) => this.mapTask(r));
  }

  async findOpenForSection(sectionId: number) {
    const rows = await this.baseQuery()
      .where('task.sectionId = :sectionId', { sectionId })
      .andWhere('task.status IN (:...statuses)', {
        statuses: [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS],
      })
      .orderBy('task.dueDate', 'ASC', 'NULLS LAST')
      .getMany();
    return rows.map((r) => this.mapTask(r));
  }

  async findOne(id: number) {
    const row = await this.baseQuery().where('task.id = :id', { id }).getOne();
    if (!row) throw new NotFoundException('Задача не найдена');
    return this.mapTask(row);
  }

  async create(dto: CreateTaskDto, createdBy: User) {
    const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId } });
    if (!section) throw new NotFoundException('Участок не найден');

    if (dto.workTypeId) {
      const wt = await this.workTypeRepo.findOne({ where: { id: dto.workTypeId } });
      if (!wt) throw new NotFoundException('Вид работы не найден');
    }

    const category =
      dto.category ??
      (createdBy.role === UserRole.AGRONOMIST ? TaskCategory.AGRO : TaskCategory.WORK);

    const row = this.taskRepo.create({
      sectionId: dto.sectionId,
      workTypeId: dto.workTypeId ?? null,
      assigneeUserId: dto.assigneeUserId ?? null,
      brigadeId: dto.brigadeId ?? null,
      dueDate: dto.dueDate ?? null,
      priority: dto.priority,
      description: dto.description?.trim() ?? '',
      status: dto.status ?? TaskStatus.ASSIGNED,
      category,
      createdById: createdBy.id,
    });
    const saved = await this.taskRepo.save(row);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTaskDto) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Задача не найдена');

    if (dto.sectionId !== undefined) row.sectionId = dto.sectionId;
    if (dto.workTypeId !== undefined) row.workTypeId = dto.workTypeId;
    if (dto.assigneeUserId !== undefined) row.assigneeUserId = dto.assigneeUserId;
    if (dto.brigadeId !== undefined) row.brigadeId = dto.brigadeId;
    if (dto.dueDate !== undefined) row.dueDate = dto.dueDate;
    if (dto.priority !== undefined) row.priority = dto.priority;
    if (dto.description !== undefined) row.description = dto.description.trim();
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.category !== undefined) row.category = dto.category;

    await this.taskRepo.save(row);
    return this.findOne(id);
  }

  async remove(id: number) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Задача не найдена');
    await this.taskRepo.remove(row);
  }
}
