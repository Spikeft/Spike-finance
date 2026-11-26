import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: { findUnique: jest.Mock };
    tag: { findUnique: jest.Mock; upsert: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      tag: { findUnique: jest.fn(), upsert: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns suggestedTag from firstName and lastName when user has no tag', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      firstName: 'Zara',
      lastName: 'Udo',
      email: 'zara@example.com',
      tag: null,
    });
    prisma.tag.findUnique.mockResolvedValue(null);

    const result = await service.getMySpikeTag('user-1');
    expect(result.hasTag).toBe(false);
    expect(result.tag).toBeNull();
    expect(result.suggestedTag).toBe('zaraudo');
  });
});
