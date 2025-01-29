import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokensRepository } from '../../../prisma/repositories/tokens.repository';

@Injectable()
export class JwtUtil {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly tokensRepository: TokensRepository,
    ) {}

    async createTokens(payload: CreateToken): Promise<TokenResponse> {
        // const { id, email } = data;
        // const payload = { sub: id, email: email };

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: '3m',
            secret: this.configService.get('JWT_SECRET_ACCESS_TOKEN'),
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
            secret: this.configService.get('JWT_SECRET_REFRESH_TOKEN'),
        });

        const saveData = { id: payload.id, token: refreshToken };
        console.log('Data before save at token repository:', saveData);
        await this.tokensRepository.saveToken(saveData);

        return { accessToken: accessToken, refreshToken: refreshToken };
    }
}
