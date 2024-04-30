import Animated, {
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { Coordinates, Nodes } from "./index.types";
import { identity3 } from "react-native-redash";
import populateNodes from "../../../devData/populateNodes";
import { useEffect, useState } from "react";
import { getMatrix } from "../../helpers/matrixTransformers/utils";
import MovementNodeContainer from "../MovementNodeContainer";
import ImageContainer from "../ImageContainer";

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
        }}
      />
    </Animated.View>
  );
};

export default ImageViewer;
