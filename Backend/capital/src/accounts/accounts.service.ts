import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';
import { WithdrawDto } from './dtos/withdraw.dto';
import { generateNumericCode } from 'src/utils/accountNumber.util';
import { Role } from 'src/enum/Roles.enum';
import { TransferDto } from './dtos/transfer.dto';
import { WithdrawEditDto } from './dtos/withdrawEdit.dto';

// Define a type for Prisma errors
interface PrismaError {
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  // Helper method to check if error is a Prisma error
  private isPrismaError(error: unknown): error is PrismaError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as PrismaError).code === 'string'
    );
  }

  async createAccountForPendingUser(adminId: string, targetUserId: string) {
    try {
      // 1. Verify requesting user (ADMIN)
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, role: true, email: true, username: true },
      });

      if (!admin) {
        throw new NotFoundException('Requesting user not found');
      }

      if (admin.role !== Role.ADMIN) {
        throw new ForbiddenException(
          'Only administrators can create accounts for pending users',
        );
      }

      // 2. Find pending user with NO account
      const pendingUser = await this.prisma.user.findFirst({
        where: {
          id: targetUserId,
          status: 'PENDING',
          accounts: {
            none: {},
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
        },
      });

      if (!pendingUser) {
        throw new NotFoundException(
          'Pending user not found or user already has an account',
        );
      }

      // 3. Generate unique account number
      let accountNumber = generateNumericCode(10);
      let attempts = 0;

      while (
        await this.prisma.account.findUnique({
          where: { accountNumber },
        })
      ) {
        if (attempts++ > 5) {
          throw new InternalServerErrorException(
            'Failed to generate unique account number',
          );
        }
        accountNumber = generateNumericCode(10);
      }

      // 4. Create account + activate user (transaction-safe)
      const result = await this.prisma.$transaction(async (tx) => {
        const createdAccount = await tx.account.create({
          data: {
            userId: pendingUser.id,
            accountNumber,
            status: 'ACTIVE',
            createdBy: admin.id,
          },
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                status: true,
              },
            },
          },
        });

        await tx.user.update({
          where: { id: pendingUser.id },
          data: { status: 'ACTIVE' },
        });

        createdAccount.user.status = 'ACTIVE';

        return createdAccount;
      });

      // 5. Send emails
      await this.mailService.createdAccountEmail(
        pendingUser.email,
        pendingUser.username,
        result.accountNumber,
      );

      await this.mailService.adminCreatedAccountEmail(
        admin.email,
        admin.username,
        pendingUser.username,
        result.accountNumber,
      );

      return {
        success: true,
        message: `Account created and user activated successfully`,
        data: {
          account: {
            id: result.id,
            accountNumber: result.accountNumber,
            balance: result.balance,
            status: result.status,
            createdAt: result.createdAt,
          },
          user: {
            id: pendingUser.id,
            username: pendingUser.username,
            status: 'ACTIVE',
          },
          createdByAdmin: admin.username,
        },
      };
    } catch (error) {
      console.error('Create account for pending user error:', error);

      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Fix: Use type guard to safely check Prisma error
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new InternalServerErrorException(
          'Account number conflict. Please try again.',
        );
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while creating account for pending user',
      );
    }
  }

  // For admin to get ALL accounts
  async getAllAccountsForAdmin(adminUserId: string, userRole?: string) {
    const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';

    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can view all accounts');
    }

    const accounts = await this.prisma.account.findMany({
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      total: accounts.length,
      data: accounts,
    };
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

  async deposit(
    accountNumber: string,
    amount: number,
    userId?: string,
    userRole?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    try {
      const account = await this.prisma.account.findUnique({
        where: { accountNumber },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      if (!account) {
        throw new NotFoundException(
          `Account with number ${accountNumber} not found`,
        );
      }

      if (userId) {
        const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
        if (!isAdmin && account.userId !== userId) {
          throw new ForbiddenException(
            'You can only deposit to your own accounts',
          );
        }
      }

      const updatedAccount = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.account.update({
          where: { accountNumber },
          data: { balance: { increment: amount } },
        });

        await tx.transaction.create({
          data: {
            amount,
            type: 'DEPOSIT',
            accountId: account.id,
            notes: `Deposit to account ${accountNumber}`,
          },
        });

        return updated;
      });

      const latestTransaction = await this.prisma.transaction.findFirst({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
      });

      await this.mailService.sendTransactionEmail(
        account.user.email,
        account.user.username,
        amount,
        updatedAccount.balance,
        'DEPOSIT',
        accountNumber,
      );

      return {
        success: true,
        message: 'Deposit successful',
        data: {
          accountNumber,
          previousBalance: account.balance,
          newBalance: updatedAccount.balance,
          amountDeposited: amount,
          transaction: latestTransaction,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error('Deposit error:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Fix: Use type guard to safely check Prisma error
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException(`Account not found`);
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred during deposit',
      );
    }
  }

  async withdraw(
    accountNumber: string,
    withdrawDto: WithdrawDto,
    userId: string,
    userRole?: string,
  ) {
    try {
      const { amount, pin, notes } = withdrawDto;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          transactionPin: true,
          username: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.transactionPin) {
        throw new BadRequestException(
          'Transaction PIN not set. Please set your PIN first.',
        );
      }

      const isPinValid = await bcrypt.compare(pin, user.transactionPin);
      const isDefaultPin = await bcrypt.compare('0000', user.transactionPin);

      if (isDefaultPin) {
        throw new BadRequestException(
          'Please change your default transaction PIN before making withdrawals',
        );
      }

      if (!isPinValid) {
        throw new UnauthorizedException('Invalid transaction PIN');
      }

      const account = await this.prisma.account.findUnique({
        where: { accountNumber },
        select: {
          id: true,
          userId: true,
          accountNumber: true,
          balance: true,
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      });

      if (!account) {
        throw new NotFoundException(
          `Account with number ${accountNumber} not found`,
        );
      }

      const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
      if (!isAdmin && account.userId !== userId) {
        throw new ForbiddenException(
          'You can only withdraw from your own accounts',
        );
      }

      if (account.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₱${account.balance.toFixed(2)}`,
        );
      }

      const MIN_WITHDRAWAL = 100;
      if (amount < MIN_WITHDRAWAL) {
        throw new BadRequestException(
          `Minimum withdrawal amount is ₱${MIN_WITHDRAWAL}`,
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedAccount = await tx.account.update({
          where: { accountNumber },
          data: { balance: { decrement: amount } },
        });

        const transaction = await tx.transaction.create({
          data: {
            type: 'WITHDRAW',
            amount,
            accountId: account.id,
            notes: notes || `Withdrawal from account ${accountNumber}`,
          },
        });

        return { updatedAccount, transaction };
      });

      await this.mailService.withdrawTransactionEmail(
        user.email,
        user.username,
        amount,
        result.updatedAccount.balance,
        accountNumber,
      );

      return {
        success: true,
        message: 'Withdrawal successful',
        data: {
          accountNumber,
          reference: `WD-${result.transaction.id.toString().padStart(8, '0')}`,
          previousBalance: account.balance,
          newBalance: result.updatedAccount.balance,
          amountWithdrawn: amount,
          transactionId: result.transaction.id,
          timestamp: result.transaction.createdAt,
        },
      };
    } catch (error) {
      console.error('Withdrawal error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Fix: Use type guard to safely check Prisma error
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('Account not found');
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred during withdrawal',
      );
    }
  }

  async transfer(
    fromAccountNumber: string,
    transferDto: TransferDto,
    userId: string,
    userRole?: string,
  ) {
    try {
      const { toAccountNumber, amount, pin, notes } = transferDto;

      if (amount <= 0) {
        throw new BadRequestException('Amount must be greater than zero');
      }

      if (fromAccountNumber === toAccountNumber) {
        throw new BadRequestException('Cannot transfer to the same account');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          transactionPin: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.transactionPin) {
        throw new BadRequestException('Please set your transaction PIN first');
      }

      const isPinValid = await bcrypt.compare(pin, user.transactionPin);
      if (!isPinValid) {
        throw new UnauthorizedException('Invalid transaction PIN');
      }

      const isDefaultPin = await bcrypt.compare('0000', user.transactionPin);
      if (isDefaultPin) {
        throw new BadRequestException(
          'Please change your default transaction PIN before making transfers',
        );
      }

      const fromAccount = await this.prisma.account.findUnique({
        where: { accountNumber: fromAccountNumber },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!fromAccount) {
        throw new NotFoundException(
          `Sender account ${fromAccountNumber} not found`,
        );
      }

      const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
      if (!isAdmin && fromAccount.userId !== userId) {
        throw new ForbiddenException(
          'You can only transfer from your own accounts',
        );
      }

      if (fromAccount.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₱${fromAccount.balance.toFixed(2)}`,
        );
      }

      const toAccount = await this.prisma.account.findUnique({
        where: { accountNumber: toAccountNumber },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!toAccount) {
        throw new NotFoundException(
          `Recipient account ${toAccountNumber} not found`,
        );
      }

      if (toAccount.userId === fromAccount.userId) {
        throw new BadRequestException(
          'Cannot transfer between your own accounts. Use internal transfer instead.',
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedFromAccount = await tx.account.update({
          where: { accountNumber: fromAccountNumber },
          data: { balance: { decrement: amount } },
        });

        const updatedToAccount = await tx.account.update({
          where: { accountNumber: toAccountNumber },
          data: { balance: { increment: amount } },
        });

        const senderTransaction = await tx.transaction.create({
          data: {
            type: 'TRANSFER_OUT',
            amount: amount,
            accountId: fromAccount.id,
            notes:
              notes ||
              `Transfer to ${toAccount.user.username} (Account: ${toAccountNumber})`,
          },
        });

        const receiverTransaction = await tx.transaction.create({
          data: {
            type: 'TRANSFER_IN',
            amount: amount,
            accountId: toAccount.id,
            notes:
              notes ||
              `Transfer from ${fromAccount.user.username} (Account: ${fromAccountNumber})`,
          },
        });

        return {
          updatedFromAccount,
          updatedToAccount,
          senderTransaction,
          receiverTransaction,
          fromAccountUser: fromAccount.user,
          toAccountUser: toAccount.user,
        };
      });

      try {
        await this.mailService.fromAccountEmail(
          result.fromAccountUser.email,
          result.fromAccountUser.username,
          result.toAccountUser.username,
          amount,
          result.updatedFromAccount.balance,
          fromAccountNumber,
          toAccountNumber,
        );

        await this.mailService.toAccountEmail(
          result.toAccountUser.email,
          result.toAccountUser.username,
          result.fromAccountUser.username,
          amount,
          result.updatedToAccount.balance,
          toAccountNumber,
          fromAccountNumber,
        );
      } catch (emailError) {
        console.error('Failed to send transfer emails:', emailError);
      }

      return {
        success: true,
        message: 'Transfer completed successfully',
        data: {
          reference: `TR-${result.senderTransaction.id.toString().padStart(8, '0')}`,
          fromAccount: {
            accountNumber: fromAccountNumber,
            accountHolder: result.fromAccountUser.username,
            previousBalance: fromAccount.balance,
            newBalance: result.updatedFromAccount.balance,
          },
          toAccount: {
            accountNumber: toAccountNumber,
            accountHolder: result.toAccountUser.username,
            previousBalance: toAccount.balance,
            newBalance: result.updatedToAccount.balance,
          },
          amount: amount,
          fees: 0,
          netAmount: amount,
          timestamp: result.senderTransaction.createdAt,
          transactionId: result.senderTransaction.id,
        },
      };
    } catch (error) {
      console.error('Transfer error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Fix: Use type guard to safely check Prisma error
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('Account not found');
      }

      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new BadRequestException('Transaction conflict occurred');
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred during transfer. Please try again.',
      );
    }
  }

  // ==================== ACCOUNT INFO METHODS ====================

  async getAccountInfo(accountId: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return {
      success: true,
      data: {
        accountId: account.id,
        balance: account.balance,
        createdAt: account.createdAt,
        recentTransactions: account.transactions,
      },
    };
  }

  async getBalance(accountId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
      select: {
        id: true,
        balance: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    try {
      await this.mailService.sendBalanceInquiryEmail(
        user.email,
        user.username,
        account.balance,
        Number(account.id),
      );
    } catch (emailError) {
      console.error('Failed to send balance inquiry email:', emailError);
    }

    return {
      success: true,
      data: {
        accountId: account.id,
        balance: account.balance,
        currency: '$',
        lastUpdated: account.updatedAt,
      },
    };
  }

  async getUserAccounts(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: {
        userId: userId,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        message: 'No accounts found',
        data: [],
      };
    }

    const formattedAccounts = accounts.map((account) => ({
      accountId: account.id,
      balance: account.balance,
      createdAt: account.createdAt,
      recentTransactions: account.transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        notes: transaction.notes,
        date: transaction.createdAt,
      })),
    }));

    return {
      success: true,
      data: formattedAccounts,
      total: accounts.length,
    };
  }

  async getTransactionHistory(
    accountId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const skip = (page - 1) * limit;
    const total = await this.prisma.transaction.count({
      where: { accountId },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: { accountId },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  }

  async closeAccount(accountId: string, userId: string, pin: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { transactionPin: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPinValid = await bcrypt.compare(pin, user.transactionPin);
    if (!isPinValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
      include: {
        transactions: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.balance > 0) {
      throw new BadRequestException(
        'Cannot close account with remaining balance',
      );
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    await this.mailService.sendAccountClosedEmail(
      user.email,
      `Account ${accountId} has been closed successfully`,
    );

    return {
      success: true,
      message: 'Account closed successfully',
      accountId,
      closedAt: new Date(),
    };
  }

  // Deposit with custom date (admin feature)
  async depositAndEdit(
    accountNumber: string,
    amount: number,
    customDate?: Date,
    userId?: string,
    userRole?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    if (customDate && isNaN(new Date(customDate).getTime())) {
      throw new BadRequestException('Invalid custom date provided');
    }

    try {
      const account = await this.prisma.account.findUnique({
        where: { accountNumber },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      if (!account) {
        throw new NotFoundException(
          `Account with number ${accountNumber} not found`,
        );
      }

      if (userId) {
        const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
        if (!isAdmin && account.userId !== userId) {
          throw new ForbiddenException(
            'You can only deposit to your own accounts',
          );
        }
      }

      const transactionDate = customDate ? new Date(customDate) : new Date();
      const now = new Date();

      if (transactionDate > now && !(userRole === Role.ADMIN)) {
        throw new BadRequestException(
          'Transaction date cannot be in the future',
        );
      }

      const updatedAccount = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.account.update({
          where: { accountNumber },
          data: {
            balance: { increment: amount },
            updatedAt: transactionDate,
          },
        });

        await tx.transaction.create({
          data: {
            amount,
            type: 'DEPOSIT',
            accountId: account.id,
            notes: `Deposit to account ${accountNumber}`,
            createdAt: transactionDate,
            updatedAt: transactionDate,
          },
        });

        return updated;
      });

      const latestTransaction = await this.prisma.transaction.findFirst({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
      });

      await this.mailService.sendTransactionEmail(
        account.user.email,
        account.user.username,
        amount,
        updatedAccount.balance,
        'DEPOSIT',
        accountNumber,
      );

      return {
        success: true,
        message: 'Deposit successful',
        data: {
          accountNumber,
          previousBalance: account.balance,
          newBalance: updatedAccount.balance,
          amountDeposited: amount,
          transaction: latestTransaction,
          timestamp: transactionDate,
          isCustomDate: !!customDate,
        },
      };
    } catch (error) {
      console.error('Deposit with edit error:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred during deposit',
      );
    }
  }

  async withdrawAndEdit(
    accountNumber: string,
    withdrawDto: WithdrawEditDto,
    userId: string,
    userRole?: string,
  ) {
    try {
      const { amount, pin, notes, transactionDate: dtoDate } = withdrawDto;

      let transactionDate: Date;

      if (dtoDate) {
        transactionDate = new Date(dtoDate);
        if (isNaN(transactionDate.getTime())) {
          throw new BadRequestException('Invalid transaction date format');
        }
      } else {
        transactionDate = new Date();
      }

      const now = new Date();

      if (transactionDate > now) {
        const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
        if (!isAdmin) {
          throw new BadRequestException(
            'Transaction date cannot be in the future',
          );
        }
        const maxFutureDate = new Date(now);
        maxFutureDate.setDate(maxFutureDate.getDate() + 7);
        if (transactionDate > maxFutureDate) {
          throw new BadRequestException(
            'Future transaction date cannot be more than 7 days ahead',
          );
        }
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          transactionPin: true,
          username: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.transactionPin) {
        throw new BadRequestException(
          'Transaction PIN not set. Please set your PIN first.',
        );
      }

      const isPinValid = await bcrypt.compare(pin, user.transactionPin);
      const isDefaultPin = await bcrypt.compare('0000', user.transactionPin);

      if (isDefaultPin) {
        throw new BadRequestException(
          'Please change your default transaction PIN before making withdrawals',
        );
      }

      if (!isPinValid) {
        throw new UnauthorizedException('Invalid transaction PIN');
      }

      const account = await this.prisma.account.findUnique({
        where: { accountNumber },
        select: {
          id: true,
          userId: true,
          accountNumber: true,
          balance: true,
          status: true,
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      });

      if (!account) {
        throw new NotFoundException(
          `Account with number ${accountNumber} not found`,
        );
      }

      if (account.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Cannot withdraw from ${account.status.toLowerCase()} account`,
        );
      }

      const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
      if (!isAdmin && account.userId !== userId) {
        throw new ForbiddenException(
          'You can only withdraw from your own accounts',
        );
      }

      if (account.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₱${account.balance.toFixed(2)}`,
        );
      }

      const MIN_WITHDRAWAL = 100;
      if (amount < MIN_WITHDRAWAL) {
        throw new BadRequestException(
          `Minimum withdrawal amount is ₱${MIN_WITHDRAWAL}`,
        );
      }

      const fiveMinutesAgo = new Date(transactionDate);
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const recentDuplicate = await this.prisma.transaction.findFirst({
        where: {
          accountId: account.id,
          type: 'WITHDRAW',
          amount: amount,
          createdAt: {
            gte: fiveMinutesAgo,
            lte: transactionDate,
          },
        },
      });

      if (recentDuplicate) {
        throw new BadRequestException(
          'Similar withdrawal was recently processed. Please wait a few minutes before trying again.',
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedAccount = await tx.account.update({
          where: { accountNumber },
          data: {
            balance: { decrement: amount },
            updatedAt: transactionDate,
          },
        });

        const transaction = await tx.transaction.create({
          data: {
            type: 'WITHDRAW',
            amount,
            accountId: account.id,
            notes: notes || `Withdrawal from account ${accountNumber}`,
            createdAt: transactionDate,
            updatedAt: transactionDate,
          },
        });

        return { updatedAccount, transaction };
      });

      await this.mailService.withdrawTransactionEmail(
        account.user.email,
        account.user.username,
        amount,
        result.updatedAccount.balance,
        accountNumber,
      );

      console.log(`Withdrawal completed:`, {
        accountNumber,
        amount,
        userId,
        userRole,
        transactionDate: transactionDate.toISOString(),
        transactionId: result.transaction.id,
        isCustomDate: !!dtoDate,
      });

      return {
        success: true,
        message: 'Withdrawal successful',
        data: {
          accountNumber,
          reference: `WD-${result.transaction.id.toString().padStart(8, '0')}`,
          previousBalance: account.balance,
          newBalance: result.updatedAccount.balance,
          amountWithdrawn: amount,
          transactionId: result.transaction.id,
          timestamp: transactionDate,
        },
      };
    } catch (error) {
      console.error('Withdrawal error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Fix: Use type guard to safely check Prisma error
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('Account not found');
      }

      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new BadRequestException(
          'Transaction conflict. Please try again.',
        );
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred during withdrawal. Please try again later.',
      );
    }
  }
}
