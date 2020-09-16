import { PlatformConfig } from 'homebridge';

export interface VehicleConfig {
  name: string;
  vin: string;
}

export interface FordpassConfig extends PlatformConfig {
  username?: string;
  password?: string;
  vehicles?: Array<VehicleConfig>;
}
