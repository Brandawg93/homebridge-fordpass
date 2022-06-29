import { Logging } from 'homebridge';
import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { FordpassConfig } from './types/config';
import crypto from 'crypto';
import base64url from 'base64url';
import { URLSearchParams } from 'url';

const vehiclesUrl = 'https://services.cx.ford.com/api/dashboard/v1/users/vehicles';
const catWithRefreshTokenUrl = 'https://api.mps.ford.com/api/token/v2/cat-with-refresh-token';
const catWithCIAccessTokenUrl = 'https://api.mps.ford.com/api/token/v2/cat-with-ci-access-token';
const authorizeUrl = 'https://sso.ci.ford.com/v1.0/endpoint/default/authorize';
const tokenUrl = 'https://sso.ci.ford.com/oidc/endpoint/default/token';

const defaultAppId = '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592';
const clientId = '9fb503e0-715b-47e8-adfd-ad4b7770f73b';
const userAgent = 'FordPass/5 CFNetwork/1333.0.4 Darwin/21.5.0';

const randomStr = (len: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const codeChallenge = (str: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return base64url(hash.digest());
};

const headers = {
  'User-Agent': userAgent,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
};

export class Connection {
  private config: FordpassConfig;
  private readonly log: Logging;
  private applicationId: string;

  constructor(config: FordpassConfig, log: Logging) {
    this.config = config;
    this.log = log;
    this.applicationId = config.options?.region || defaultAppId;
  }

  async refreshAuth(): Promise<any> {
    try {
      if (this.config.refresh_token) {
        const result = await axios.post(
          catWithRefreshTokenUrl,
          {
            refresh_token: this.config.refresh_token,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Application-Id': this.applicationId,
              ...headers,
            },
          },
        );
        if (result.status === 200 && result.data.access_token) {
          this.config.access_token = result.data.access_token;
          this.config.refresh_token = result.data.refresh_token;
          return result.data;
        } else {
          this.log.error(`Auth failed with status: ${result.status}`);
        }
      } else {
        return await this.auth();
      }
      return;
    } catch (error: any) {
      this.log.error(`Auth failed with error: ${error.code || error.response.status}`);
      return;
    }
  }

  async getVehicles(): Promise<Array<any>> {
    if (!this.config.access_token) {
      return [];
    }
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: vehiclesUrl,
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': this.config.access_token,
        'Application-Id': this.applicationId,
        ...headers,
      },
    };

    try {
      const result = await axios(options);
      if (result.status === 200 && result.data) {
        return result.data;
      } else {
        this.log.error(`Vehicles failed with status: ${result.status}`);
      }
      return [];
    } catch (error: any) {
      this.log.error(`Vehicles failed with error: ${error.code || error.response.status}`);
      return [];
    }
  }

  async auth(): Promise<any> {
    const numOfRedirects = 2;
    const code = randomStr(43);
    let cookies = undefined;
    const url = `${authorizeUrl}?redirect_uri=fordapp://userauthorized&response_type=code&scope=openid&max_age=3600&client_id=9fb503e0-715b-47e8-adfd-ad4b7770f73b&code_challenge=${codeChallenge(
      code,
    )}&code_challenge_method=S256`;
    let nextUrl = url;
    for (let i = 0; i < numOfRedirects; i++) {
      const options: AxiosRequestConfig = {
        method: 'GET',
        maxRedirects: 0,
        url: nextUrl,
        headers: {
          ...headers,
        },
      };

      if (options.headers && cookies) {
        options.headers.cookie = cookies;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await axios(options);
        throw new Error('Authentication failed');
      } catch (err: any) {
        if (err?.response?.status === 302) {
          nextUrl = err.response.headers.location;
          cookies = err.response.headers['set-cookie'];
        } else {
          this.log.error(`Auth failed with status: ${err.status}`);
        }
      }
    }
    return this.doLogin(nextUrl, code, cookies);
  }

  private async doLogin(url: string, code_verifier: string, cookies: string | number | boolean): Promise<any> {
    if (!this.config.username || !this.config.password) {
      throw new Error('Username or password is empty in config');
    }
    const options: AxiosRequestConfig = {
      method: 'POST',
      maxRedirects: 0,
      url: url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: cookies,
        ...headers,
      },
      data: new URLSearchParams({
        operation: 'verify',
        'login-form-type': 'pwd',
        username: this.config.username,
        password: this.config.password,
      }).toString(),
    };

    try {
      await axios(options);
      throw new Error('Authentication failed');
    } catch (err: any) {
      if (err?.response?.status === 302) {
        const nextUrl = err.response.headers.location;
        const cookies = err.response.headers['set-cookie'];
        return this.getAuthorizationCode(nextUrl, code_verifier, cookies);
      } else {
        this.log.error(`Auth failed with status: ${err.status}`);
      }
    }
  }

  private async getAuthorizationCode(
    url: string,
    code_verifier: string,
    cookies: string | number | boolean,
  ): Promise<any> {
    const options: AxiosRequestConfig = {
      method: 'GET',
      maxRedirects: 0,
      url: url,
      headers: {
        cookie: cookies,
        ...headers,
      },
    };

    try {
      await axios(options);
      throw new Error('Authentication failed');
    } catch (err: any) {
      if (err?.response?.status === 302) {
        const nextUrl = err.response.headers.location;
        const params = new URLSearchParams(nextUrl.split('?')[1]);
        const code = params.get('code');
        if (code) {
          return this.getAccessToken(code, code_verifier);
        }
      } else {
        this.log.error(`Auth failed with status: ${err.status}`);
      }
    }
  }

  private async getAccessToken(code: string, code_verifier: string): Promise<any> {
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
      },
      data: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        scope: 'openid',
        redirect_uri: 'fordapp://userauthorized',
        code: code,
        code_verifier: code_verifier,
      }).toString(),
    };

    try {
      const res = await axios(options);
      if (res.status === 200 && res.data.access_token) {
        return this.getRefreshToken(res.data.access_token);
      }
    } catch (err: any) {
      this.log.error(`Auth failed with error: ${err}`);
    }
  }

  private async getRefreshToken(access_token: string): Promise<any> {
    const res = await axios.post(
      catWithCIAccessTokenUrl,
      {
        ciToken: access_token,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Application-Id': this.applicationId,
          ...headers,
        },
      },
    );
    if (res.status === 200 && res.data.access_token) {
      this.config.access_token = res.data.access_token;
      this.config.refresh_token = res.data.refresh_token;
      return res.data;
    } else {
      this.log.error(`Auth failed with status: ${res.status}`);
    }
  }
}
