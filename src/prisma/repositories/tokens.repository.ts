import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TokensRepository {
    constructor(private readonly prismaService: PrismaService) {}

    async saveToken(data: SaveToken): Promise<RefreshToken> {
        const { id, token } = data;
        console.log('the id is:', id);
        console.log('the refresh token is:', token);

        return await this.prismaService.refreshToken.upsert({
            where: { userId: id },
            update: { token: token },
            create: { userId: id, token: token },
        });
    }

    async deleteToken(id: number): Promise<RefreshToken> {
        const deleteRefreshToken = await this.prismaService.refreshToken.delete({ where: { userId: id } });
        return deleteRefreshToken;
    }

    async findOne(id: number): Promise<RefreshToken> {
        return await this.prismaService.refreshToken.findUnique({ where: { userId: id } });
    }

    async findAll(): Promise<RefreshToken[]> {
        return await this.prismaService.refreshToken.findMany();
    }
}
