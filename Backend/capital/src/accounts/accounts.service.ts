import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';
import { WithdrawDto } from './dtos/withdraw.dto';
import { generateNumericCode } from 'src/utils/accountNumber.util';
import { Role } from 'src/enum/Roles.enum';
import { TransferDto } from './dtos/transfer.dto';
import { WithdrawEditDto } from './dtos/withdrawEdit.dto';

@Injectable()
export class AccountsService {
  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  // async createAccount(userId: number) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { id: userId },
  //       select: { email: true, username: true },
  //     });

  //     if (!user) {
  //       throw new NotFoundException(`User with ID ${userId} not found`);
  //     }

  //     // 🔐 Generate unique 10-digit account number (retry-safe)
  //     let accountNumber = generateNumericCode(10);
  //     let attempts = 0;

  //     while (
  //       await this.prisma.account.findUnique({
  //         where: { accountNumber },
  //       })
  //     ) {
  //       if (attempts++ > 5) {
  //         throw new InternalServerErrorException(
  //           'Failed to generate unique account number',
  //         );
  //       }
  //       accountNumber = generateNumericCode(10);
  //     }

  //     const account = await this.prisma.account.create({
  //       data: {
  //         userId,
  //         accountNumber,
  //       },
  //       select: {
  //         id: true,
  //         accountNumber: true,
  //         createdAt: true,
  //         user: {
  //           select: {
  //             email: true,
  //             username: true,
  //           },
  //         },
  //       },
  //     });

  //     await this.mailService.createdAccountEmail(
  //       account.user.email,
  //       account.user.username,
  //     );

  //     return {
  //       success: true,
  //       message: 'Account created successfully',
  //       data: account,
  //     };
  //   } catch (error) {
  //     console.error('Create account error:', error);

  //     // ✅ Prisma unique constraint
  //     if (error?.code === 'P2002') {
  //       throw new InternalServerErrorException(
  //         'Account number conflict. Please try again.',
  //       );
  //     }

  //     // ✅ Known NestJS errors
  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof BadRequestException
  //     ) {
  //       throw error;
  //     }

  //     throw new InternalServerErrorException(
  //       'An unexpected error occurred while creating the account',
  //     );
  //   }
  // }

  async createAccountForPendingUser(adminId: number, targetUserId: number) {
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
            none: {}, // user has no account yet
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
        // Now this will work because Account has status field
        const createdAccount = await tx.account.create({
          data: {
            userId: pendingUser.id,
            accountNumber,
            status: 'ACTIVE', // ✅ This is now valid!
            createdBy: admin.id,
          },
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            status: true, // ✅ Include status in select
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

        // Update user status from PENDING to ACTIVE
        await tx.user.update({
          where: { id: pendingUser.id },
          data: { status: 'ACTIVE' },
        });

        // Update the returned user status
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

      // 6. Response
      return {
        success: true,
        message: `Account created and user activated successfully`,
        data: {
          account: {
            id: result.id,
            accountNumber: result.accountNumber,
            balance: result.balance,
            status: result.status, // ✅ Account status included
            createdAt: result.createdAt,
          },
          user: {
            id: pendingUser.id,
            username: pendingUser.username,
            status: 'ACTIVE', // User status is now ACTIVE
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

      if (error?.code === 'P2002') {
        throw new InternalServerErrorException(
          'Account number conflict. Please try again.',
        );
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while creating account for pending user',
      );
    }
  }

  // /**
  //  * Admin-only: Create multiple accounts at once
  //  */
  // async createBulkAccounts(adminId: number, userIds: number[]) {
  //   const admin = await this.prisma.user.findUnique({
  //     where: { id: adminId, role: Role.ADMIN },
  //   });

  //   if (!admin) {
  //     throw new ForbiddenException('Only administrators can bulk create accounts');
  //   }

  //   const results = [];
  //   const errors = [];

  //   for (const userId of userIds) {
  //     try {
  //       const result = await this.createAccount(adminId, userId);
  //       results.push({ userId, success: true, data: result });
  //     } catch (error) {
  //       errors.push({ userId, error: error.message });
  //     }
  //   }

  //   return {
  //     success: true,
  //     message: `Bulk account creation completed`,
  //     summary: {
  //       total: userIds.length,
  //       successful: results.length,
  //       failed: errors.length,
  //     },
  //     results,
  //     errors: errors.length > 0 ? errors : undefined,
  //   };
  // }

  // async deposit(id: number, amount: number) {
  //   // Validate amount
  //   if (amount <= 0) {
  //     throw new BadRequestException(
  //       'Deposit amount will not be less than or equal to zero',
  //     );
  //   }

  //   try {
  //     const account = await this.prisma.account.update({
  //       where: { id },
  //       data: {
  //         balance: { increment: amount },
  //         transactions: {
  //           create: {
  //             amount,
  //             type: 'DEPOSIT',
  //           },
  //         },
  //       },
  //       include: {
  //         user: {
  //           select: {
  //             email: true,
  //             username: true,
  //           },
  //         },
  //         transactions: {
  //           orderBy: {
  //             createdAt: 'desc',
  //           },
  //           take: 1, // Return only the latest transaction
  //         },
  //       },
  //     });

  //     if (!account) {
  //       throw new NotFoundException(`Account with ID ${id} not found`);
  //     }

  //     await this.mailService.sendTransactionEmail(
  //       account.user.email,
  //       account.user.username,
  //       amount,
  //       account.balance,
  //     );

  //     return {
  //       message: 'Deposit successful',
  //       accountId: account.id,
  //       newBalance: account.balance,
  //       transaction: account.transactions[0], // The created transaction
  //     };
  //   } catch (error) {
  //     if (error.code === 'P2025') {
  //       throw new NotFoundException(`Account with ID ${id} not found`);
  //     }
  //     throw error;
  //   }
  // }

  // For admin to get ALL accounts
  async getAllAccountsForAdmin(adminUserId: number, userRole?: string) {
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
    userId?: number,
    userRole?: string,
  ) {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    try {
      // First, find the account by accountNumber
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

      // Check permissions if userId is provided
      if (userId) {
        // If user is not admin and trying to deposit to someone else's account
        const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
        if (!isAdmin && account.userId !== userId) {
          throw new ForbiddenException(
            'You can only deposit to your own accounts',
          );
        }
      }

      // Perform the deposit transaction
      const updatedAccount = await this.prisma.$transaction(async (tx) => {
        // Update account balance
        const updated = await tx.account.update({
          where: { accountNumber },
          data: { balance: { increment: amount } },
        });

        // Create transaction record
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

      // Get the latest transaction for response
      const latestTransaction = await this.prisma.transaction.findFirst({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
      });

      // Send email notification
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

      if (error?.code === 'P2025') {
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
    userId: number,
    userRole?: string,
  ) {
    try {
      const { amount, pin, notes } = withdrawDto;

      // 1. Verify user exists
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

      // Check if user has transaction PIN set
      if (!user.transactionPin) {
        throw new BadRequestException(
          'Transaction PIN not set. Please set your PIN first.',
        );
      }

      // 2. Verify PIN
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

      // 3. Find account by accountNumber
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

      // 4. Check permissions
      const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
      if (!isAdmin && account.userId !== userId) {
        throw new ForbiddenException(
          'You can only withdraw from your own accounts',
        );
      }

      // 5. Balance check
      if (account.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₱${account.balance.toFixed(2)}`,
        );
      }

      // 6. Minimum withdrawal amount
      const MIN_WITHDRAWAL = 100;
      if (amount < MIN_WITHDRAWAL) {
        throw new BadRequestException(
          `Minimum withdrawal amount is ₱${MIN_WITHDRAWAL}`,
        );
      }

      // 7. Daily withdrawal limit check
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayWithdrawals = await this.prisma.transaction.aggregate({
        where: {
          accountId: account.id,
          type: 'WITHDRAW',
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { amount: true },
      });

      // const DAILY_LIMIT = 200000;
      // const withdrawnToday = todayWithdrawals._sum.amount || 0;

      // if (withdrawnToday + amount > DAILY_LIMIT) {
      //   const remaining = DAILY_LIMIT - withdrawnToday;
      //   throw new BadRequestException(
      //     `Daily withdrawal limit exceeded. Remaining today: ₱${remaining.toFixed(2)}`,
      //   );
      // }

      // 8. Perform withdrawal transaction
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

      // 9. Send email notification
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
          // dailyLimitRemaining: Math.max(
          //   0,
          //   DAILY_LIMIT - (withdrawnToday + amount),
          // ),
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

      if (error?.code === 'P2025') {
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
    userId: number,
    userRole?: string,
  ) {
    try {
      const { toAccountNumber, amount, pin, notes } = transferDto;

      // 1. Validate inputs
      if (amount <= 0) {
        throw new BadRequestException('Amount must be greater than zero');
      }

      // Check if transferring to same account
      if (fromAccountNumber === toAccountNumber) {
        throw new BadRequestException('Cannot transfer to the same account');
      }

      // 2. Verify user exists and get PIN
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

      // Check if PIN is set
      if (!user.transactionPin) {
        throw new BadRequestException('Please set your transaction PIN first');
      }

      // 3. Verify PIN
      const isPinValid = await bcrypt.compare(pin, user.transactionPin);
      if (!isPinValid) {
        throw new UnauthorizedException('Invalid transaction PIN');
      }

      // Check if PIN is default '0000'
      const isDefaultPin = await bcrypt.compare('0000', user.transactionPin);
      if (isDefaultPin) {
        throw new BadRequestException(
          'Please change your default transaction PIN before making transfers',
        );
      }

      // 4. Find sender's account by accountNumber
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

      // 5. Check permissions (user must own the fromAccount or be admin)
      const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
      if (!isAdmin && fromAccount.userId !== userId) {
        throw new ForbiddenException(
          'You can only transfer from your own accounts',
        );
      }

      // 6. Check if source account has sufficient balance
      if (fromAccount.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₱${fromAccount.balance.toFixed(2)}`,
        );
      }

      // 7. Find recipient's account by accountNumber
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

      // 8. Check if transferring to own account (different account but same user)
      if (toAccount.userId === fromAccount.userId) {
        throw new BadRequestException(
          'Cannot transfer between your own accounts. Use internal transfer instead.',
        );
      }

      // 9. Daily transfer limit check (optional)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTransfers = await this.prisma.transaction.aggregate({
        where: {
          accountId: fromAccount.id,
          type: 'TRANSFER_OUT',
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { amount: true },
      });

      const DAILY_LIMIT = 50000000; // ₱50,000 daily transfer limit
      const transferredToday = todayTransfers._sum.amount || 0;

      if (transferredToday + amount > DAILY_LIMIT) {
        const remaining = DAILY_LIMIT - transferredToday;
        throw new BadRequestException(
          `Daily transfer limit exceeded. Remaining today: ₱${remaining.toFixed(2)}`,
        );
      }

      // 10. Perform the transfer transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update sender's account (debit)
        const updatedFromAccount = await tx.account.update({
          where: { accountNumber: fromAccountNumber },
          data: { balance: { decrement: amount } },
        });

        // Update recipient's account (credit)
        const updatedToAccount = await tx.account.update({
          where: { accountNumber: toAccountNumber },
          data: { balance: { increment: amount } },
        });

        // Create transaction records
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

      // 11. Send email notifications
      try {
        // Send to sender
        await this.mailService.fromAccountEmail(
          result.fromAccountUser.email,
          result.fromAccountUser.username,
          result.toAccountUser.username,
          amount,
          result.updatedFromAccount.balance,
          fromAccountNumber,
          toAccountNumber,
        );

        // Send to receiver
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
        // Don't throw - email failure shouldn't fail the transaction
      }

      // 12. Return success response
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
          dailyLimitRemaining: Math.max(
            0,
            DAILY_LIMIT - (transferredToday + amount),
          ),
        },
      };
    } catch (error) {
      console.error('Transfer error:', error);

      // Handle known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Handle Prisma errors
      if (error?.code === 'P2025') {
        throw new NotFoundException('Account not found');
      }

      if (error?.code === 'P2002') {
        throw new BadRequestException('Transaction conflict occurred');
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred during transfer. Please try again.',
      );
    }
  }
  // ==================== PIN MANAGEMENT METHODS ====================

  // async changeTransactionPin(userId: number, oldPin: string, newPin: string) {
  //   // 1. Find user
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //     select: { id: true, transactionPin: true, email: true },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // 2. Verify old PIN
  //   const isOldPinValid = await bcrypt.compare(oldPin, user.transactionPin);
  //   if (!isOldPinValid) {
  //     throw new UnauthorizedException('Invalid current PIN');
  //   }

  //   // 3. Check if new PIN is different
  //   const isSamePin = await bcrypt.compare(newPin, user.transactionPin);
  //   if (isSamePin) {
  //     throw new BadRequestException(
  //       'New PIN must be different from current PIN',
  //     );
  //   }

  //   // 4. Validate new PIN format
  //   if (!/^\d{4,6}$/.test(newPin)) {
  //     throw new BadRequestException('PIN must be 4-6 digits');
  //   }

  //   // 5. Hash and update new PIN
  //   const hashedNewPin = await bcrypt.hash(newPin, 10);

  //   await this.prisma.user.update({
  //     where: { id: userId },
  //     data: { transactionPin: hashedNewPin },
  //   });

  //   // // Send notification email
  //   // await this.mailService.sendPinChangeEmail(
  //   //   user.email,
  //   //   'Your transaction PIN has been changed successfully'
  //   // );

  //   return {
  //     success: true,
  //     message: 'Transaction PIN changed successfully',
  //     timestamp: new Date(),
  //   };
  // }

  // async resetTransactionPin(userId: number, email: string) {
  //   // 1. Verify user email matches
  //   const user = await this.prisma.user.findFirst({
  //     where: {
  //       id: userId,
  //       email: email,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found or email does not match');
  //   }

  //   // 2. Reset to default PIN (hashed)
  //   const defaultPin = '0000';
  //   const hashedDefaultPin = await bcrypt.hash(defaultPin, 10);

  //   await this.prisma.user.update({
  //     where: { id: userId },
  //     data: { transactionPin: hashedDefaultPin },
  //   });

  //   // // Send notification email
  //   // await this.mailService.sendPinResetEmail(
  //   //   user.email,
  //   //   'Your transaction PIN has been reset to default (0000). Please change it immediately.'
  //   // );

  //   return {
  //     success: true,
  //     message: 'Transaction PIN reset to default (0000)',
  //     warning: 'Default PIN is not secure. Please change it immediately.',
  //     timestamp: new Date(),
  //   };
  // }

  // async verifyPin(userId: number, pin: string) {
  //   // 1. Find user
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //     select: { transactionPin: true, email: true },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // 2. Verify PIN
  //   const isValid = await bcrypt.compare(pin, user.transactionPin);
  //   const isDefault = await bcrypt.compare('0000', user.transactionPin);

  //   return {
  //     success: true,
  //     isValid,
  //     isDefaultPin: isDefault,
  //     message: isValid
  //       ? isDefault
  //         ? 'PIN is valid (but is default PIN)'
  //         : 'PIN is valid'
  //       : 'Invalid PIN',
  //     timestamp: new Date(),
  //   };
  // }

  // ==================== ACCOUNT INFO METHODS ====================

  async getAccountInfo(accountId: number, userId: number) {
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

  async getBalance(accountId: number, userId: number) {
    // First get user details for email
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

    // Send balance inquiry email notification
    try {
      await this.mailService.sendBalanceInquiryEmail(
        user.email,
        user.username,
        account.balance,
        account.id,
      );
    } catch (emailError) {
      console.error('Failed to send balance inquiry email:', emailError);
      // Don't throw error - email failure shouldn't fail the balance check
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

  async getUserAccounts(userId: number) {
    const accounts = await this.prisma.account.findMany({
      where: {
        userId: userId,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 3, // Last 3 transactions per account
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

    // Format the response
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
    accountId: number,
    userId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    // Verify account belongs to user
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

  // async getDailyWithdrawalLimit(accountId: number, userId: number) {
  //   // Verify account belongs to user
  //   const account = await this.prisma.account.findFirst({
  //     where: {
  //       id: accountId,
  //       userId: userId,
  //     },
  //   });

  //   if (!account) {
  //     throw new NotFoundException('Account not found');
  //   }

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const tomorrow = new Date(today);
  //   tomorrow.setDate(tomorrow.getDate() + 1);

  //   const todayWithdrawals = await this.prisma.transaction.aggregate({
  //     where: {
  //       accountId: accountId,
  //       type: 'WITHDRAW',
  //       createdAt: {
  //         gte: today,
  //         lt: tomorrow,
  //       },
  //     },
  //     _sum: {
  //       amount: true,
  //     },
  //   });

  //   const dailyLimit = 50000;
  //   const usedToday = todayWithdrawals._sum.amount || 0;
  //   const remaining = dailyLimit - usedToday;

  //   // Calculate when limit resets (next day at midnight)
  //   const resetsAt = new Date(tomorrow);

  //   return {
  //     success: true,
  //     data: {
  //       accountId,
  //       dailyLimit,
  //       usedToday,
  //       remaining,
  //       resetsAt,
  //       currency: 'PHP',
  //     },
  //   };
  // }

  async closeAccount(accountId: number, userId: number, pin: string) {
    // Verify PIN first
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

    // Verify account exists and belongs to user
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

    // Check if account has zero balance
    if (account.balance > 0) {
      throw new BadRequestException(
        'Cannot close account with remaining balance',
      );
    }

    // Delete account (cascade will delete transactions)
    await this.prisma.account.delete({
      where: { id: accountId },
    });

    // Send notification email
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
    customDate?: Date, // Add custom date parameter
    userId?: number,
    userRole?: string,
  ) {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    // Validate custom date if provided
    if (customDate && isNaN(new Date(customDate).getTime())) {
      throw new BadRequestException('Invalid custom date provided');
    }

    try {
      // First, find the account by accountNumber
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

      // Check permissions if userId is provided
      if (userId) {
        const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
        if (!isAdmin && account.userId !== userId) {
          throw new ForbiddenException(
            'You can only deposit to your own accounts',
          );
        }
      }

      // Use custom date or current date
      const transactionDate = customDate ? new Date(customDate) : new Date();

      // Validate transaction date is not in the future (unless admin override)
      const now = new Date();
      if (transactionDate > now && !(userRole === Role.ADMIN)) {
        throw new BadRequestException(
          'Transaction date cannot be in the future',
        );
      }

      // Perform the deposit transaction
      const updatedAccount = await this.prisma.$transaction(async (tx) => {
        // Update account balance
        const updated = await tx.account.update({
          where: { accountNumber },
          data: {
            balance: { increment: amount },
            updatedAt: transactionDate, // Update account timestamp
          },
        });

        // Create transaction record with custom date
        await tx.transaction.create({
          data: {
            amount,
            type: 'DEPOSIT',
            accountId: account.id,
            notes: `Deposit to account ${accountNumber}`,
            createdAt: transactionDate, // Custom date
            updatedAt: transactionDate,
          },
        });

        return updated;
      });

      // Get the latest transaction for response
      const latestTransaction = await this.prisma.transaction.findFirst({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
      });

      // Send email notification
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
      // ... error handling remains the same
    }
  }

  async withdrawAndEdit(
    accountNumber: string,
    withdrawDto: WithdrawEditDto, // Updated to use WithdrawEditDto
    userId: number,
    userRole?: string,
  ) {
    try {
      const { amount, pin, notes, transactionDate: dtoDate } = withdrawDto;

      // Determine transaction date
      let transactionDate: Date;

      // Use DTO date if provided, otherwise use current date
      if (dtoDate) {
        transactionDate = new Date(dtoDate);
        // Validate transaction date
        if (isNaN(transactionDate.getTime())) {
          throw new BadRequestException('Invalid transaction date format');
        }
      } else {
        transactionDate = new Date();
      }

      const now = new Date();

      // Validate future dates (only admins can set future dates)
      if (transactionDate > now) {
        const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
        if (!isAdmin) {
          throw new BadRequestException(
            'Transaction date cannot be in the future',
          );
        }
        // For admin, check if date is not too far in future (max 7 days for scheduling)
        const maxFutureDate = new Date(now);
        maxFutureDate.setDate(maxFutureDate.getDate() + 7);
        if (transactionDate > maxFutureDate) {
          throw new BadRequestException(
            'Future transaction date cannot be more than 7 days ahead',
          );
        }
      }

      // 1. Verify user exists
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

      // Check if user has transaction PIN set
      if (!user.transactionPin) {
        throw new BadRequestException(
          'Transaction PIN not set. Please set your PIN first.',
        );
      }

      // 2. Verify PIN
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

      // 3. Find account by accountNumber
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

      // Check if account is active
      if (account.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Cannot withdraw from ${account.status.toLowerCase()} account`,
        );
      }

      // 4. Check permissions
      const isAdmin = userRole === Role.ADMIN || userRole === 'ADMIN';
      if (!isAdmin && account.userId !== userId) {
        throw new ForbiddenException(
          'You can only withdraw from your own accounts',
        );
      }

      // 5. Balance check
      if (account.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₱${account.balance.toFixed(2)}`,
        );
      }

      // 6. Minimum withdrawal amount
      const MIN_WITHDRAWAL = 100;
      if (amount < MIN_WITHDRAWAL) {
        throw new BadRequestException(
          `Minimum withdrawal amount is ₱${MIN_WITHDRAWAL}`,
        );
      }

      // // 7. Maximum withdrawal amount per transaction
      // const MAX_PER_TRANSACTION = 50000;
      // if (amount > MAX_PER_TRANSACTION) {
      //   throw new BadRequestException(
      //     `Maximum withdrawal per transaction is ₱${MAX_PER_TRANSACTION.toLocaleString()}`,
      //   );
      // }

      // // 8. Daily withdrawal limit check (based on transaction date's day)
      // const transactionDay = new Date(transactionDate);
      // transactionDay.setHours(0, 0, 0, 0);
      // const nextDay = new Date(transactionDay);
      // nextDay.setDate(nextDay.getDate() + 1);

      // const dailyWithdrawals = await this.prisma.transaction.aggregate({
      //   where: {
      //     accountId: account.id,
      //     type: 'WITHDRAW',
      //     createdAt: { gte: transactionDay, lt: nextDay },
      //   },
      //   _sum: { amount: true },
      // });

      // const DAILY_LIMIT = 200000;
      // const withdrawnOnDay = dailyWithdrawals._sum.amount || 0;

      // if (withdrawnOnDay + amount > DAILY_LIMIT) {
      //   const remaining = DAILY_LIMIT - withdrawnOnDay;
      //   throw new BadRequestException(
      //     `Daily withdrawal limit exceeded for ${transactionDay.toLocaleDateString()}. ` +
      //       `Already withdrawn: ₱${withdrawnOnDay.toFixed(2)}, ` +
      //       `Remaining today: ₱${remaining.toFixed(2)}`,
      //   );
      // }

      // 9. Check for duplicate transaction (same amount, same day, within 5 minutes)
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

      // 10. Perform withdrawal transaction with custom date
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

      // 11. Send email notification with transaction date
      await this.mailService.withdrawTransactionEmail(
        account.user.email,
        account.user.username,
        amount,
        result.updatedAccount.balance,
        accountNumber,
        // transactionDate,
      );

      // 12. Log the transaction
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
          // dailyLimitRemaining: Math.max(
          //   0,
          //   DAILY_LIMIT - (withdrawnOnDay + amount),
          // ),
          // isCustomDate: !!dtoDate,
          // limits: {
          //   daily: DAILY_LIMIT,
          //   perTransaction: MAX_PER_TRANSACTION,
          //   minimum: MIN_WITHDRAWAL,
          // },
        },
      };
    } catch (error) {
      console.error('Withdrawal error:', error);

      // Handle specific errors
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Handle Prisma errors
      if (error?.code === 'P2025') {
        throw new NotFoundException('Account not found');
      }

      if (error?.code === 'P2002') {
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
