import { Image } from "react-native";
import cropImage from "../assets/IMG_20230716_184450_crop.jpg";
import { ImageProps } from "../src/components/ImageViewer/index.types";
const cropVertImageSource = Image.resolveAssetSource(cropImage);

const devCropVertImageProps: ImageProps = {
  uri: cropVertImageSource.uri,
  height: 917.6470947265625,
  width:
    917.6470947265625 *
    (cropVertImageSource.width / cropVertImageSource.height),
};

const devImageProps: ImageProps = {
  uri: "http://192.168.1.180:8081/assets/?unstable_path=.%2Fassets%2FIMG_20230716_184450.jpg&platform=android&hash=8d7019156a3445ca930a5beca95adb2a",
  height: 564.7058905153186,
  width: 423.5294189453125,
};

const getDevImageProps = () =>
  process.env.EXPO_PUBLIC_DEV_IMG === "crop"
    ? devCropVertImageProps
    : devImageProps;

export default getDevImageProps;
