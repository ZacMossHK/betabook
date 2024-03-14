import { Matrix3, identity3, multiply3 } from "react-native-redash";
import { Coordinates } from "../../components/ImageViewer/index.types";
import { SharedValue } from "react-native-reanimated";

export const translateMatrix = (
  matrix: Matrix3,
  x: number,
  y: number
): Matrix3 => {
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

export const getMatrix = (
  translation: Coordinates,
  origin: Coordinates,
  pinchScale: number,
  transform: Matrix3
): Matrix3 => {
  "worklet";
  let matrix = identity3;
  if (translation.x !== 0 || translation.y !== 0) {
    matrix = translateMatrix(matrix, translation.x, translation.y);
  }
  if (pinchScale !== 1) {
    matrix = translateAndScaleMatrix(matrix, origin, pinchScale);
  }
  return multiply3(matrix, transform);
};
