import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'src/prisma/PrismaModule';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { AccountsModule } from './accounts/accounts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ← This makes ConfigService available everywhere
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465, // IMPORTANT
        secure: true, // IMPORTANT
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '"Capital Bank" <no-reply@myapp.com>',
      },
    }),
    AuthModule,
    PrismaModule,
    MailModule,
    AccountsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
