import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Throttle authenticated endpoints per user, fallback to IP
    return req.user?.publicId ?? req.ip ?? 'unknown';
  }
}
