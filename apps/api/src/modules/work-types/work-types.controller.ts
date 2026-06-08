import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkTypesService } from './work-types.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';

@ApiTags('work-types')
@Controller('work-types')
export class WorkTypesController {
  constructor(private readonly workTypesService: WorkTypesService) {}

  @Get()
  findAll() {
    return this.workTypesService.findAll();
  }

  @Get('active')
  findActive() {
    return this.workTypesService.findActive();
  }

  @Post()
  create(@Body() dto: CreateWorkTypeDto) {
    return this.workTypesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkTypeDto) {
    return this.workTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workTypesService.remove(id);
  }
}
