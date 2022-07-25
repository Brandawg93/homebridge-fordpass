import { PlatformAccessory, Service, WithUUID } from 'homebridge';

type ServiceType = WithUUID<typeof Service>;

export class FordpassAccessory {
  private accessory: PlatformAccessory;

  constructor(accessory: PlatformAccessory) {
    this.accessory = accessory;
  }

  createService(serviceType: ServiceType, name?: string): Service {
    const existingService = name
      ? this.accessory.getServiceById(serviceType, `${this.accessory.displayName} ${name}`)
      : this.accessory.getService(serviceType);

    const service =
      existingService ||
      (name
        ? this.accessory.addService(
            serviceType,
            `${this.accessory.displayName} ${name}`,
            `${this.accessory.displayName} ${name}`,
          )
        : this.accessory.addService(serviceType, this.accessory.displayName));
    return service;
  }

  findService(serviceType: ServiceType, name?: string): Service | undefined {
    return name
      ? this.accessory.getServiceById(serviceType, `${this.accessory.displayName} ${name}`)
      : this.accessory.getService(serviceType);
  }

  getServicesByType(serviceType: ServiceType): Array<Service> {
    return this.accessory.services.filter((x) => x.UUID === serviceType.UUID);
  }

  removeService(serviceType: ServiceType, name?: string): void {
    const existingService = name
      ? this.accessory.getServiceById(serviceType, `${this.accessory.displayName} ${name}`)
      : this.accessory.getService(serviceType);

    if (existingService) {
      this.accessory.removeService(existingService);
    }
  }
}
