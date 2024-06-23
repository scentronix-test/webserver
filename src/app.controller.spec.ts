import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';
import { ListOfServers } from '../utils/constants';
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';

describe('AppController', () => {
  let appController: AppController;
  let httpService: HttpService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        Logger,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(() =>
              of({
                // your response body goes here
              }),
            ),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    httpService = app.get<HttpService>(HttpService);
  });

  describe('/healthcheck', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('/find-server', () => {
    it('should return a server URL', async () => {
      jest
        .spyOn(appController, 'findServer')
        .mockResolvedValue(ListOfServers[0]);
      const result = await appController.findServer();
      expect(result).toBe(ListOfServers[0]);
    });

    it('should reject due to no online server', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        // all servers are offline (status code is not in 200-299 range)
        of({
          data: {},
          headers: {},
          config: {
            headers: undefined,
          },
          status: 400,
          statusText: 'OK',
        }),
      );
      expect(
        async () => await appController.findServer(ListOfServers),
      ).rejects.toThrow('No servers available');
    });

    it('should return online server', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(
          // first server in the list to be online
          of({
            data: {},
            headers: {},
            config: {
              headers: undefined,
            },
            status: 200,
            statusText: 'OK',
          }),
        )
        .mockReturnValue(
          // the rest of the servers to be offline
          of({
            data: {},
            headers: {},
            config: {
              headers: undefined,
            },
            status: 400,
            statusText: 'OK',
          }),
        );
      const result = await appController.findServer(ListOfServers);
      expect(result.url).toBe(ListOfServers[0].url);
    });

    it('should return online server with lowest priority', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        // all servers are online
        of({
          data: {},
          headers: {},
          config: {
            headers: undefined,
          },
          status: 200,
          statusText: 'OK',
        }),
      );
      const result = await appController.findServer(ListOfServers);
      // the server with the lowest priority is the first one
      expect(result.url).toBe(ListOfServers[0].url);
    });
  });
});
