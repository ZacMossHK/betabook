import { Climb } from "../../../app/";
import {
  Coordinates,
  ImageProps,
  Node,
  Nodes,
  SizeDimensions,
} from "../../components/ImageViewer/index.types";

const hasString = (value: unknown): value is string =>
  typeof value === "string";

const hasNumber = (value: unknown): value is number =>
  typeof value === "number";

const hasStringOrNull = (value: unknown): value is string | null =>
  hasString(value) || value === null;

const isSizeDimensions = (obj: unknown): obj is SizeDimensions =>
  typeof obj === "object" &&
  obj !== null &&
  hasNumber((obj as SizeDimensions).width) &&
  hasNumber((obj as SizeDimensions).height);

const isImageProps = (obj: unknown): obj is ImageProps =>
  isSizeDimensions(obj) && hasString((obj as ImageProps).uri);

const isCoordinates = (obj: unknown): obj is Coordinates =>
  typeof obj === "object" &&
  obj !== null &&
  hasNumber((obj as Coordinates).x) &&
  hasNumber((obj as Coordinates).y);

const isNode = (obj: unknown): obj is Node =>
  isCoordinates(obj) && hasString((obj as Node).note);

const isNodes = (obj: unknown): obj is Nodes =>
  Array.isArray(obj) && obj.every(isNode);

export const isClimb = (obj: unknown): obj is Climb => {
  if (typeof obj !== "object" || obj === null) return false;

  const climb = obj as Climb;

  return (
    hasString(climb.id) &&
    hasStringOrNull(climb.name) &&
    isImageProps(climb.imageProps) &&
    isNodes(climb.nodes)
  );
};
