interface Status {
  updateTime: string;
  oemCorrelationId: string;
  value: string | number;
}

interface AlarmStatus extends Status {
  tags: any;
}

interface BatteryStatus extends Status {
  vehicleBattery: string;
}

interface CompassStatus extends Status {
  gpsModuleTimestamp: string;
}

interface DoorLockStatus extends Status {
  vehicleDoor: string;
}

interface TirePressureStatus extends Status {
  vehicleWheel: string;
}

export enum Command {
  LOCK = 'lock',
  UNLOCK = 'unlock',
  START = 'start',
  STOP = 'stop',
  REFRESH = 'refresh',
}

export interface VehicleInfo {
  vehicleId: string;
  make: string;
  modelName: string;
  modelYear: string;
  color: string;
  nickName: string;
  modemEnabled: boolean;
  lastUpdated: string;
  vehicleAuthorizationIndicator: number;
  serviceCompatible: boolean;
  engineType: string;
  vehicleDetails: VehicleDetails;
  vehicleStatus: VehicleStatus;
  vehicleLocation: VehicleLocation;
  vehicleCapabilities: VehicleCapabilities;
}

interface VehicleDetails {
  batteryChargeLevel: BatteryChargeLevel;
  mileage: number;
  odometer: number;
}

interface BatteryChargeLevel {
  value: number;
  distanceToEmpty: number;
  timestamp: string;
}

interface VehicleStatus {
  tirePressureWarning: boolean;
  deepSleepInProgress: boolean;
  firmwareUpgradeInProgress: boolean;
  remoteStartStatus: RemoteStartStatus;
  chargingStatus: ChargingStatus;
  plugStatus: PlugStatus;
  ignitionStatus: IgnitionStatus;
  doorStatus: DoorStatus[];
  lockStatus: LockStatus;
  alarmStatus: AlarmStatus;
  fuelLevel: Status;
}

interface RemoteStartStatus {
  duration: number;
}

interface ChargingStatus {
  value: string;
  timeStamp: string;
  chargeStartTime: string;
  chargeEndTime: string;
}

interface PlugStatus {
  value: boolean;
  timeStamp: string;
}

interface IgnitionStatus {
  value: string;
  timeStamp: string;
}

interface DoorStatus {
  vehicleDoor: string;
  value: string;
  vehicleOccupantRole: string;
  timeStamp: string;
}

interface LockStatus {
  value: string;
  timeStamp: string;
}

interface AlarmStatus {
  value: string;
  timeStamp: string;
}

interface VehicleLocation {
  longitude: string;
  latitude: string;
  speed: number;
  direction: string;
  timeStamp: string;
}

interface VehicleCapabilities {
  remoteLock: string;
  remoteUnlock: string;
  remoteStart: string;
  remoteStop: string;
  boundaryAlerts: string;
}
