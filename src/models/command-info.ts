interface EventData {
  $id: string;
  warning: number;
  DoorStatuses: any;
}

export interface CommandStatus {
  $id: string;
  eventData: EventData;
  errorDetailCode: any;
  status: number;
  version: string;
}
