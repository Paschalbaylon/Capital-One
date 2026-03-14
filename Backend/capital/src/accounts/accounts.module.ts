import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { MailModule } from 'src/mail/mail.module';
import { PrismaModule } from 'prisma/PrismaModule';

@Module({
  imports: [MailModule, PrismaModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
