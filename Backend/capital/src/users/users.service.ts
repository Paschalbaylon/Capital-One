import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/enum/Roles.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingUsersWithoutAccounts(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        status: 'PENDING',
        accounts: {
          none: {}, // "has no accounts"
        },
      },
    });
  }

  /**
   * Admin: Get all pending users
   */
  async getAllPendingUsers(requesterRole?: string) {
    const isAdmin = requesterRole === Role.ADMIN || requesterRole === 'ADMIN';

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view all pending users');
    }

    const users = await this.prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      total: users.length,
      data: users,
    };
  }

  /**
   * Admin: Get all active users
   */
  async getAllActiveUsers(requesterRole?: string) {
    const isAdmin = requesterRole === Role.ADMIN || requesterRole === 'ADMIN';

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view all active users');
    }

    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      total: users.length,
      data: users,
    };
  }

  async getAllUsers(requesterRole?: string) {
    const isAdmin = requesterRole === Role.ADMIN || requesterRole === 'ADMIN';

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view all users');
    }
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      total: users.length,
      data: users,
    };
  }

  /**
   * Admin or User: Get pending user record by userId
   */
  async getPendingUserById(
    requesterId: number,
    targetUserId: number,
    requesterRole?: string,
  ) {
    const isAdmin = requesterRole === Role.ADMIN || requesterRole === 'ADMIN';

    if (!isAdmin && requesterId !== targetUserId) {
      throw new ForbiddenException('You can only view your own pending record');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        status: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Pending user record not found');
    }

    return {
      success: true,
      data: user,
    };
  }
}
