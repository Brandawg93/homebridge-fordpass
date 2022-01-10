import { Logging } from 'homebridge';
import querystring from 'querystring';
import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { FordpassConfig } from './types/config';

const authUrl = 'https://fcis.ice.ibmcloud.com/';

export class Connection {
  private config: FordpassConfig;
  private readonly log: Logging;

  constructor(config: FordpassConfig, log: Logging) {
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

    try {
      const result = await axios(options);
      if (result.status === 200 && result.data.access_token) {
        this.config.access_token = await axios
          .put(
            'https://api.mps.ford.com/api/oauth2/v1/token',
            {
              code: result.data.access_token,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'fordpass-na/353 CFNetwork/1121.2.2 Darwin/19.3.0',
                'Application-Id': '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592',
              },
            },
          )
          .then((res) => res.data.access_token)
          .catch((err) => {
            throw err;
          });
        return true;
      } else {
        this.log.error(`Auth failed with status: ${result.status}`);
      }
      return false;
    } catch (error: any) {
      this.log.error(`Auth failed with error: ${error.code || error.response.status}`);
      return false;
    }
  }
}
