import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtGuard } from './auth/common/guards/jwt.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [AuthModule, UsersModule, PrismaModule, ConfigModule],

    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
