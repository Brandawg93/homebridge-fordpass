interface Target {
  $id: string;
  warning: number;
  DoorStatuses: any;
}

export interface CommandStatus {
  id: string;
  target: Target;
  type: string;
  currentStatus: string;
  previousStatus: string;
  statusReason: string;
  createTime: string;
  updateTime: string;
  expireTime: string;
  metrics: any;
  wakeUp: boolean;
}
