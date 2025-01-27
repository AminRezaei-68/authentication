import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersServive: UsersService) {}

    // @Get('find_by_email')
    // findByEmail(@Query('email') email: string) {
    //     console.log('in user controller email is:', email);
    //     return this.usersServive.findByEmail(email);
    // }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<UserReponse> {
        const nummericalId = parseInt(id);
        return this.usersServive.findOne(nummericalId);
    }

    @Get()
    findAll(): Promise<UserReponse[]> {
        return this.usersServive.findAll();
    }

    // @Patch(':id')
    // update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    //     return this.usersServive.update(id, updateUserDto);
    // }
}
