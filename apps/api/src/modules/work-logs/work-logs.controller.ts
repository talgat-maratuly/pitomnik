import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkLogsService } from './work-logs.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { WorkLogQueryDto } from './dto/work-log-query.dto';

@ApiTags('work-logs')
@Controller('work-logs')
export class WorkLogsController {
  constructor(private readonly workLogsService: WorkLogsService) {}

  @Get('stats')
  getStats() {
    return this.workLogsService.getStats();
  }

  @Get()
  findAll(@Query() query: WorkLogQueryDto) {
    return this.workLogsService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateWorkLogDto) {
    return this.workLogsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workLogsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workLogsService.remove(id);
  }
}
