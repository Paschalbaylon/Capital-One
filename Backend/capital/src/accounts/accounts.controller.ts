import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Req,
  UseGuards,
  UnauthorizedException,
  Get,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { DepositDto } from './dtos/deposite.dto';
import { WithdrawDto } from './dtos/withdraw.dto';
import * as Interfaces from '../common/interfaces/request-with-user.interface';
import { ChangePinDto } from './dtos/change-pin.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { TransferDto } from './dtos/transfer.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CloseAccountDto } from './dtos/closeAccount.dto';
import { RolesGuard } from 'src/guard/roles.guard';
import { Role } from 'src/enum/Roles.enum';
import { Roles } from 'src/auth/decoration/roles.decorator';
import { CreateAccountDto } from './dtos/createAccount.dto';
import { DepositEditDto } from './dtos/deposit-edit.dto';
import { WithdrawEditDto } from './dtos/withdrawEdit.dto';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('accounts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  /*
   * Admin creates account for a specific user
   * POST /accounts
   */
  @Post('approve/:userId')
  @UseGuards(RolesGuard) // Add the guard here
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED) // 201 Created status
  @ApiOperation({
    summary: 'Approve pending user and create account',
    description:
      'Creates an ACTIVE account for a PENDING user and activates the user. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID of the pending user',
    example: 5,
  })
  @ApiResponse({
    status: 201,
    description: 'Account created and user activated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can perform this action',
  })
  @ApiResponse({
    status: 404,
    description: 'Pending user not found or already has an account',
  })
  async createAccountForPendingUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req,
  ) {
    return this.accountsService.createAccountForPendingUser(
      req.user.id, // adminId from JWT
      userId,
    );
  }

  @Get('all')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get ALL accounts (Admin only)',
    description: 'Returns all bank accounts in the system. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'All accounts retrieved successfully',
  })
  async getAllAccounts(@Req() req) {
    return this.accountsService.getAllAccountsForAdmin(
      req.user.id,
      req.user.role,
    );
  }
  // @Post(':userId')
  // create(@Param('userId', ParseIntPipe) userId: number) {
  //   return this.accountsService.createAccount(userId);
  // }

  @Post('deposit/:accountNumber')
  async deposit(
    @Param('accountNumber') accountNumber: string,
    @Body() depositDto: DepositDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.accountsService.deposit(
      accountNumber,
      depositDto.amount,
      userId,
      userRole,
    );
  }

  @Post('withdraw/:accountNumber')
  async withdraw(
    @Param('accountNumber') accountNumber: string,
    @Body() withdrawDto: WithdrawDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;

    // ✅ This should work - passing 4 arguments to a method expecting 4 parameters
    return this.accountsService.withdraw(
      accountNumber,
      withdrawDto,
      userId,
      userRole,
    );
  }

  @Post('transfer/:fromAccountNumber')
  @ApiOperation({ summary: 'Transfer money between accounts' })
  @ApiParam({
    name: 'fromAccountNumber',
    description: 'Sender account number',
    example: '1234567890',
  })
  @ApiBody({ type: TransferDto })
  async transfer(
    @Param('fromAccountNumber') fromAccountNumber: string,
    @Body() transferDto: TransferDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.accountsService.transfer(
      fromAccountNumber,
      transferDto,
      userId,
      userRole,
    );
  }
  // Get account details with recent transactions
  @Get(':id')
  @ApiOperation({ summary: 'Get account details with recent transactions' })
  @ApiParam({ name: 'id', description: 'Account ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getAccountInfo(@Param('id', ParseIntPipe) accountId: number, @Req() req) {
    const userId = req.user.id;
    return this.accountsService.getAccountInfo(accountId, userId);
  }

  // Get account balance only
  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({ name: 'id', description: 'Account ID', type: Number })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getBalance(@Param('id', ParseIntPipe) accountId: number, @Req() req) {
    const userId = req.user.id;
    return this.accountsService.getBalance(accountId, userId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all accounts for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAccounts(@Req() req) {
    const userId = req.user.id;
    return this.accountsService.getUserAccounts(userId);
  }

  @Get('account/:accountId')
  async getTransactionHistory(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Req() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const userId = req.user.id;

    return this.accountsService.getTransactionHistory(
      accountId,
      userId,
      Number(page),
      Number(limit),
    );
  }

  @Delete(':accountId/close')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard)
  async closeAccount(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Req() req: RequestWithUser,
    @Body() closeAccountDto: CloseAccountDto,
  ) {
    const userId = req.user.id;
    const { pin } = closeAccountDto;

    return this.accountsService.closeAccount(accountId, userId, pin);
  }

  @Post(':accountNumber/deposit/edit')
  @ApiOperation({
    summary: 'Deposit with custom date editing',
    description:
      'Deposit money to an account with custom date option. Admins can set custom dates.',
  })
  @ApiParam({
    name: 'accountNumber',
    type: String,
    description: 'Account number to deposit to',
    example: '1234567890',
  })
  @ApiBody({
    type: DepositEditDto,
    description: 'Deposit details with optional custom date',
  })
  @ApiResponse({
    status: 200,
    description: 'Deposit successful',
    schema: {
      example: {
        success: true,
        message: 'Deposit successful',
        data: {
          accountNumber: '1234567890',
          previousBalance: 1000,
          newBalance: 2000,
          amountDeposited: 1000,
          transaction: {
            id: 1,
            amount: 1000,
            type: 'DEPOSIT',
            createdAt: '2024-01-15T10:30:00.000Z',
          },
          timestamp: '2024-01-15T10:30:00.000Z',
          isCustomDate: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount or date',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot deposit to other accounts',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async depositAndEdit(
    @Req() req,
    @Param('accountNumber') accountNumber: string,
    @Body() depositDto: DepositEditDto,
  ) {
    const { amount, transactionDate } = depositDto;

    // Parse custom date if provided
    let customDate: Date | undefined;
    if (transactionDate) {
      customDate = new Date(transactionDate);
      if (isNaN(customDate.getTime())) {
        throw new BadRequestException('Invalid transaction date format');
      }
    }

    return this.accountsService.depositAndEdit(
      accountNumber,
      amount,
      customDate,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':accountNumber/withdraw/edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Withdraw with custom date editing',
    description:
      'Withdraw money from an account with custom date option. Requires PIN verification.',
  })
  @ApiParam({
    name: 'accountNumber',
    type: String,
    description: 'Account number to withdraw from',
    example: '1234567890',
  })
  @ApiBody({
    type: WithdrawEditDto,
    description: 'Withdrawal details with PIN and optional custom date',
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal successful',
    schema: {
      example: {
        success: true,
        message: 'Withdrawal successful',
        data: {
          accountNumber: '1234567890',
          reference: 'WD-00000001',
          previousBalance: 2000,
          newBalance: 1000,
          amountWithdrawn: 1000,
          transactionId: 1,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Insufficient balance, invalid amount, or invalid date',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid PIN',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot withdraw from other accounts',
  })
  @ApiResponse({
    status: 404,
    description: 'Account or user not found',
  })
  async withdrawAndEdit(
    @Req() req,
    @Param('accountNumber') accountNumber: string,
    @Body() withdrawDto: WithdrawEditDto,
  ) {
    return this.accountsService.withdrawAndEdit(
      accountNumber,
      withdrawDto,
      req.user.id,
      req.user.role,
    );
  }
}

// @Patch('pin/change')
// async changePin(
//   @Req() req: Interfaces.RequestWithUser,
//   @Body() dto: ChangePinDto,
// ) {
//   // Now req.user is type-safe
//   return this.accountsService.changeTransactionPin(
//     req.user.id,
//     dto.oldPin,
//     dto.newPin,
//   );
// }

// @Patch('pin/reset')
// resetPin(@Req() req, @Body() dto: { email: string }) {
//   return this.accountsService.resetTransactionPin(req.user.id, dto.email);
// }

// @Post('pin/verify')
// verifyPin(@Req() req, @Body() dto: { pin: string }) {
//   return this.accountsService.verifyPin(req.user.id, dto.pin);
// }
