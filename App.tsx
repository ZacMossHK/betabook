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
import SvgContainer from "./src/components/SvgContainer";
import { Canvas, Line } from "@shopify/react-native-skia";
const testNodes = [
  { x: 0, y: 0 },
  { x: 298.0800895690918, y: 442.5572052001953 },
  { x: 312.2549133300781, y: 287.9411926269531 },
  { x: 231.86276245117188, y: 362.45098876953125 },
  { x: 192.64706420898438, y: 547.1568603515625 },
  { x: 249.9019775390625, y: 280.0980529785156 },
  { x: 134.21568298339844, y: 444.0196228027344 },
  { x: 272.2549133300781, y: 573.0392456054688 },
  { x: 224.41177368164062, y: 452.6470642089844 },
  { x: 103.62745666503906, y: 616.5686645507812 },
  { x: 174.833251953125, y: 254.36387634277344 },
  { x: 318.5294189453125, y: 387.9411926269531 },
  { x: 180.09803771972656, y: 242.45098876953125 },
  { x: 277.3529357910156, y: 188.72549438476562 },
  { x: 243.72695922851562, y: 696.9608154296875 },
  { x: 109.50981140136719, y: 560.8823852539062 },
  { x: 134.21568298339844, y: 444.0196228027344 },
  { x: 272.2549133300781, y: 573.0392456054688 },
  { x: 224.41177368164062, y: 452.6470642089844 },
  { x: 103.62745666503906, y: 616.5686645507812 },
  { x: 174.833251953125, y: 254.36387634277344 },
  { x: 318.5294189453125, y: 387.9411926269531 },
  { x: 180.09803771972656, y: 242.45098876953125 },
  { x: 277.3529357910156, y: 188.72549438476562 },
  { x: 243.72695922851562, y: 696.9608154296875 },
  { x: 109.50981140136719, y: 560.8823852539062 },
  { x: 298.0800895690918, y: 442.5572052001953 },
  { x: 312.2549133300781, y: 287.9411926269531 },
  { x: 231.86276245117188, y: 362.45098876953125 },
  { x: 192.64706420898438, y: 547.1568603515625 },
  { x: 249.9019775390625, y: 280.0980529785156 },
  { x: 134.21568298339844, y: 444.0196228027344 },
  { x: 272.2549133300781, y: 573.0392456054688 },
  { x: 224.41177368164062, y: 452.6470642089844 },
  { x: 103.62745666503906, y: 616.5686645507812 },
  { x: 174.833251953125, y: 254.36387634277344 },
  { x: 318.5294189453125, y: 387.9411926269531 },
  { x: 180.09803771972656, y: 242.45098876953125 },
  { x: 277.3529357910156, y: 188.72549438476562 },
  { x: 243.72695922851562, y: 696.9608154296875 },
  { x: 109.50981140136719, y: 560.8823852539062 },
];
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

  /* The first element should never be changed or read. 
  There must be already be a first element in the array as the first node in the array blinks in and out if it's deleted.
  I don't know why it does this. */
  // const [nodes, setNodes] = useState<Nodes>([{ x: 0, y: 0 }]);
  const [nodes, setNodes] = useState<Nodes>(testNodes);

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

  // const x = useDerivedValue(() => ({ x: pinchScale.value * 5, y: 100 }));

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
      {/* <Canvas style={{ flex: 1, width: 50, height: 50 }}>
        <Line
          p1={x}
          p2={{ x: 100, y: 0 }}
          color="black"
          style="stroke"
          strokeWidth={4}
        />
      </Canvas> */}
      <SvgContainer {...{pinchScale, baseScale}}/>
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
