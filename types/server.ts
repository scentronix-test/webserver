export enum ServerStatus {
  UP = 'up',
  DOWN = 'down',
}

export interface ServerType {
  url: string;
  priority: number;
  status?: ServerStatus;
}
