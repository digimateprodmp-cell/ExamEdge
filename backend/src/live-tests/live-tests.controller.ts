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
import { IntegrityEventType, Language, Role } from '@prisma/client';
import { LiveTestsService } from './live-tests.service';
import { LiveTestAttemptService } from './live-test-attempt.service';
import { IntegrityEventService } from './integrity-event.service';
import {
  CreateIntegrityPolicyDto,
  CreateLiveTestDto,
  RecordIntegrityEventDto,
  UpdateLiveTestDto,
} from './dto/live-test.dto';
import { SaveAnswerDto } from '../attempts/dto/attempt.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('live-tests')
export class LiveTestsController {
  constructor(
    private readonly liveTestsService: LiveTestsService,
    private readonly liveTestAttemptService: LiveTestAttemptService,
    private readonly integrityEventService: IntegrityEventService,
    private readonly prisma: PrismaService,
  ) {}

  // ---- Public / student browse ----

  @Public()
  @Get()
  findAllPublic(@Query('examCycleId') examCycleId?: string) {
    return this.liveTestsService.findAllPublic(examCycleId);
  }

  @Get('mine/attempts')
  listMyAttempts(@CurrentUser() user: AuthenticatedUser) {
    return this.liveTestAttemptService.listMine(user.id);
  }

  // ---- Admin CRUD ----

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin() {
    return this.liveTestsService.findAllAdmin();
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.liveTestsService.findOneAdmin(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLiveTestDto,
  ) {
    return this.liveTestsService.create(user.id, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLiveTestDto,
  ) {
    return this.liveTestsService.update(user.id, id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.liveTestsService.cancel(user.id, id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/publish')
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.liveTestsService.publish(user.id, id);
  }

  // ---- Integrity policies (admin) ----

  @Roles(Role.ADMIN)
  @Get('integrity-policies')
  listIntegrityPolicies() {
    return this.prisma.integrityPolicy.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles(Role.ADMIN)
  @Post('integrity-policies')
  createIntegrityPolicy(@Body() dto: CreateIntegrityPolicyDto) {
    return this.prisma.integrityPolicy.create({
      data: {
        name: dto.name,
        config: dto.config ?? {},
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Roles(Role.ADMIN)
  @Patch('integrity-policies/:id')
  updateIntegrityPolicy(
    @Param('id') id: string,
    @Body() dto: Partial<CreateIntegrityPolicyDto>,
  ) {
    return this.prisma.integrityPolicy.update({ where: { id }, data: dto });
  }

  // ---- Public detail (kept after /admin and /integrity-policies so those match first) ----

  @Public()
  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.liveTestsService.findOnePublic(id);
  }

  // ---- Student attempt flow ----

  @HttpCode(HttpStatus.OK)
  @Post(':id/join')
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('lang') lang?: Language,
  ) {
    return this.liveTestAttemptService.join(
      user.id,
      id,
      lang && Language[lang] ? lang : undefined,
    );
  }

  @Get('attempts/:attemptId')
  getState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
  ) {
    return this.liveTestAttemptService.getState(user.id, attemptId);
  }

  @Patch('attempts/:attemptId/answers/:testQuestionId')
  saveAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
    @Param('testQuestionId') testQuestionId: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.liveTestAttemptService.saveAnswer(
      user.id,
      attemptId,
      testQuestionId,
      dto,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('attempts/:attemptId/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
  ) {
    return this.liveTestAttemptService.submit(user.id, attemptId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('attempts/:attemptId/integrity-events')
  recordIntegrityEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: RecordIntegrityEventDto,
  ) {
    return this.integrityEventService.recordEvent(
      user.id,
      attemptId,
      dto.eventType as IntegrityEventType,
      dto.keyCombination,
      dto.browserInfo,
      dto.metadata,
    );
  }
}
