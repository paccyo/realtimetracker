
export interface Point {
  latitude: number;
  longitude: number;
  timestamp: string;
  isDummy?: boolean;
}

export interface DevicePoints {
  [pointId: string]: Point;
}

export interface Device {
  points: DevicePoints;
}

export interface DeviceData {
  [deviceId: string]: Device;
}
