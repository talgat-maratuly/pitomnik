import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskCategory } from '../../../common/enums/task-category.enum';
import { TaskPriority } from '../../../common/enums/task-priority.enum';
import { TaskStatus } from '../../../common/enums/task-status.enum';

export class CreateTaskDto {
  @Type(() => Number)
  @IsInt()
  sectionId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  workTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigneeUserId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brigadeId?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;
}
