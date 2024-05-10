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

export interface Node extends Coordinates {
  note: string;
}

export type Nodes = Node[];

export interface SizeDimensions {
  width: number;
  height: number;
}
export interface ImageProps extends SizeDimensions {
  uri: string;
}
