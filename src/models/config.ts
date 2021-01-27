import { PlatformConfig } from 'homebridge';

export interface VehicleConfig {
  name: string;
  vin: string;
  autoRefresh: boolean;
  refreshRate: number;
}

export interface FordpassConfig extends PlatformConfig {
  username?: string;
  password?: string;
  vehicles?: Array<VehicleConfig>;
}
