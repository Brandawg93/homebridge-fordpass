import { PlatformConfig } from 'homebridge';

interface Options {
  region?: string;
  batteryName?: string;
  autoRefresh?: boolean;
  refreshRate?: number;
}

export interface VehicleConfig {
  nickName: string;
  vehicleType: string;
  vin: string;
}

export interface FordpassConfig extends PlatformConfig {
  username?: string;
  password?: string;
  options?: Options;
  access_token?: string;
  refresh_token?: string;
}
