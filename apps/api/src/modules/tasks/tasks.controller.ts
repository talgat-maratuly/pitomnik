import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BRIGADIER, UserRole.AGRONOMIST)
  findAll(@CurrentUser() user: User) {
    if (user.role === UserRole.ADMIN) {
      return this.tasksService.findAllForUser({ ...user, role: UserRole.ADMIN });
    }
    return this.tasksService.findAllForUser(user);
  }

  @Public()
  @Get('open')
  findOpen(@Query('sectionId', ParseIntPipe) sectionId: number) {
    return this.tasksService.findOpenForSection(sectionId);
  }

  @Get('my')
  @Roles(UserRole.WORKER)
  findMy(@CurrentUser() user: User) {
    return this.tasksService.findMyTasks(user);
  }

  @Get('my/:id')
  @Roles(UserRole.WORKER)
  findMyOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.tasksService.findMyTask(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BRIGADIER, UserRole.AGRONOMIST)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.create(dto, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BRIGADIER, UserRole.AGRONOMIST)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BRIGADIER, UserRole.AGRONOMIST)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.BRIGADIER, UserRole.AGRONOMIST)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}
