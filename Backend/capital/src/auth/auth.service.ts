import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/sigIn.dto';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/enum/Roles.enum';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { hashPin } from 'src/utils/pin.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailService: MailService,
  ) {}

  async create(signUpDto: SignUpDto) {
    const { username, email, password } = signUpDto;

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
        role: signUpDto.role || Role.USER,
      },
    });

    // SEND EMAIL
    await this.mailService.sendWelcomeEmail(user.email, user.username);

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

    // // ✅ Check if user is PENDING
    // if (foundUser.status === 'PENDING') {
    //   throw new ForbiddenException(
    //     'Your account is pending approval. Please contact support or wait for admin approval.',
    //   );
    // }

    // ✅ Check if user is SUSPENDED
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

    // LOGIN ALERT
    await this.mailService.sendLoginAlert(foundUser.email);

    return {
      message: 'Login successful',
      token,
      role: foundUser.role,
      status: foundUser.status,
    };
  }

  async setWithdrawalPin(userId: number, pin: string) {
    const hashedPin = await hashPin(pin);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { transactionPin: hashedPin },
    });

    await this.mailService.sendPinSetEmail(user.email, user.username);

    return { message: 'PIN set successfully' };
  }

  async remove(id: number) {
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
    sub: number;
    email: string;
    role: Role;
    status: string;
  }): Promise<string> {
    return this.jwt.signAsync(payload);
  }
}
