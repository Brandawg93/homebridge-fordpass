import { PlatformConfig, Logging } from 'homebridge';
import querystring from 'querystring';
import { AxiosRequestConfig } from 'axios';
import axios from 'axios';

const authUrl = 'https://fcis.ice.ibmcloud.com/';

export class Connection {
  private config: PlatformConfig;
  private readonly log: Logging;

  constructor(config: PlatformConfig, log: Logging) {
    this.config = config;
    this.log = log;
  }

  async auth(): Promise<boolean> {
    const url = authUrl + 'v1.0/endpoint/default/token';
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'fordpass-na/353 CFNetwork/1121.2.2 Darwin/19.3.0',
      },
      data: querystring.stringify({
        client_id: '9fb503e0-715b-47e8-adfd-ad4b7770f73b',
        grant_type: 'password',
        username: this.config.username,
        password: this.config.password,
      }),
    };

    const result = await axios(options);
    if (result.status === 200) {
      this.config.access_token = result.data.access_token;
      return true;
    } else {
      this.log.error(`Auth failed with status: ${status}`);
    }
    return false;
  }
}
