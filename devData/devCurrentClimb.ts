import { randomUUID } from "expo-crypto";
import getDevImageProps from "./getDevImageProps";
import populateNodes from "./populateNodes";

const devCurrentClimb = () => ({
  id: randomUUID(),
  name: "devFile",
  imageProps: getDevImageProps(),
  nodes: populateNodes(),
});

export default devCurrentClimb;
