import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from 'src/prisma/repositories/users.repository';
import { CreateUserDto } from './common/dtos/create.user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async create(createUserDto: CreateUserDto): Promise<UserReponse> {
        try {
            const { email, password } = createUserDto;

            const hashedPassword = await this.hashPassword(password);

            const createData = { email: email, password: hashedPassword };
            return await this.usersRepository.create(createData);
        } catch (error) {
            throw new Error('Something wrong. The user does not create.');
        }
    }

    // async findByEmail(email: string): Promise<UserReponse> {
    //     // const data = { id: null, email: email };
    //     // const user = await this.prisma.user.findUnique({ where: { email } });
    //     // const user = await this.usersRepository.findOne(data);
    //     // const user = await this.usersRepository.findByEmail(email);
    //     const user = await this.usersRepository.findOne({ email });

    //     return user;
    // }

    async findOne(id: number): Promise<UserReponse> {
        // const data = { id: id, email: null };
        // const user = await this.prisma.user.findUnique({ where: { id } });
        // const user = await this.usersRepository.findOne(data);
        const user = await this.usersRepository.findOne({ id });

        if (!user) {
            throw new NotFoundException('The user not Found.');
        }

        return user;
    }

    async findAll(): Promise<UserReponse[]> {
        return await this.usersRepository.findAll();
    }
}
