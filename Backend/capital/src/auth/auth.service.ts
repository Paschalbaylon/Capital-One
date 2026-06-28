import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/sigIn.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/enum/Roles.enum';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { hashPin } from 'src/utils/pin.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailService: MailService,
  ) {}

  async create(signUpDto: SignUpDto) {
    const { username, email, password, role } = signUpDto;

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (foundUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        hashedPassword,
        role: role || Role.USER,
      },
    });

    // SEND EMAIL WITH PROPER ERROR HANDLING
    try {
      await this.mailService.sendWelcomeEmail(user.email, user.username);
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      // Type guard to safely access error properties
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send welcome email to ${user.email}: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Failed to send welcome email to ${user.email}: Unknown error`,
        );
      }
      // Don't fail the registration if email fails
    }

    return { message: 'User created successfully' };
  }

  async login(signinDto: SignInDto) {
    const { email, password } = signinDto;

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!foundUser) {
      throw new ConflictException('Invalid credentials');
    }

    if (foundUser.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    const passwordValid = await this.comparePasswords({
      plainPassword: password,
      hashed: foundUser.hashedPassword,
    });

    if (!passwordValid) {
      throw new ConflictException('Invalid credentials');
    }

    const token = await this.generateToken({
      sub: foundUser.id,
      email: foundUser.email,
      role: foundUser.role as Role,
      status: foundUser.status,
    });

    // LOGIN ALERT WITH PROPER ERROR HANDLING
    try {
      await this.mailService.sendLoginAlert(foundUser.email);
      this.logger.log(`Login alert sent to ${foundUser.email}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send login alert to ${foundUser.email}: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Failed to send login alert to ${foundUser.email}: Unknown error`,
        );
      }
      // Don't fail the login if email fails
    }

    return {
      message: 'Login successful',
      token,
      role: foundUser.role,
      status: foundUser.status,
    };
  }

  async setWithdrawalPin(userId: string, pin: string) {
    const hashedPin = await hashPin(pin);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { transactionPin: hashedPin },
    });

    try {
      await this.mailService.sendPinSetEmail(user.email, user.username);
      this.logger.log(`PIN set email sent to ${user.email}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send PIN set email to ${user.email}: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Failed to send PIN set email to ${user.email}: Unknown error`,
        );
      }
    }

    return { message: 'PIN set successfully' };
  }

  async remove(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });
    return { message: 'User deleted successfully' };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(args: {
    plainPassword: string;
    hashed: string;
  }): Promise<boolean> {
    return await bcrypt.compare(args.plainPassword, args.hashed);
  }

  async generateToken(payload: {
    sub: string;
    email: string;
    role: Role;
    status: string;
  }): Promise<string> {
    return this.jwt.signAsync(payload);
  }
}
