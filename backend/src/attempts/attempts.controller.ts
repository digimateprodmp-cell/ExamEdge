import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Language } from '@prisma/client';
import { AttemptsService } from './attempts.service';
import { SaveAnswerDto, StartAttemptDto } from './dto/attempt.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get('mine')
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('testId') testId?: string,
  ) {
    return this.attemptsService.listMine(user.id, testId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartAttemptDto) {
    return this.attemptsService.start(user.id, dto);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('lang') lang?: Language,
  ) {
    return this.attemptsService.getForStudent(
      user.id,
      id,
      lang && Language[lang] ? lang : undefined,
    );
  }

  @Patch(':id/answers/:testQuestionId')
  saveAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('testQuestionId') testQuestionId: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.attemptsService.saveAnswer(user.id, id, testQuestionId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.attemptsService.submit(user.id, id);
  }

  @Get(':id/result')
  getResult(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('lang') lang?: Language,
  ) {
    return this.attemptsService.getResult(
      user.id,
      id,
      lang && Language[lang] ? lang : undefined,
    );
  }
}
