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
import { Command } from './types/vehicle';
import { FordpassConfig, VehicleConfig } from './types/config';
import { Connection } from './fordpass-connection';
import { FordpassAccessory } from './accessory';

let hap: HAP;
let Accessory: typeof PlatformAccessory;

const PLUGIN_NAME = 'homebridge-fordpass';
const PLATFORM_NAME = 'FordPass';

class FordPassPlatform implements DynamicPlatformPlugin {
  private readonly log: Logging;
  private readonly api: API;
  private readonly accessories: Array<PlatformAccessory> = [];
  private vehicle!: Vehicle;
  private config: FordpassConfig;
  private pendingLockUpdate = false;
  private pendingStatusUpdate = false;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;
    this.config = config as FordpassConfig;

    // Need a config or plugin will not start
    if (!config) {
      return;
    }

    if (!config.code || !config.client_secret) {
      this.log.error('Please add a code and client_secret to your config.json.  See README.md for more information.');
      return;
    }

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.didFinishLaunching.bind(this));
  }

  configureAccessory(accessory: PlatformAccessory): void {
    const self = this;
    this.log.info(`Configuring accessory ${accessory.displayName}`);

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log.info(`${accessory.displayName} identified!`);
    });

    this.vehicle = new Vehicle(accessory.context.name, accessory.context.vin, this.config, this.log, this.api);
    const fordAccessory = new FordpassAccessory(accessory);

    // Create Lock service
    const defaultState = hap.Characteristic.LockTargetState.UNSECURED;
    const lockService = fordAccessory.createService(hap.Service.LockMechanism);
    const switchService = fordAccessory.createService(hap.Service.Switch);
    const batteryService = fordAccessory.createService(hap.Service.Battery, this.config.batteryName || 'Fuel Level');

    if (this.config.chargingSwitch) {
      fordAccessory.createService(hap.Service.OccupancySensor, 'Charging');
    } else {
      fordAccessory.removeService(hap.Service.OccupancySensor, 'Charging');
    }

    if (this.config.plugSwitch) {
      fordAccessory.createService(hap.Service.OccupancySensor, 'Plug');
    } else {
      fordAccessory.removeService(hap.Service.OccupancySensor, 'Plug');
    }

    lockService.setCharacteristic(hap.Characteristic.LockCurrentState, defaultState);

    lockService
      .setCharacteristic(hap.Characteristic.LockTargetState, defaultState)
      .getCharacteristic(hap.Characteristic.LockTargetState)
      .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.log.debug(`
          SET ${value ? 'Locking' : 'Unlocking'} ${accessory.displayName} 
          ${this.vehicle?.info?.vehicleStatus.lockStatus?.value}`);

        if (
          value === (this.vehicle?.info?.vehicleStatus.lockStatus?.value === 'LOCKED')
            ? hap.Characteristic.LockTargetState.SECURED
            : hap.Characteristic.LockTargetState.UNSECURED
        ) {
          this.log.debug('LOCK is already in the requested state');
          callback();
          return;
        }
        this.log.debug(`SET ${value ? 'Locking' : 'Unlocking'} ${accessory.displayName}`);
        let command = Command.LOCK;
        if (value === hap.Characteristic.LockTargetState.UNSECURED) {
          command = Command.UNLOCK;
        }
        this.pendingLockUpdate = true;
        // Just call the command and after 5 seconds update the vehicle info
        await this.vehicle.issueCommand(command);
        this.log.debug('Waiting 6 seconds to update vehicle info');
        await new Promise((resolve) => setTimeout(resolve, 6000));
        this.log.debug('Done waiting...Updating vehicle info');
        await this.vehicle.retrieveVehicleInfo();
        this.log.debug(`Lock status is now: ${this.vehicle?.info?.vehicleStatus.lockStatus?.value}`);
        this.pendingLockUpdate = false;
        callback();
      })
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        // Return cached value immediately then update properly
        let lockNumber = hap.Characteristic.LockTargetState.UNSECURED;
        let lockStatus = this.vehicle?.info?.vehicleStatus.lockStatus?.value || 'LOCKED';
        if (lockStatus === 'LOCKED') {
          lockNumber = hap.Characteristic.LockTargetState.SECURED;
        }
        callback(undefined, lockNumber);

        if (this.vehicle && this.vehicle.vehicleId) {
          if (!this.pendingStatusUpdate) {
            // Now update the lock status from API
            this.pendingStatusUpdate = true;
            await this.vehicle.issueCommand(Command.REFRESH);
            await new Promise((resolve) => setTimeout(resolve, 6000));
            await this.vehicle.retrieveVehicleInfo();
            this.pendingStatusUpdate = false;
            lockStatus = this.vehicle.info?.vehicleStatus.lockStatus?.value || 'LOCKED';
            lockNumber =
              lockStatus === 'LOCKED'
                ? hap.Characteristic.LockTargetState.SECURED
                : hap.Characteristic.LockTargetState.UNSECURED;
            lockService.updateCharacteristic(hap.Characteristic.LockCurrentState, lockNumber);
            lockService.updateCharacteristic(hap.Characteristic.LockTargetState, lockNumber);
          } else {
            // It's already updating elsewhere, so wait for it to finish
            const interval = setInterval(() => {
              if (!this.pendingStatusUpdate) {
                clearInterval(interval);
                lockStatus = this.vehicle?.info?.vehicleStatus.lockStatus?.value || 'LOCKED';
                lockNumber =
                  lockStatus === 'LOCKED'
                    ? hap.Characteristic.LockTargetState.SECURED
                    : hap.Characteristic.LockTargetState.UNSECURED;
                lockService.updateCharacteristic(hap.Characteristic.LockCurrentState, lockNumber);
                lockService.updateCharacteristic(hap.Characteristic.LockTargetState, lockNumber);
              }
            }, 3000);
          }
        }
      });

    switchService
      .setCharacteristic(hap.Characteristic.On, false)
      .getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.log.debug(
          `SET ${value ? 'Starting' : 'Stopping'} ${accessory.displayName} ${
            this.vehicle?.info?.vehicleStatus.lockStatus?.value
          }`,
        );
        if (value === (this.vehicle?.info?.vehicleStatus.ignitionStatus.value === 'ON')) {
          this.log.debug('Engine is already in the requested state');
          callback();
          return;
        }
        this.log.debug(`${value ? 'Starting' : 'Stopping'} ${accessory.displayName}`);
        if (value as boolean) {
          await this.vehicle.issueCommand(Command.START);
        } else {
          await this.vehicle.issueCommand(Command.STOP);
        }

        await new Promise((resolve) => setTimeout(resolve, 6000));
        await this.vehicle.retrieveVehicleInfo();
        this.log.debug(`Start status is now: ${this.vehicle?.info?.vehicleStatus.ignitionStatus.value}`);
        callback();
      })
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        // Return cached value immediately then update properly
        let engineStatus = this.vehicle?.info?.vehicleStatus.ignitionStatus.value || 'OFF';
        callback(undefined, engineStatus);

        if (this.vehicle && this.vehicle.vehicleId) {
          // Now update the lock status from API
          if (!this.pendingStatusUpdate) {
            this.pendingStatusUpdate = true;
            await this.vehicle.issueCommand(Command.REFRESH);
            await new Promise((resolve) => setTimeout(resolve, 6000));
            await this.vehicle.retrieveVehicleInfo();
            this.pendingStatusUpdate = false;

            engineStatus = this.vehicle?.info?.vehicleStatus.ignitionStatus.value || 'OFF';
            switchService.getCharacteristic(hap.Characteristic.On).updateValue(engineStatus === 'ON');
          } else {
            // It's already updating elsewhere, so wait for it to finish
            const interval = setInterval(() => {
              if (!this.pendingStatusUpdate) {
                clearInterval(interval);
                engineStatus = this.vehicle?.info?.vehicleStatus.ignitionStatus.value || 'OFF';
                switchService.getCharacteristic(hap.Characteristic.On).updateValue(engineStatus === 'ON');
              }
            }, 3000);
          }
        }
      });

    batteryService
      .setCharacteristic(hap.Characteristic.BatteryLevel, 100)
      .getCharacteristic(hap.Characteristic.BatteryLevel)
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        // Return cached value immediately then update properly
        if (!this.vehicle) {
          callback(undefined, 100);
          return;
        }
        const fuel = this.vehicle?.info?.vehicleStatus.fuelLevel?.value as number;
        const battery = this.vehicle?.info?.vehicleDetails.batteryChargeLevel?.value as number;
        let level = fuel || battery || 100;
        if (level > 100) {
          level = 100;
        }
        if (level < 0) {
          level = 0;
        }
        callback(undefined, level);
        const chargingStatus = this.vehicle?.info?.vehicleStatus.chargingStatus?.value;
        batteryService.updateCharacteristic(hap.Characteristic.BatteryLevel, level);
        if (battery) {
          if (chargingStatus === 'ChargingAC') {
            batteryService.updateCharacteristic(
              hap.Characteristic.ChargingState,
              hap.Characteristic.ChargingState.CHARGING,
            );
          } else {
            batteryService.updateCharacteristic(
              hap.Characteristic.ChargingState,
              hap.Characteristic.ChargingState.NOT_CHARGING,
            );
          }
        } else {
          batteryService.updateCharacteristic(
            hap.Characteristic.ChargingState,
            hap.Characteristic.ChargingState.NOT_CHARGEABLE,
          );
        }

        if (level < 20) {
          batteryService.updateCharacteristic(
            hap.Characteristic.StatusLowBattery,
            hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW,
          );
        } else {
          batteryService.updateCharacteristic(
            hap.Characteristic.StatusLowBattery,
            hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
          );
        }
      });
    this.accessories.push(accessory);
  }

  async didFinishLaunching(): Promise<void> {
    this.log.debug('Configuring FordPass');
    const ford = new Connection(this.config, this.log, this.api);
    const authInfo = await ford.auth();
    if (authInfo) {
      setInterval(async () => {
        this.log.debug('Reauthenticating with refresh token');
        await ford.getRefreshToken();
      }, (authInfo.expires_in ?? 0) * 1000 - 10000);

      await this.addVehicle(ford);
      await this.updateVehicle();
      await this.refreshVehicle();

      // Vehicle info needs to be updated every 5 minutes
      setInterval(async () => {
        await this.updateVehicle();
      }, 60 * 1000 * 5);
    }
  }

  async addVehicle(connection: Connection): Promise<void> {
    const vehicles = await connection.getVehicles();
    // Get first vehicle in the list as FordPass only lets you choose one per Dev Account
    if (vehicles) {
      const vehicleConfig = vehicles[0] as VehicleConfig;
      vehicleConfig.vehicleId = vehicleConfig.vehicleId.toUpperCase();
      this.vehicle.vehicleId = vehicleConfig.vehicleId;
      const name =
        vehicleConfig.nickName || vehicleConfig.modelYear + ' ' + vehicleConfig.make + ' ' + vehicleConfig.modelName;
      const uuid = hap.uuid.generate(vehicleConfig.vehicleId);
      const accessory = new Accessory(name, uuid);
      accessory.context.name = name;
      accessory.context.vehicleId = vehicleConfig.vehicleId;

      const accessoryInformation = accessory.getService(hap.Service.AccessoryInformation);
      if (accessoryInformation) {
        accessoryInformation.setCharacteristic(hap.Characteristic.Manufacturer, 'Ford');
        accessoryInformation.setCharacteristic(hap.Characteristic.Model, name);
        accessoryInformation.setCharacteristic(hap.Characteristic.SerialNumber, vehicleConfig.vehicleId);
      }

      // Only add new cameras that are not cached
      if (!this.accessories.find((x: PlatformAccessory) => x.UUID === uuid)) {
        this.log.debug(`New vehicle found: ${name}`);
        this.configureAccessory(accessory); // abusing the configureAccessory here
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  async updateVehicle(): Promise<void> {
    // wait for 10 seconds before updating the vehicle info
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await this.vehicle.retrieveVehicleInfo();
    const status = this.vehicle?.info?.vehicleStatus;
    const lockStatus = status?.lockStatus?.value;
    let lockNumber = hap.Characteristic.LockCurrentState.UNSECURED;
    if (lockStatus === 'LOCKED') {
      lockNumber = hap.Characteristic.LockCurrentState.SECURED;
    }

    const engineStatus = status?.ignitionStatus.value;
    let started = true;
    if (engineStatus === 'OFF') {
      started = false;
    }
    const uuid = hap.uuid.generate(this.vehicle.vehicleId);
    const accessory = this.accessories.find((x: PlatformAccessory) => x.UUID === uuid);
    if (accessory) {
      const fordAccessory = new FordpassAccessory(accessory);

      if (!this.pendingLockUpdate) {
        const lockService = fordAccessory.findService(hap.Service.LockMechanism);
        lockService && lockService.updateCharacteristic(hap.Characteristic.LockCurrentState, lockNumber);
        lockService && lockService.updateCharacteristic(hap.Characteristic.LockTargetState, lockNumber);
      }
      const switchService = fordAccessory.findService(hap.Service.Switch);
      switchService && switchService.updateCharacteristic(hap.Characteristic.On, started);

      const plugService = fordAccessory.findService(hap.Service.OccupancySensor, 'Plug');
      plugService &&
        plugService.updateCharacteristic(
          hap.Characteristic.OccupancyDetected,
          status?.plugStatus?.value
            ? hap.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
            : hap.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
        );

      this.log.debug(`Charging status: ${status?.chargingStatus?.value}`);
      const chargingService = fordAccessory.findService(hap.Service.OccupancySensor, 'Charging');
      chargingService &&
        chargingService.updateCharacteristic(
          hap.Characteristic.OccupancyDetected,
          status?.chargingStatus?.value === 'ChargingAC'
            ? hap.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
            : hap.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
        );
    } else {
      this.log.warn(`Accessory not found for ${this.vehicle.name}`);
    }
  }

  async refreshVehicle(): Promise<void> {
    this.log.debug(
      `Configuring ${this.vehicle.name} (${this.config.autoRefresh}) to refresh every ${this.config.refreshRate} minutes.`,
    );
    if (this.vehicle.autoRefresh && this.vehicle.refreshRate && this.vehicle.refreshRate > 0) {
      setInterval(async () => {
        this.log.debug(`Refreshing info for ${this.vehicle.name}`);
        await this.vehicle.issueCommand(Command.REFRESH);
      }, 60000 * this.vehicle.refreshRate);
    }
  }
}

export = (api: API): void => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, FordPassPlatform);
};
