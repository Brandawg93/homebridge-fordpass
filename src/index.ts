import {
  API,
  APIEvent,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig,
} from 'homebridge';
import { Vehicle } from './fordpass';
import { Command } from './models/vehicle-info';
import { Connection } from './fordpass-connection';

let hap: HAP;
let Accessory: typeof PlatformAccessory;

const PLUGIN_NAME = 'homebridge-fordpass';
const PLATFORM_NAME = 'FordPass';

class FordPassPlatform implements DynamicPlatformPlugin {
  private readonly log: Logging;
  private readonly api: API;
  private readonly accessories: Array<PlatformAccessory> = [];
  private readonly vehicles: Array<Vehicle> = [];
  private config: PlatformConfig;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;
    this.config = config;

    // Need a config or plugin will not start
    if (!config) {
      return;
    }

    if (!config.username || !config.password || !config.vehicles) {
      this.log.error('Please add a userame, password, and vehicles to your config.json');
      return;
    }

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.didFinishLaunching.bind(this));
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info(`Configuring accessory ${accessory.displayName}`);

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log.info(`${accessory.displayName} identified!`);
    });

    const vehicle = new Vehicle(accessory.context.name, accessory.context.vin, this.config, this.log);

    const oldLockService = accessory.getService(hap.Service.LockMechanism);
    if (oldLockService) {
      this.log.debug(`Existing lock found for ${accessory.displayName}. Removing...`);
      accessory.removeService(oldLockService);
    }

    const oldSwitchService = accessory.getService(hap.Service.Switch);
    if (oldSwitchService) {
      this.log.debug(`Existing switch found for ${accessory.displayName}. Removing...`);
      accessory.removeService(oldSwitchService);
    }

    // Create Lock service
    const defaultState = 1;
    const service = new hap.Service.LockMechanism();
    service.setCharacteristic(hap.Characteristic.LockCurrentState, defaultState);

    service
      .setCharacteristic(hap.Characteristic.LockTargetState, defaultState)
      .getCharacteristic(hap.Characteristic.LockTargetState)
      .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.log.debug(`${value ? 'Locking' : 'Unlocking'} ${accessory.displayName}`);
        if (value === 0) {
          await vehicle.issueCommand(Command.UNLOCK);
        } else {
          await vehicle.issueCommand(Command.LOCK);
        }
        service.updateCharacteristic(hap.Characteristic.LockCurrentState, value);
        callback();
      })
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        const status = await vehicle.status();
        if (status) {
          const lockStatus = status.lockStatus.value;
          let lockNumber = 0;
          if (lockStatus === 'LOCKED') {
            lockNumber = 1;
          }
          service.updateCharacteristic(hap.Characteristic.LockTargetState, lockNumber);
        }
        callback();
      });

    accessory.addService(service);

    accessory
      .addService(new hap.Service.Switch())
      .setCharacteristic(hap.Characteristic.On, false)
      .getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.log.debug(`${value ? 'Starting' : 'Stopping'} ${accessory.displayName}`);
        if (value as boolean) {
          await vehicle.issueCommand(Command.START);
        } else {
          await vehicle.issueCommand(Command.STOP);
        }
        callback();
      })
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        const status = await vehicle.status();
        if (status) {
          const engineStatus = vehicle.info?.remoteStartStatus.value || 0;
          let started = false;
          if (engineStatus > 0) {
            started = true;
          }
          service.updateCharacteristic(hap.Characteristic.On, started);
        }
        callback();
      });

    this.vehicles.push(vehicle);
    this.accessories.push(accessory);
  }

  async didFinishLaunching(): Promise<void> {
    const self = this;
    const ford = new Connection(this.config, this.log);
    const connected = await ford.auth();

    if (connected) {
      // FordPass needs to be reauthenticated about every 2 hours
      setInterval(async function () {
        self.log.debug('Reauthenticating with config credentials');
        await ford.auth();
      }, 7080000); // 118 minutes

      await this.addVehicles();
      await this.updateVehicles();

      // Vehicle info needs to be updated every 30 minutes
      setInterval(async function () {
        await self.updateVehicles();
      }, 1800000);
    }
  }

  async addVehicles(): Promise<void> {
    const vehicles = this.config.vehicles;
    vehicles.forEach(async (vehicle: any) => {
      vehicle.vin = vehicle.vin.toUpperCase();
      const uuid = hap.uuid.generate(vehicle.vin);
      const accessory = new Accessory(vehicle.name, uuid);
      accessory.context.name = vehicle.name;
      accessory.context.vin = vehicle.vin;

      const accessoryInformation = accessory.getService(hap.Service.AccessoryInformation);
      if (accessoryInformation) {
        accessoryInformation.setCharacteristic(hap.Characteristic.Manufacturer, 'Ford');
        accessoryInformation.setCharacteristic(hap.Characteristic.Model, vehicle.name);
        accessoryInformation.setCharacteristic(hap.Characteristic.SerialNumber, vehicle.vin);
      }

      // Only add new cameras that are not cached
      if (!this.accessories.find((x: PlatformAccessory) => x.UUID === uuid)) {
        this.log.debug(`New vehicle found: ${vehicle.name}`);
        this.configureAccessory(accessory); // abusing the configureAccessory here
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    });
  }

  async updateVehicles(): Promise<void> {
    this.vehicles.forEach(async (vehicle: Vehicle) => {
      vehicle.info = await vehicle.status();
      this.log.debug(`Updating info for ${vehicle.name}`);
      const lockStatus = vehicle.info?.lockStatus.value;
      let lockNumber = 0;
      if (lockStatus === 'LOCKED') {
        lockNumber = 1;
      }

      const engineStatus = vehicle.info?.remoteStartStatus.value || 0;
      let started = false;
      if (engineStatus > 0) {
        started = true;
      }
      const uuid = hap.uuid.generate(vehicle.vin);
      const accessory = this.accessories.find((x: PlatformAccessory) => x.UUID === uuid);

      const lockService = accessory?.getService(hap.Service.LockMechanism);
      lockService && lockService.updateCharacteristic(hap.Characteristic.LockCurrentState, lockNumber);
      lockService && lockService.updateCharacteristic(hap.Characteristic.LockTargetState, lockNumber);

      const switchService = accessory?.getService(hap.Service.Switch);
      switchService && switchService.updateCharacteristic(hap.Characteristic.On, started);
    });
  }
}

export = (api: API): void => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, FordPassPlatform);
};
