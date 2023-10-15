interface Base {
  status: string;
  timestamp: string;
}

interface Status extends Base {
  updateTime: string;
  oemCorrelationId: string;
  value: string;
}

interface Fuel extends Base {
  updateTime: string;
  oemCorrelationId: string;
  value: number;
}

interface GPS extends Base {
  latitude: string;
  longitude: string;
  gpsState: string;
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
  REFRESH = 'refresh',
}

export interface VehicleInfo {
  vin: string;
  doorLockStatus: Status;
  alarm: Status;
  PrmtAlarmEvent: Status;
  odometer: Status;
  fuelLevel?: Fuel;
  gps: GPS;
  battery: Battery;
  oil: Oil;
  tirePressure: Status;
  authorization: string;
  // Some properties are not indexed
  lastRefresh: string;
  lastModifiedDate: string;
  serverTime: string;
  batteryFillLevel?: RemoteStartStatus;
  elVehDTE: any;
  hybridModeStatus: Status;
  chargingStatus: Status;
  plugStatus: RemoteStartStatus;
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
