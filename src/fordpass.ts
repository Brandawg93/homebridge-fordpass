import axios from 'axios';
import { AxiosRequestConfig } from 'axios';
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
const fordAPIUrl = 'https://api.autonomic.ai/v1beta/telemetry/sources/fordpass/vehicles/';
const commandUrl = 'https://api.autonomic.ai/v1/command/vehicles/';

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
    if (!this.config.autonomic_token) {
      return;
    }

    const url = fordAPIUrl + this.vin;
    const options: AxiosRequestConfig = {
      url: url,
      headers: defaultHeaders,
    };

    if (options.headers) {
      options.headers['Application-Id'] = this.applicationId;
      options.headers.Authorization = `Bearer ${this.config.autonomic_token}`;
    }

    if (!this.updating) {
      this.updating = true;
      try {
        const result = await axios(options);
        if (result.status === 200) {
          this.info = result.data.metrics as VehicleInfo;
          return this.info;
        }
      } catch (error: any) {
        if (error.code !== 'ETIMEDOUT') {
          this.log.error(`Status failed with error: ${error.code || error.response.status}`);
        } else {
          handleError('Status', error.status, this.log);
        }
      } finally {
        this.updating = false;
        this.emit('updated');
      }
    } else {
      await once(this, 'updated');
      return this.info;
    }
  }

  async issueCommand(command: Command): Promise<string> {
    if (!this.config.autonomic_token) {
      return '';
    }
    let type = '';
    switch (command) {
      case Command.START: {
        type = 'remoteStart';
        break;
      }
      case Command.STOP: {
        type = 'cancelRemoteStart';
        break;
      }
      case Command.LOCK: {
        type = 'lock';
        break;
      }
      case Command.UNLOCK: {
        type = 'unlock';
        break;
      }
      case Command.REFRESH: {
        type = 'statusRefresh';
        break;
      }
      default: {
        this.log.error('invalid command');
        break;
      }
    }

    if (type) {
      const url = commandUrl + this.vin + '/commands';
      const options: AxiosRequestConfig = {
        method: 'POST',
        url: url,
        headers: defaultHeaders,
        data: {
          properties: {},
          tags: {},
          type: type,
          wakeUp: true,
        },
      };

      if (options.headers) {
        options.headers['Application-Id'] = this.applicationId;
        options.headers.Authorization = `Bearer ${this.config.autonomic_token}`;
      }
      try {
        const result = await axios(options);
        if (result.status < 200 && result.status > 299) {
          handleError('IssueCommand', result.status, this.log);
          return '';
        }
        return result.data.id;
      } catch (error: any) {
        this.log.error(`Command failed with error: ${error.code || error.response.status}`);
      }
    }
    return '';
  }

  async commandStatus(commandId: string): Promise<CommandStatus | undefined> {
    if (!this.config.autonomic_token) {
      return;
    }
    const url = commandUrl + this.vin + '/commands/' + commandId;
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: url,
      headers: defaultHeaders,
    };

    if (options.headers) {
      options.headers['Application-Id'] = this.applicationId;
      options.headers.Authorization = `Bearer ${this.config.autonomic_token}`;
    }
    try {
      const result = await axios(options);
      return result.data as CommandStatus;
    } catch (error: any) {
      this.log.error(`CommandStatus failed with error: ${error.code || error.response.status}`);
    }
    return;
  }
}
