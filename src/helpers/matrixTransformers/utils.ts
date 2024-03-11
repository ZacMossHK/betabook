import { Matrix3, multiply3 } from "react-native-redash";
import { Coordinates } from "../../components/ImageViewer/index.types";

export const translateMatrix = (matrix: Matrix3, x: number, y: number): Matrix3 => {
  "worklet";
  return multiply3(matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
};

export const scaleMatrix = (matrix: Matrix3, value: number): Matrix3 => {
  "worklet";
  return multiply3(matrix, [value, 0, 0, 0, value, 0, 0, 0, 1]);
};

export const translateAndScaleMatrix = (
  matrix: Matrix3,
  origin: Coordinates,
  pinchScale: number
): Matrix3 => {
  "worklet";
  matrix = translateMatrix(matrix, origin.x, origin.y);
  matrix = scaleMatrix(matrix, pinchScale);
  return translateMatrix(matrix, -origin.x, -origin.y);
};