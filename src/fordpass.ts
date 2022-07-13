import axios from 'axios';
import { AxiosRequestConfig, Method } from 'axios';
import { Logging } from 'homebridge';
import { VehicleInfo, Command } from './types/vehicle';
import { CommandStatus } from './types/command';
import { FordpassConfig } from './types/config';
import { once, EventEmitter } from 'events';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'FordPass/5 CFNetwork/1333.0.4 Darwin/21.5.0',
};

const defaultAppId = '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592';
const fordAPIUrl = 'https://usapi.cv.ford.com/';

const handleError = function (name: string, status: number, log: Logging): void {
  log.error(`${name} failed with status: ${status}`);
};

export class Vehicle extends EventEmitter {
  private config: FordpassConfig;
  private readonly log: Logging;
  public info: VehicleInfo | undefined;
  private applicationId: string;
  private updating = false;
  name: string;
  vin: string;
  autoRefresh: boolean;
  refreshRate: number;

  constructor(name: string, vin: string, config: FordpassConfig, log: Logging) {
    super();
    this.config = config;
    this.log = log;
    this.name = name;
    this.vin = vin;
    this.autoRefresh = config.options?.autoRefresh || false;
    this.refreshRate = config.options?.refreshRate || 180;
    this.applicationId = config.options?.region || defaultAppId;
  }

  async status(): Promise<VehicleInfo | undefined> {
    if (!this.config.access_token) {
      return;
    }

    const url = fordAPIUrl + `/api/vehicles/v5/${this.vin}/status`;
    const options: AxiosRequestConfig = {
      url: url,
      headers: defaultHeaders,
      params: {
        lrdt: '01-01-1970 00:00:00',
      },
    };

    if (options.headers) {
      options.headers['Application-Id'] = this.applicationId;
      options.headers['auth-token'] = this.config.access_token;
    }

    if (!this.updating) {
      try {
        this.updating = true;
        const result = await axios(options);
        if (result.status === 200 && result.data.status === 200) {
          this.info = result.data.vehiclestatus as VehicleInfo;
          this.updating = false;
          this.emit('updated');
          return this.info;
        } else if (result.data.status === 401) {
          this.log.error(`You do not have authorization to access ${this.name}.`);
        } else {
          handleError('Status', result.data.status, this.log);
        }
        this.updating = false;
        this.emit('updated');
      } catch (error: any) {
        this.log.error(`Status failed with error: ${error.code || error.response.status}`);
      }
    } else {
      await once(this, 'updated');
      return this.info;
    }
  }

  async issueCommand(command: Command): Promise<string> {
    if (!this.config.access_token) {
      return '';
    }
    let method: Method = 'GET';
    let endpoint = '';
    switch (command) {
      case Command.START: {
        method = 'PUT';
        endpoint = `api/vehicles/v5/${this.vin}/engine/start`;
        break;
      }
      case Command.STOP: {
        method = 'DELETE';
        endpoint = `api/vehicles/v5/${this.vin}/engine/start`;
        break;
      }
      case Command.LOCK: {
        method = 'PUT';
        endpoint = `api/vehicles/v5/${this.vin}/doors/lock`;
        break;
      }
      case Command.UNLOCK: {
        method = 'DELETE';
        endpoint = `api/vehicles/v5/${this.vin}/doors/lock`;
        break;
      }
      case Command.REFRESH: {
        method = 'PUT';
        endpoint = `api/vehicles/v5/${this.vin}/status`;
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

      if (options.headers) {
        options.headers['Application-Id'] = this.applicationId;
        options.headers['auth-token'] = this.config.access_token;
      }
      try {
        const result = await axios(options);
        if (result.status !== 200) {
          handleError('IssueCommand', result.status, this.log);
          return '';
        }
        return result.data.commandId;
      } catch (error: any) {
        this.log.error(`Command failed with error: ${error.code || error.response.status}`);
      }
    }
    return '';
  }

  async commandStatus(command: Command, commandId: string): Promise<CommandStatus | undefined> {
    if (!this.config.access_token) {
      return;
    }
    let endpoint = '';
    if (command === Command.START || command === Command.STOP) {
      endpoint = `api/vehicles/v5/${this.vin}/engine/start/${commandId}`;
    } else if (command === Command.LOCK || command === Command.UNLOCK) {
      endpoint = `api/vehicles/v5/${this.vin}/doors/lock/${commandId}`;
    } else if (command === Command.REFRESH) {
      endpoint = `api/vehicles/v5/${this.vin}/status/${commandId}`;
    } else {
      this.log.error('invalid command');
    }
    const url = fordAPIUrl + endpoint;
    const options: AxiosRequestConfig = {
      baseURL: fordAPIUrl,
      url: url,
      headers: defaultHeaders,
    };

    if (options.headers) {
      options.headers['Application-Id'] = this.applicationId;
      options.headers['auth-token'] = this.config.access_token;
    }
    try {
      const result = await axios(options);
      if (result.status === 200) {
        return result.data as CommandStatus;
      } else {
        handleError('CommandStatus', result.status, this.log);
      }
    } catch (error: any) {
      this.log.error(`CommandStatus failed with error: ${error.code || error.response.status}`);
    }
    return;
  }
}
