interface Base {
  status: string;
  timestamp: string;
}

interface Status extends Base {
  value: string;
}

interface Fuel extends Base {
  fuelLevel: number;
  distanceToEmpty: number;
}

interface GPS extends Base {
  latitude: string;
  longitude: string;
  gpsState: string;
}

interface RemoteStart extends Base {
  remoteStartDuration: number;
  remoteStartTime: number;
}

interface RemoteStartStatus {
  value: number;
  status: string;
  timestamp: string;
}

interface Battery {
  batteryHealth: Status;
  batteryStatusActual: Status;
}

interface Oil extends Base {
  oilLife: string;
  oilLifeActual: number;
  status: string;
  timestamp: string;
}

export enum Command {
  LOCK = 'lock',
  UNLOCK = 'unlock',
  START = 'start',
  STOP = 'stop',
}

export interface VehicleInfo {
  vin: string;
  lockStatus: Status;
  alarm: Status;
  PrmtAlarmEvent: Status;
  odometer: Status;
  fuel: Fuel;
  gps: GPS;
  remoteStart: RemoteStart;
  remoteStartStatus: RemoteStartStatus;
  battery: Battery;
  oil: Oil;
  tirePressure: Status;
  authorization: string;
  // Some properties are not indexed
  lastRefresh: string;
  lastModifiedDate: string;
  serverTime: string;
  batteryFillLevel: any;
  elVehDTE: any;
  hybridModeStatus: any;
  chargingStatus: any;
  plugStatus: any;
  chargeStartTime: any;
  chargeEndTime: any;
  preCondStatusDsply: any;
  chargerPowertype: any;
  batteryPerfStatus: any;
  batteryChargeStatus: any;
  dcFastChargeData: any;
  ignitionStatus: Status;
  batteryTracLowChargeThreshold: any;
  battTracLoSocDDsply: any;
  trailerLightCheckStatus: any;
}
