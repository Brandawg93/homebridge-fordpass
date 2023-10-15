import { PlatformConfig } from 'homebridge';

interface Options {
  region?: string;
  batteryName?: string;
  autoRefresh?: boolean;
  refreshRate?: number;
  chargingSwitch?: boolean;
  plugSwitch?: boolean;
}

export interface VehicleConfig {
  nickName: string;
  model: string;
  year: number;
  make: string;
  VIN: string;
}

export interface FordpassConfig extends PlatformConfig {
  username?: string;
  password?: string;
  options?: Options;
  access_token?: string;
  autonomic_token?: string;
  refresh_token?: string;
}
