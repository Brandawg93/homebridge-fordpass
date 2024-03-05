import { Logging } from 'homebridge';
import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { FordpassConfig, VehicleConfig } from './types/config';
import { URLSearchParams } from 'url';
import FormData from 'form-data';
import { VehicleInfo } from './types/vehicle';

const authorizeUrl =
  'https://dah2vb2cprod.b2clogin.com/914d88b1-3523-4bf6-9be4-1b96b4f6f919/oauth2/v2.0/token?p=B2C_1A_signup_signin_common';
const baseApiUrl = 'https://api.mps.ford.com/api/fordconnect';
const vehiclesUrl = '/v2/vehicles';
const vehicleStatusUrl = '/v1/vehicles/{vehicleId}/status';
const vehicleSatusRefreshUrl = '/v1/vehicles/{vehicleId}/statusrefresh/{commandId}';
const vehicleUnlockUrl = '/v1/vehicles/{vehicleId}/unlock';
const vehicleUnlockRefreshUrl = '/v1/vehicles/{vehicleId}/unlock/{commandId}';
const vehicleLockUrl = '/v1/vehicles/{vehicleId}/lock';
const vehicleLockRefreshUrl = '/v1/vehicles/{vehicleId}/lock/{commandId}';
const vehicleStartUrl = '/v1/vehicles/{vehicleId}/startEngine';
const vehicleStartRefreshUrl = '/v1/vehicles/{vehicleId}/start/{commandId}';
const vehicleStopUrl = '/v1/vehicles/{vehicleId}/stop';
const vehicleStopRefreshUrl = '/v1/vehicles/{vehicleId}/stop/{commandId}';
const vehicleStartChargeUrl = '/v1/vehicles/{vehicleId}/startCharge';
const vehicleStartChargeRefreshUrl = '/v1/vehicles/{vehicleId}/startCharge/{commandId}';
const vehicleStopChargeUrl = '/v1/vehicles/{vehicleId}/stopCharge';
const vehicleStopChargeRefreshUrl = '/v1/vehicles/{vehicleId}/stopCharge/{commandId}';
const vehicleCapabilitiesUrl = '/v3/vehicles/{vehicleId}/capabilities';
const vehicleInformationUrl = '/v3/vehicles/{vehicleId}';

const headers = {
  'User-Agent': 'Mozilla/5.0',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
};

export class Connection {
  private config: FordpassConfig;
  private readonly log: Logging;

  constructor(config: FordpassConfig, log: Logging) {
    this.config = config;
    this.log = log;
  }

  async getVehicles(): Promise<Array<VehicleConfig>> {
    if (!this.config.access_token) {
      await this.auth();
    }

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: baseApiUrl + vehiclesUrl,
      headers: {
        'Content-Type': 'application/json',
        'Application-Id': this.config.application_id,
        Authorization: `Bearer ${this.config.access_token}`,
      },
    };

    try {
      this.log.debug('Requesting vehicles');
      const result = await axios(options);
      if (result.status < 300 && result.data) {
        const vehicles: Array<VehicleConfig> = [];
        for (const info of result.data.vehicles) {
          vehicles.push({ ...info, ...result.data.vehicles[0] });
        }

        this.log.debug(`Found vehicles : ${JSON.stringify(vehicles, null, 2)}`);
        return vehicles;
      } else {
        this.log.error(`Vehicles failed with status: ${result.status}`);
      }
      return [];
    } catch (error: any) {
      this.log.error(`Error occurred during request: ${error.message}`);
      if (error.response) {
        // Log detailed information about the response if available
        this.log.error(`Response status: ${error.response.status}`);
        this.log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        this.log.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        // Log information about the request
        this.log.error(`Request made but no response received: ${error.request}`);
      } else {
        // Log general error information
        this.log.error(`Error details: ${JSON.stringify(error)}`);
      }
      return [];
    }
  }

  async getVehicleInformation(vehicleId: string): Promise<VehicleInfo> {
    if (!this.config.access_token) {
      await this.auth();
    }

    const url = baseApiUrl + vehicleInformationUrl.replace('{vehicleId}', vehicleId);
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Application-Id': this.config.application_id,
        'Authorization': `Bearer ${this.config.access_token}`,
      },
    };

    try {
      this.log.debug(`getVehicleInformation: ${JSON.stringify(options)}`);
      const result = await axios.request(options);
      if (result.status < 300 && result.data) {
        this.log.debug(`Found vehicle info : ${JSON.stringify(result.data, null, 2)}`);
        if (result.data.status === 'SUCCESS') {
          return result.data.vehicle as VehicleInfo;
        }

        return {} as VehicleInfo;
      } else {
        this.log.error(`Vehicle info failed with status: ${result.status}`);
      }
      return {} as VehicleInfo;
    } catch (error: any) {
      this.log.error(`Vehicle info failed with error: ${error.code || error.response.status}`);
      return {} as VehicleInfo;
    }
  }

  async issueCommand(vehicleId: string, command: string): Promise<any> {
    if (!this.config.access_token) {
      await this.auth();
    }

    let url = '';
    switch (command) {
      case 'unlock':
        url = vehicleUnlockUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'lock':
        url = vehicleLockUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'start':
        url = vehicleStartUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'stop':
        url = vehicleStopUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'startCharge':
        url = vehicleStartChargeUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'stopCharge':
        url = vehicleStopChargeUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'status':
        url = vehicleStatusUrl.replace('{vehicleId}', vehicleId);
        break;
      default:
        break;
    }

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: baseApiUrl + url.replace('{vehicleId}', vehicleId),
      headers: {
        'Content-Type': 'application/json',
        'Application-Id': this.config.application_id,
        Authorization: `Bearer ${this.config.access_token}`,
      },
    };

    // this.log.debug(`issueCommand: ${JSON.stringify(options)}`);
    try {
      const result = await axios.request(options);
      if (result.status < 300 && result.data) {
        return result.data;
      } else {
        this.log.error(`Command failed with status: ${JSON.stringify(result)}`);
      }
      return {};
    } catch (error: any) {
      this.log.error(`Command failed with error: ${JSON.stringify(error)}`);
      return {};
    }
  }

  async issueCommandRefresh(commandId: string, vehicleId: string, command: string): Promise<any> {
    if (!this.config.access_token) {
      await this.auth();
    }

    let url = '';
    switch (command) {
      case 'unlock':
        url = vehicleUnlockRefreshUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'lock':
        url = vehicleLockRefreshUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'start':
        url = vehicleStartRefreshUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'stop':
        url = vehicleStopRefreshUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'startCharge':
        url = vehicleStartChargeRefreshUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'stopCharge':
        url = vehicleStopChargeRefreshUrl.replace('{vehicleId}', vehicleId);
        break;
      case 'status':
        url = vehicleSatusRefreshUrl.replace('{vehicleId}', vehicleId);
        break;
      default:
        break;
    }

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: baseApiUrl + url.replace('{commandId}', commandId),
      headers: {
        'Content-Type': 'application/json',
        'Application-Id': this.config.application_id,
        Authorization: `Bearer ${this.config.access_token}`,
      },
    };

    try {
      const result = await axios.request(options);
      if (result.status < 300 && result.data) {
        // While result.data.commandStatus === 'QUEUED' we need to keep polling
        // until result.data.commandStatus === 'SUCCESS' or 'FAILED'
        let commandStatus = result.data.commandStatus;
        let tries = 10;
        while (commandStatus === 'QUEUED' && tries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const refreshResult = await axios(options);
          commandStatus = refreshResult.data.commandStatus;
          tries--;
        }

        return result.data;
      } else {
        this.log.error(`Command failed with status: ${JSON.stringify(result)}`);
      }
      return {};
    } catch (error: any) {
      this.log.error(`Error occurred during request: ${error.message}`);
      if (error.response) {
        // Log detailed information about the response if available
        this.log.error(`Response status: ${error.response.status}`);
        this.log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        this.log.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        // Log information about the request
        this.log.error(`Request made but no response received: ${error.request}`);
      } else {
        // Log general error information
        this.log.error(`Error details: ${JSON.stringify(error)}`);
      }
      return {};
    }
  }

  /**
   * Authenticates the user and returns the access token or refresh token.
   * If the refresh token is available, it will be used to get a new access token.
   * If the refresh token is not available, the access token will be obtained using the code and client secret.
   * @returns A promise that resolves to the access token or refresh token.
   */
  async auth(): Promise<any> {
    if (!this.config.code && !this.config.client_secret) {
      this.log.error('Missing code or client_secret');
      return;
    }

    if (!this.config.refresh_token) {
      return await this.getAccessToken();
    } else {
      const refreshToken = await this.getRefreshToken();
      return refreshToken;
    }
  }

  /**
   * Retrieves the access token for the FordPass API.
   * @returns A Promise that resolves to the access token.
   */
  async getAccessToken(): Promise<any> {
    try {
      if (!this.config.code || !this.config.client_secret) {
        this.log.error('Missing code or client_secret');
        return;
      }
      const data = new URLSearchParams();
      data.append('grant_type', 'authorization_code');
      data.append('client_id', this.config.client_id ?? '');
      data.append('client_secret', this.config.client_secret);
      data.append('code', this.config.code);
      data.append('redirect_url', 'https://localhost:3000');

      const options: AxiosRequestConfig = {
        method: 'post',
        url: authorizeUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...headers,
        },
        maxBodyLength: Infinity,
        data: data.toString(),
      };

      const res = await axios.request(options);
      this.log.debug('Successfully got token from FordPass API');
      if (res.status === 200 && res.data.access_token) {
        this.config.refresh_token = res.data.refresh_token;
        this.config.access_token = res.data.access_token;
        return this.getRefreshToken();
      }
    } catch (error: any) {
      this.log.error(
        "Auth failed for FordPass.  Please follow the FordPass API Setup instructions to retrieve the 'code'.",
      );
      this.log.error(`Error occurred during request: ${error.message}`);
      if (error.response) {
        // Log detailed information about the response if available
        this.log.error(`Response status: ${error.response.status}`);
        this.log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        this.log.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        // Log information about the request
        this.log.error(`Request made but no response received: ${error.request}`);
      } else {
        // Log general error information
        this.log.error(`Error details: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * Retrieves a refresh token from the server.
   * @returns A Promise that resolves to the response data from the server.
   */
  async getRefreshToken(): Promise<any> {
    try {
      const data = new FormData();
      data.append('grant_type', 'refresh_token');
      data.append('refresh_token', this.config.refresh_token);
      data.append('client_id', this.config.client_id);
      data.append('client_secret', this.config.client_secret);

      const options = {
        method: 'post',
        maxBodyLength: Infinity,
        url: authorizeUrl,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...data.getHeaders(),
        },
        data: data,
      };
      const res = await axios.request(options);
      if (res.status === 200 && res.data.access_token) {
        this.config.access_token = res.data.access_token;
        this.config.refresh_token = res.data.refresh_token;

        return res.data;
      } else {
        this.log.error(`Auth failed with status: ${res.status}`);
      }
    } catch (error: any) {
      this.log.error(`Error occurred during request: ${error.message}`);
      if (error.response) {
        // Log detailed information about the response if available
        this.log.error(`Response status: ${error.response.status}`);
        this.log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        this.log.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        // Log information about the request
        this.log.error(`Request made but no response received: ${error.request}`);
      } else {
        // Log general error information
        this.log.error(`Error details: ${JSON.stringify(error)}`);
      }
    }
  }
}
