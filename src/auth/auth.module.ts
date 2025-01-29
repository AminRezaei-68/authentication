import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtUtil } from './common/utilities/jwt.util';

@Module({
    imports: [
        UsersModule,
        PrismaModule,
        ClientsModule.register([
            {
                name: 'LOGGER_SERVICE',
                transport: Transport.TCP,
                options: {
                    host: 'localhost',
                    port: 3001,
                },
            },
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '15m' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, ConfigService, PrismaService, JwtUtil],
    exports: [JwtModule, AuthService, JwtUtil],
})
export class AuthModule {}
