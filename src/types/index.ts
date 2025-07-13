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

export interface Store {
  id: string;
  name: string;
  positionX: number;
  positionY: number;
  sizeX: number;
  sizeY: number;
  hasCoupon?: boolean;
  coupon_title?: string;
  coupon_per?: string;
}