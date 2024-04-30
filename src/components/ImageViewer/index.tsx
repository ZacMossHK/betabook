import Animated, {
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { Coordinates, ImageProps, Nodes } from "./index.types";
import { identity3 } from "react-native-redash";
import populateNodes from "../../../devData/populateNodes";
import { useEffect, useState } from "react";
import { getMatrix } from "../../helpers/matrixTransformers/utils";
import MovementNodeContainer from "../MovementNodeContainer";
import ImageContainer from "../ImageContainer";
import { Button, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

const populatedNodes = populateNodes(
  process.env.EXPO_PUBLIC_NODES_NUM
    ? parseInt(process.env.EXPO_PUBLIC_NODES_NUM)
    : 0
);

const ImageViewer = () => {
  const ref = useAnimatedRef();

  const origin = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const transform = useSharedValue(identity3);
  const pinchScale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translation = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const maxDistance = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const isViewRendered = useSharedValue(false);
  const selectedNodeIndex = useSharedValue<number | null>(null);
  const selectedNodePosition = useSharedValue<Coordinates | null>(null);
  const isSelectingNode = useSharedValue(false);
  const isTranslatingNode = useSharedValue(false);

  const [nodes, setNodes] = useState<Nodes>(populatedNodes);
  const [imageProps, setImageProps] = useState<ImageProps | null>(
    process.env.EXPO_PUBLIC_DEV_IMG
      ? {
          uri: "http://192.168.1.180:8081/assets/?unstable_path=.%2Fassets%2FIMG_20230716_184450.jpg&platform=android&hash=8d7019156a3445ca930a5beca95adb2a",
          height: 564.7058905153186,
          width: 423.5294189453125,
        }
      : null
  );

  useEffect(() => {
    selectedNodePosition.value = null;
    selectedNodeIndex.value = null;
    isSelectingNode.value = false;
  }, [nodes]);

  const imageMatrix = useDerivedValue(() =>
    getMatrix(
      translation.value,
      origin.value,
      pinchScale.value,
      transform.value
    )
  );

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });

    if (!result.canceled) {
      const { uri, height, width } = result.assets[0];
      setImageProps({ uri, height, width });
    }
  };

  if (!imageProps)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Button onPress={pickImage} title={"choose your image"} />
      </View>
    );

  return (
    <Animated.View collapsable={false} style={{ flex: 1 }}>
      <MovementNodeContainer
        {...{
          selectedNodeIndex,
          selectedNodePosition,
          nodes,
          setNodes,
          imageMatrix,
          isViewRendered,
          innerRef: ref,
          maxDistance,
          isSelectingNode,
          isTranslatingNode,
          baseScale,
          pinchScale,
          imageProps,
        }}
      />
      <ImageContainer
        {...{
          innerRef: ref,
          isViewRendered,
          translation,
          pinchScale,
          baseScale,
          transform,
          maxDistance,
          imageMatrix,
          origin,
          setNodes,
          nodes,
          imageProps,
        }}
      />
    </Animated.View>
  );
};

export default ImageViewer;
