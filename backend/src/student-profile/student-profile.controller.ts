import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StudentProfileService } from './student-profile.service';
import {
  AddExamProfileDto,
  UpdateExamProfileDto,
} from './dto/student-exam-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('student/exams')
export class StudentProfileController {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.studentProfileService.listMine(user.id);
  }

  @Post()
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddExamProfileDto) {
    return this.studentProfileService.add(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExamProfileDto,
  ) {
    return this.studentProfileService.update(user.id, id, dto);
  }

  @Patch(':id/primary')
  setPrimary(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentProfileService.setPrimary(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentProfileService.remove(user.id, id);
  }
}
