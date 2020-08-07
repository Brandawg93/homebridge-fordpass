import axios from 'axios';
import { AxiosRequestConfig, Method } from 'axios';
import { PlatformConfig, Logging } from 'homebridge';
import { VehicleInfo, Command } from './models/vehicle-info';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'fordpass-na/353 CFNetwork/1121.2.2 Darwin/19.3.0',
};

const fordAPIUrl = 'https://usapi.cv.ford.com/';

const handleError = function (name: string, status: number, log: Logging): void {
  log.error(`${name} failed with status: ${status}`);
};

export class Vehicle {
  private config: PlatformConfig;
  private readonly log: Logging;
  public name: string;
  public vin: string;
  public info: VehicleInfo | undefined;

  constructor(name: string, vin: string, config: PlatformConfig, log: Logging) {
    this.config = config;
    this.log = log;
    this.name = name;
    this.vin = vin;
  }

  async status(): Promise<VehicleInfo | undefined> {
    const url = fordAPIUrl + `/api/vehicles/v4/${this.vin}/status`;
    const options: AxiosRequestConfig = {
      url: url,
      headers: defaultHeaders,
      params: {
        lrdt: '01-01-1970 00:00:00',
      },
    };

    options.headers['Application-Id'] = '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592';
    options.headers['auth-token'] = this.config.access_token;
    const result = await axios(options);
    if (result.status === 200 && result.data.status === 200) {
      return result.data.vehiclestatus as VehicleInfo;
    } else if (result.data.status === 401) {
      this.log.error(`You do not have authorization to access ${this.name}.`);
    } else {
      handleError('Status', result.data.status, this.log);
    }
  }

  async issueCommand(command: Command): Promise<void> {
    let method: Method = 'GET';
    let endpoint = '';
    switch (command) {
      case Command.START: {
        method = 'PUT';
        endpoint = `api/vehicles/v2/${this.vin}/engine/start`;
        break;
      }
      case Command.STOP: {
        method = 'DELETE';
        endpoint = `api/vehicles/v2/${this.vin}/engine/start`;
        break;
      }
      case Command.LOCK: {
        method = 'PUT';
        endpoint = `api/vehicles/v2/${this.vin}/doors/lock`;
        break;
      }
      case Command.UNLOCK: {
        method = 'DELETE';
        endpoint = `api/vehicles/v2/${this.vin}/doors/lock`;
        break;
      }
      default: {
        this.log.error('invalid command');
        break;
      }
    }

    if (endpoint) {
      const url = fordAPIUrl + endpoint;
      const options: AxiosRequestConfig = {
        method: method,
        url: url,
        headers: defaultHeaders,
      };

      options.headers['Application-Id'] = '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592';
      options.headers['auth-token'] = this.config.access_token;
      const result = await axios(options);
      if (result.status !== 200) {
        handleError('IssueCommand', result.status, this.log);
      }
    }
  }

  async commandStatus(command: string, commandId: string): Promise<string> {
    let endpoint = '';
    if (command == 'start' || command == 'stop') {
      endpoint = `api/vehicles/v2/${this.vin}/engine/start/${commandId}`;
    } else if (command == 'lock' || command == 'unlock') {
      endpoint = `api/vehicles/v2/${this.vin}/doors/lock/${commandId}`;
    } else {
      this.log.error('invalid command');
    }
    const url = fordAPIUrl + endpoint;
    const options: AxiosRequestConfig = {
      baseURL: fordAPIUrl,
      url: url,
      headers: defaultHeaders,
    };

    options.headers['Application-Id'] = '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592';
    options.headers['auth-token'] = this.config.access_token;
    const result = await axios(options);
    if (result.status == 200) {
      return result.data.status;
    } else {
      handleError('CommandStatus', result.status, this.log);
    }
    return '';
  }
}
