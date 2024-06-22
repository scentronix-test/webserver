import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ServerStatus, ServerType } from 'types/server';
import { ListOfServers } from 'utils/constants';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async findServer(): Promise<string> {
    const healthChecks = await Promise.all(
      ListOfServers.map((server) => {
        return new Promise((resolve) => {
          this.httpService
            .get(server.url)
            .toPromise()
            .then((response) => {
              this.logger.log(
                response.status,
                `[HealthCheck] [${server.url} - ${server.priority}]`,
              );
              // If the status code is between 200 and 299, the server is UP
              if (response.status >= 200 && response.status <= 299) {
                resolve({
                  ...server,
                  status: ServerStatus.UP,
                });
              }
              resolve({
                ...server,
                status: ServerStatus.DOWN,
              });
            })
            .catch((error) => {
              this.logger.error(
                error.response?.status || error.message,
                `[HealthCheck] [${server.url} - ${server.priority}]`,
              );
              resolve({
                ...server,
                status: ServerStatus.DOWN,
              });
            });
        });
      }),
    );

    // Sort the servers by priority and return the first server that is UP
    const sortedHealthChecks = (healthChecks as ServerType[])
      .filter((server) => server.status === ServerStatus.UP)
      .sort((a, b) => a.priority - b.priority);

    if (healthChecks.length === 0) {
      throw new NotFoundException('No servers available');
    }

    return sortedHealthChecks[0].url;
  }
}
