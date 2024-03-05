import { PlatformConfig } from 'homebridge';

export interface VehicleConfig {
  make: string;
  modelName: string;
  modelYear: string;
  color: string;
  nickName: string;
  modemEnabled: boolean;
  vehicelAuthorizationIndicator: number;
  serviceCompatible: boolean;
  vehicleId: string;
}

export interface vehicleCapabilities {
  remoteLock: string;
  remoteUnlock: string;
  remoteStart: string;
  remoteStop: string;
  boundaryAlerts: string;
  remoteChirpHonk: string;
  remotePanicAlarm: string;
  displayPreferredChargeTimes: string;
  departureTimes: string;
  globalStartStopCharge: string;
}

export interface FordpassConfig extends PlatformConfig {
  name?: string;
  autoRefresh?: boolean;
  refreshRate?: number;
  batteryName?: string;
  chargingSwitch?: boolean;
  plugSwitch?: boolean;
  client_secret?: string;
  code?: string;
  access_token?: string;
  refresh_token?: string;
}
