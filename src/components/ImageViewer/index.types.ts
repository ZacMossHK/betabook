export interface Coordinates {
  x: number;
  y: number;
}

export type TransformableMatrix3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export type Nodes = Coordinates[];

export interface ImageProps {
  uri: string;
  height: number;
  width: number;
}
