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
  private readonly vehicles: Array<Vehicle> = [];
  private config: FordpassConfig;
  private pendingLockUpdate = false;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;
    this.config = config as FordpassConfig;

    // Need a config or plugin will not start
    if (!config) {
      return;
    }

    if (!config.username || !config.password) {
      this.log.error('Please add a userame and password to your config.json');
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

    const vehicle = new Vehicle(accessory.context.name, accessory.context.vin, this.config, this.log);
    const fordAccessory = new FordpassAccessory(accessory);

    // Create Lock service
    const defaultState = hap.Characteristic.LockTargetState.UNSECURED;
    const lockService = fordAccessory.createService(hap.Service.LockMechanism);
    const switchService = fordAccessory.createService(hap.Service.Switch);
    const batteryService = fordAccessory.createService(
      hap.Service.Battery,
      this.config.options?.batteryName || 'Fuel Level',
    );

    if (this.config.options?.chargingSwitch) {
      const chargingService = fordAccessory.createService(hap.Service.StatelessProgrammableSwitch);
      chargingService.getCharacteristic(hap.Characteristic.ProgrammableSwitchEvent).setProps({
        maxValue: hap.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
      });
    } else {
      fordAccessory.removeService(hap.Service.StatelessProgrammableSwitch);
    }

    lockService.setCharacteristic(hap.Characteristic.LockCurrentState, defaultState);

    lockService
      .setCharacteristic(hap.Characteristic.LockTargetState, defaultState)
      .getCharacteristic(hap.Characteristic.LockTargetState)
      .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.log.debug(`${value ? 'Locking' : 'Unlocking'} ${accessory.displayName}`);
        let commandId = '';
        let command = Command.LOCK;
        if (value === hap.Characteristic.LockTargetState.UNSECURED) {
          command = Command.UNLOCK;
        }
        commandId = await vehicle.issueCommand(command);

        let tries = 30;
        this.pendingLockUpdate = true;
        const self = this;
        const interval = setInterval(async () => {
          if (tries > 0) {
            const status = await vehicle.commandStatus(command, commandId);
            if (status?.status === 200) {
              lockService.updateCharacteristic(hap.Characteristic.LockCurrentState, value);
              self.pendingLockUpdate = false;
              clearInterval(interval);
            }
            tries--;
          } else {
            self.pendingLockUpdate = false;
            clearInterval(interval);
          }
        }, 1000);
        callback(undefined, value);
      })
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        // Return cached value immediately then update properly
        let lockNumber = hap.Characteristic.LockTargetState.UNSECURED;
        const lockStatus = vehicle?.info?.lockStatus.value;
        if (lockStatus === 'LOCKED') {
          lockNumber = hap.Characteristic.LockTargetState.SECURED;
        }
        callback(undefined, lockNumber);

        const status = await vehicle.status();
        if (status) {
          let lockNumber = hap.Characteristic.LockTargetState.UNSECURED;
          const lockStatus = status.lockStatus.value;
          if (lockStatus === 'LOCKED') {
            lockNumber = hap.Characteristic.LockTargetState.SECURED;
          }
          lockService.updateCharacteristic(hap.Characteristic.LockCurrentState, lockNumber);
          lockService.updateCharacteristic(hap.Characteristic.LockTargetState, lockNumber);
        } else {
          self.log.error(`Cannot get information for ${accessory.displayName} lock`);
        }
      });

    switchService
      .setCharacteristic(hap.Characteristic.On, false)
      .getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.log.debug(`${value ? 'Starting' : 'Stopping'} ${accessory.displayName}`);
        if (value as boolean) {
          await vehicle.issueCommand(Command.START);
        } else {
          await vehicle.issueCommand(Command.STOP);
        }
        callback(undefined, value);
      })
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        // Return cached value immediately then update properly
        const engineStatus = vehicle?.info?.remoteStartStatus.value || 0;
        callback(undefined, engineStatus);
        const status = await vehicle.status();
        if (status) {
          let started = false;
          const engineStatus = status.remoteStartStatus.value || 0;
          if (engineStatus > 0) {
            started = true;
          }
          switchService.updateCharacteristic(hap.Characteristic.On, started);
        } else {
          self.log.error(`Cannot get information for ${accessory.displayName} engine`);
        }
      });

    batteryService
      .setCharacteristic(hap.Characteristic.BatteryLevel, 100)
      .getCharacteristic(hap.Characteristic.BatteryLevel)
      .on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
        // Return cached value immediately then update properly
        const fuel = vehicle?.info?.fuel?.fuelLevel;
        const battery = vehicle?.info?.batteryFillLevel?.value;
        let level = fuel || battery || 100;
        if (level > 100) {
          level = 100;
        }
        if (level < 0) {
          level = 0;
        }
        callback(undefined, level);
        const status = await vehicle.status();
        if (status) {
          const fuel = status.fuel?.fuelLevel;
          const battery = status.batteryFillLevel?.value;
          const chargingStatus = vehicle?.info?.chargingStatus?.value;
          let level = fuel || battery || 100;
          if (level > 100) {
            level = 100;
          }
          if (level < 0) {
            level = 0;
          }
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

          if (level < 10) {
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
        } else {
          self.log.error(`Cannot get information for ${accessory.displayName} engine`);
        }
      });
    this.vehicles.push(vehicle);
    this.accessories.push(accessory);
  }

  async didFinishLaunching(): Promise<void> {
    const self = this;
    const ford = new Connection(this.config, this.log);
    const authInfo = await ford.auth();

    if (authInfo) {
      setInterval(async () => {
        self.log.debug('Reauthenticating with refresh token');
        await ford.refreshAuth();
      }, authInfo.expires_in * 1000 - 10000);

      await this.addVehicles(ford);
      await this.updateVehicles();
      await this.refreshVehicles();

      // Vehicle info needs to be updated every minute
      setInterval(async () => {
        await self.updateVehicles();
      }, 60 * 1000);
    }
  }

  async addVehicles(connection: Connection): Promise<void> {
    const vehicles = await connection.getVehicles();
    vehicles?.forEach(async (vehicle: VehicleConfig) => {
      vehicle.vin = vehicle.vin.toUpperCase();
      const name = vehicle.nickName || vehicle.vehicleType;
      const uuid = hap.uuid.generate(vehicle.vin);
      const accessory = new Accessory(name, uuid);
      accessory.context.name = name;
      accessory.context.vin = vehicle.vin;

      const accessoryInformation = accessory.getService(hap.Service.AccessoryInformation);
      if (accessoryInformation) {
        accessoryInformation.setCharacteristic(hap.Characteristic.Manufacturer, 'Ford');
        accessoryInformation.setCharacteristic(hap.Characteristic.Model, name);
        accessoryInformation.setCharacteristic(hap.Characteristic.SerialNumber, vehicle.vin);
      }

      // Only add new cameras that are not cached
      if (!this.accessories.find((x: PlatformAccessory) => x.UUID === uuid)) {
        this.log.debug(`New vehicle found: ${name}`);
        this.configureAccessory(accessory); // abusing the configureAccessory here
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    });

    // Remove vehicles that were removed from config
    this.accessories.forEach((accessory: PlatformAccessory<Record<string, string>>) => {
      if (!vehicles?.find((x: VehicleConfig) => x.vin === accessory.context.vin)) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        const index = this.accessories.indexOf(accessory);
        if (index > -1) {
          this.accessories.splice(index, 1);
          this.vehicles.slice(index, 1);
        }
      }
    });
  }

  async updateVehicles(): Promise<void> {
    this.vehicles.forEach(async (vehicle: Vehicle) => {
      const status = await vehicle.status();
      this.log.debug(`Updating info for ${vehicle.name}`);
      const lockStatus = status?.lockStatus.value;
      let lockNumber = hap.Characteristic.LockCurrentState.UNSECURED;
      if (lockStatus === 'LOCKED') {
        lockNumber = hap.Characteristic.LockCurrentState.SECURED;
      }

      const engineStatus = status?.remoteStartStatus.value || 0;
      let started = false;
      if (engineStatus > 0) {
        started = true;
      }
      const uuid = hap.uuid.generate(vehicle.vin);
      const accessory = this.accessories.find((x: PlatformAccessory) => x.UUID === uuid);

      if (accessory) {
        if (!this.pendingLockUpdate) {
          const lockService = accessory.getService(hap.Service.LockMechanism);
          lockService && lockService.updateCharacteristic(hap.Characteristic.LockCurrentState, lockNumber);
          lockService && lockService.updateCharacteristic(hap.Characteristic.LockTargetState, lockNumber);
        }
        const switchService = accessory.getService(hap.Service.Switch);
        switchService && switchService.updateCharacteristic(hap.Characteristic.On, started);

        if (
          this.config.options?.chargingSwitch &&
          status?.chargingStatus?.value === 'ChargingAC' &&
          !accessory.context.charge
        ) {
          const chargingService = accessory.getService(hap.Service.StatelessProgrammableSwitch);
          chargingService &&
            chargingService.updateCharacteristic(
              hap.Characteristic.ProgrammableSwitchEvent,
              hap.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
            );
          accessory.context.charge = true;
        } else if (accessory.context.charge) {
          accessory.context.charge = false;
        }
      }
    });
  }

  async refreshVehicles(): Promise<void> {
    this.vehicles.forEach(async (vehicle: Vehicle) => {
      if (vehicle.autoRefresh && vehicle.refreshRate && vehicle.refreshRate > 0) {
        this.log.debug(`Configuring ${vehicle.name} to refresh every ${vehicle.refreshRate} minutes.`);
        setInterval(async () => {
          this.log.debug(`Refreshing info for ${vehicle.name}`);
          await vehicle.issueCommand(Command.REFRESH);
        }, 60000 * vehicle.refreshRate);
      }
    });
  }
}

export = (api: API): void => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, FordPassPlatform);
};
