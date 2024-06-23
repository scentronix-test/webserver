import { Body, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ServerType } from 'types/server';
import { ListOfServers } from '../utils/constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('find-server')
  findServer(@Body('servers') servers?: ServerType[]): Promise<ServerType> {
    return this.appService.findServer(
      servers?.length > 0 ? servers : ListOfServers,
    );
  }
}
