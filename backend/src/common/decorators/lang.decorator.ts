import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Language } from '@prisma/client';

export const Lang = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Language => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const queryLang = (
      request.query?.lang as string | undefined
    )?.toLowerCase();
    if (queryLang === 'hi') return Language.HI;
    if (queryLang === 'en') return Language.EN;

    const header = request.headers['accept-language'];
    if (typeof header === 'string' && header.toLowerCase().startsWith('hi')) {
      return Language.HI;
    }

    return Language.EN;
  },
);
