import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeTagPart(value?: string | null): string {
    if (!value) return '';
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private normalizeTagInput(rawTag: string): string {
    return rawTag.trim().replace(/^@+/, '').toLowerCase();
  }

  private async generateUniqueSuggestedTag(user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  }): Promise<string> {
    const first = this.sanitizeTagPart(user.firstName).slice(0, 7);
    const last = this.sanitizeTagPart(user.lastName).slice(0, 7);

    let base = `${first}${last}`;
    if (base.length < 3 && user.email) {
      const emailPrefix = this.sanitizeTagPart(user.email.split('@')[0]).slice(
        0,
        12,
      );
      base = emailPrefix;
    }
    if (base.length < 3) {
      base = 'spikeuser';
    }

    // Try plain base first
    const baseExists = await this.prisma.tag.findUnique({
      where: { tag: base },
      select: { id: true },
    });
    if (!baseExists) {
      return base;
    }

    // Append short numeric suffixes until unique
    for (let attempt = 0; attempt < 25; attempt++) {
      const suffix =
        attempt < 9
          ? String(attempt + 1)
          : String(Math.floor(10 + Math.random() * 989));
      const trimmedBase = base.slice(0, Math.max(3, 20 - suffix.length));
      const candidate = `${trimmedBase}${suffix}`;

      const exists = await this.prisma.tag.findUnique({
        where: { tag: candidate },
        select: { id: true },
      });
      if (!exists) {
        return candidate;
      }
    }

    // Final guaranteed fallback with timestamp tail
    const tail = String(Date.now()).slice(-5);
    return `${base.slice(0, 12)}${tail}`;
  }

  async getMySpikeTag(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tag: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tag && !user.tag.isDeleted) {
      return {
        hasTag: true,
        tag: user.tag.tag,
        suggestedTag: user.tag.tag,
        tagRecord: user.tag,
      };
    }

    const suggestedTag = await this.generateUniqueSuggestedTag(user);
    return {
      hasTag: false,
      tag: null,
      suggestedTag,
      tagRecord: null,
    };
  }

  async checkSpikeTagAvailability(userId: string, rawTag: string) {
    const normalized = this.normalizeTagInput(rawTag || '');
    if (!/^[a-z0-9._]{3,20}$/.test(normalized)) {
      return { tag: normalized, available: false };
    }

    const existing = await this.prisma.tag.findUnique({
      where: { tag: normalized },
      select: { userId: true, isDeleted: true },
    });

    const available =
      !existing || existing.isDeleted || existing.userId === userId;

    return { tag: normalized, available };
  }

  async createSpikeTag(userId: string, rawTag: string) {
    const normalized = this.normalizeTagInput(rawTag);

    if (!/^[a-z0-9._]{3,20}$/.test(normalized)) {
      throw new BadRequestException(
        'SPIKE tag must be 3–20 characters and contain only letters, numbers, dots, or underscores.',
      );
    }

    const existingOwner = await this.prisma.tag.findUnique({
      where: { tag: normalized },
    });

    if (existingOwner && existingOwner.userId !== userId) {
      throw new ConflictException(
        'This SPIKE tag is already taken. Please choose another one.',
      );
    }

    const saved = await this.prisma.tag.upsert({
      where: { userId },
      create: {
        userId,
        tag: normalized,
      },
      update: {
        tag: normalized,
        isDeleted: false,
        deletedAt: null,
      },
    });

    return {
      hasTag: true,
      tag: saved.tag,
      suggestedTag: saved.tag,
      tagRecord: saved,
    };
  }
}
