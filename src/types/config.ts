import { PlatformConfig } from 'homebridge';

interface Options {
  autoRefresh?: boolean;
  refreshRate?: number;
}

export interface VehicleConfig {
  name: string;
  vin: string;
}

export interface FordpassConfig extends PlatformConfig {
  username?: string;
  password?: string;
  vehicles?: Array<VehicleConfig>;
  options?: Options;
  refreshTokenRate?: number,
}
