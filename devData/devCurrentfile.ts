import { randomUUID } from "expo-crypto";
import getDevImageProps from "./getDevImageProps";
import populateNodes from "./populateNodes";

const devCurrentFile = () => ({
  fileId: randomUUID(),
  fileName: "devFile",
  imageProps: getDevImageProps(),
  nodes: populateNodes(),
});

export default devCurrentFile;
