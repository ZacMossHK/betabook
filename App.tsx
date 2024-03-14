// forked from https://github.com/software-mansion/react-native-gesture-handler/issues/2138#issuecomment-1231634779

import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedRef,
  useDerivedValue,
} from "react-native-reanimated";
import { identity3 } from "react-native-redash";
import MovementNodeContainer from "./src/components/MovementNodeContainer";
import { Coordinates, Nodes } from "./src/components/ImageViewer/index.types";
import { getMatrix } from "./src/helpers/matrixTransformers/utils";
import ImageContainer from "./src/components/ImageContainer";

const ImageViewer = () => {
  const ref = useAnimatedRef();

  const origin = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const transform = useSharedValue(identity3);
  const pinchScale = useSharedValue(1);
  const translation = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const maxDistance = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const isViewRendered = useSharedValue(false);
  const selectedNodeIndex = useSharedValue<number | null>(null);
  const selectedNodePosition = useSharedValue<Coordinates | null>(null);
  const isSelectingNode = useSharedValue(false);
  const isTranslatingNode = useSharedValue(false);

  /* The first element should never be changed or read. 
  There must be already be a first element in the array as the first node in the array blinks in and out if it's deleted.
  I don't know why it does this. */
  const [nodes, setNodes] = useState<Nodes>([{ x: 0, y: 0 }]);

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
        }}
      />
      <ImageContainer
        {...{
          innerRef: ref,
          isViewRendered,
          translation,
          pinchScale,
          transform,
          maxDistance,
          imageMatrix,
          origin,
          setNodes,
          nodes,
        }}
      />
      {/* <SvgContainer /> */}
    </Animated.View>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "red" }}>
        <ImageViewer />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
