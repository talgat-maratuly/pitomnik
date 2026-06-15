import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../entities/user.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CheckOutDto } from './dto/check-out.dto';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Public()
  @Get('active-today')
  findActiveToday() {
    return this.attendanceService.findActiveForToday();
  }

  @Public()
  @Post('check-out')
  checkOut(@Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BRIGADIER, UserRole.AGRONOMIST)
  findAll(@Query() query: AttendanceQueryDto, @CurrentUser() user: User) {
    return this.attendanceService.findAll(query, user);
  }
}
