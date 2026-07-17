import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;

    const header = req.headers['x-csrf-token'] as string | undefined;
    const cookie = req.cookies?.['uncozy_csrf'] as string | undefined;

    if (!header || !cookie || header !== cookie) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }
}
