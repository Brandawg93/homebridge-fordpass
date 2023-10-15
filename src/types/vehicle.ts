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

interface Metrics {
  alarmStatus: AlarmStatus;
  acceleratorPedalPosition: Status;
  batteryStateOfCharge: BatteryStatus;
  xevBatteryStateOfCharge: BatteryStatus;
  batteryVoltage: BatteryStatus;
  brakePedalStatus: Status;
  compassDirection: CompassStatus;
  doorLockStatus: Array<DoorLockStatus>;
  ignitionStatus: Status;
  odometer: Status;
  fuelLevel?: Status;
  oilLifeRemaining: Status;
  tirePressureStatus: Array<TirePressureStatus>;
  xevBatteryChargeDisplayStatus: Status;
  xevPlugChargerStatus: Status;
}

export enum Command {
  LOCK = 'lock',
  UNLOCK = 'unlock',
  START = 'start',
  STOP = 'stop',
  REFRESH = 'refresh',
}

export interface VehicleInfo {
  updateTime: string;
  vehicleId: string;
  vin: string;
  metrics: Metrics;
}
