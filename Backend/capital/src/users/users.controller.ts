import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { Role } from 'src/enum/Roles.enum';
import { Roles } from 'src/auth/decoration/roles.decorator';
import { RolesGuard } from 'src/guard/roles.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Admin: Get all pending users
   */
  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all pending users',
    description: 'Admin-only endpoint to fetch all users with PENDING status',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admins can access this endpoint',
  })
  async getAllPending(@Req() req) {
    return this.usersService.getAllPendingUsers(req.user.role);
  }

  /**
   * Admin or User: Get pending user by ID
   */
  @Get('pending/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get pending user by ID',
    description:
      'Fetch a pending user record. Admins can access any user, users can only access their own record.',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID of the pending user record',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Pending user record retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Pending user record not found',
  })
  async getPendingById(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req,
  ) {
    return this.usersService.getPendingUserById(
      req.user.id,
      userId,
      req.user.role,
    );
  }

  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all active users',
    description: 'Retrieve all users with ACTIVE status. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active users retrieved successfully',
    schema: {
      example: {
        success: true,
        total: 3,
        data: [
          {
            id: 1,
            email: 'john@example.com',
            username: 'john_doe',
            role: 'USER',
            status: 'ACTIVE',
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can view all active users',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getAllActiveUsers(@Req() req) {
    return this.usersService.getAllActiveUsers(req.user.role);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description:
      'Returns all registered users. Accessible only by administrators.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only admins can view all users',
  })
  async getAllUsers(@Req() req) {
    return this.usersService.getAllUsers(req.user.role);
  }
}
