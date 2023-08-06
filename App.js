import { View, SafeAreaView } from "react-native";
import theCuttingEdge from "./assets/IMG_20230716_184450.jpg";
import React, { useEffect, useState } from "react";
import Svg from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedRef,
  useDerivedValue,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import MoveNodeLine from "./src/components/MoveNodeLine";
import MoveNode from "./src/components/MoveNode";

const exampleImages = [
  {
    absoluteX: 172.5490264892578,
    absoluteY: 523.5294189453125,
    duration: 301,
    handlerTag: 1,
    numberOfPointers: 1,
    oldState: 2,
    state: 4,
    x: 40,
    y: 40,
    scale: 1,
  },
  {
    absoluteX: 261.9607849121094,
    absoluteY: 376.4705810546875,
    duration: 301,
    handlerTag: 1,
    numberOfPointers: 1,
    oldState: 2,
    state: 4,
    x: 261.9607849121094,
    y: 405.8823547363281,
    scale: 1,
  },
  {
    absoluteX: 261.9607849121094,
    absoluteY: 376.4705810546875,
    duration: 301,
    handlerTag: 1,
    numberOfPointers: 1,
    oldState: 2,
    state: 4,
    x: 200.9607849121094,
    y: 300.8823547363281,
    scale: 1,
  },
];

const initialHeight = 917.6470947265625;
const initialWidth = 423.5294189453125;

export default App = () => {
  const [nodes, setNodes] = useState([]);
  const [isSelectingNode, setIsSelectingNode] = useState(false);
  const [isPanEnabled, setIsPanEnabled] = useState(false);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(0);
  const [isMovingNode, setIsMovingNode] = useState(false);
  const [imageHeight, setImageHeight] = useState(0);
  const nodeOffset = useSharedValue({ x: 0, y: 0 });
  const nodeStart = useSharedValue({ x: 0, y: 0 });
  const line1Offset = useSharedValue({ x2: 0, y2: 0 });
  const line1Start = useSharedValue({ x2: 0, y2: 0 });
  const line2Offset = useSharedValue({ x1: 0, y1: 0 });
  const line2Start = useSharedValue({ x1: 0, y1: 0 });
  const animatedImage = useAnimatedRef();
  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const scale = useDerivedValue(() => baseScale.value * pinchScale.value);
  const translateTop = useDerivedValue(
    () => -1 * ((initialHeight * scale.value - initialHeight) / 2 || 0)
  );
  const translateLeft = useDerivedValue(
    () => -1 * ((initialWidth * scale.value - initialWidth) / 2 || 0)
  );

  useEffect(() => {
    "worklet";
    line2Start.value = {
      x1: nodes[selectedNodeIdx]?.x,
      y1: nodes[selectedNodeIdx]?.y,
    };
    line1Start.value = {
      x2: nodes[selectedNodeIdx]?.x,
      y2: nodes[selectedNodeIdx]?.y,
    };
    if (isSelectingNode) return;
    nodeOffset.value = { x: 0, y: 0 };
    line1Offset.value = { x2: 0, y2: 0 };
    line2Offset.value = { x1: 0, y1: 0 };
  }, [isSelectingNode]);

  const pinchToZoomAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getScaledPosition = (xyValue, initialSize, scale) =>
    (xyValue - initialSize / 2) / scale.value + initialSize / 2;

  const applyImage = (n) => {
    const yMargin = (initialHeight - imageHeight * scale.value) / 2;
    if (n.y / scale.value < yMargin || n.y > initialHeight - yMargin) return;
    n.borderColor = "black";

    // get offset distance from centre
    // x - width / 2
    // divide by scale because the distance from the centre gets smaller as the scale gets bigger
    // offsetDistance / scale.value
    // add bottom half
    // value + width / 2

    n.x = getScaledPosition(n.x, initialWidth, scale);
    n.y = getScaledPosition(n.y, initialHeight, scale);
    setNodes((prevState) => [...prevState, n]);
  };

  const longPress = Gesture.LongPress()
    .enabled(!isSelectingNode)
    .runOnJS(true)
    .minDuration(300)
    .onStart(applyImage)
    .onEnd(() => setIsSelectingNode(false));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart((n) => {
      if (!isSelectingNode) return;
      setIsMovingNode(true);
    })
    .onUpdate((n) => {
      "worklet";
      if (!isSelectingNode) return;
      const yMargin = (initialHeight - imageHeight) / 2;
      let nodeTranslationY = n.translationY + nodeStart.value.y;
      const yPosition = getScaledPosition(n.y, initialHeight, scale);
      if (yPosition < yMargin) {
        nodeTranslationY = (yMargin - nodes[selectedNodeIdx].y) * scale.value;
      }
      if (yPosition > initialHeight - yMargin) {
        nodeTranslationY =
          (initialHeight - yMargin - nodes[selectedNodeIdx].y) * scale.value;
      }
      nodeOffset.value = {
        x: n.translationX + nodeStart.value.x,
        y: nodeTranslationY,
      };
      line1Offset.value = {
        x2:
          n.translationX +
          line1Start.value.x2 * scale.value +
          translateLeft.value,
        y2:
          n.translationY +
          line1Start.value.y2 * scale.value +
          translateTop.value,
      };
      line2Offset.value = {
        x1:
          n.translationX +
          line2Start.value.x1 * scale.value +
          translateLeft.value,
        y1:
          n.translationY +
          line2Start.value.y1 * scale.value +
          translateTop.value,
      };
    })
    .onEnd(() => {
      if (!isSelectingNode) return;
      setNodes((prevState) => {
        prevState[selectedNodeIdx].borderColor = "black";
        prevState[selectedNodeIdx].x += nodeOffset.value.x / scale.value;
        prevState[selectedNodeIdx].y += nodeOffset.value.y / scale.value;
        return prevState;
      });
      setIsMovingNode(false);
      setIsSelectingNode(false);
    });

  const pinch = Gesture.Pinch()
    .enabled(!isSelectingNode)
    .onStart(() => {
      "worklet";
    })
    .onUpdate((n) => {
      "worklet";
      if (n.scale * baseScale.value <= 1) {
        pinchScale.value = 1;
        baseScale.value = 1;
        return;
      }
      if (n.scale * baseScale.value >= 5) {
        pinchScale.value = 1;
        baseScale.value = 5;
        return;
      }
      pinchScale.value = n.scale;
    })
    .onFinalize((n) => {
      "worklet";
      if (n.scale * baseScale.value <= 1) {
        pinchScale.value = 1;
        baseScale.value = 1;
        return;
      }
      if (n.scale * baseScale.value >= 5) {
        pinchScale.value = 1;
        baseScale.value = 5;
        return;
      }
      baseScale.value *= n.scale;
      pinchScale.value = 1;
    });

  const exclusive = Gesture.Exclusive(longPress, pinch, pan);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector style={{ flex: 1 }} gesture={exclusive}>
        {/* <SafeAreaView style={{ flex: 1 }}> */}
        <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
          <View
            style={{
              zIndex: 1,
            }}
          >
            {nodes.map((nodeAttributes, idx) => (
              <MoveNode
                key={idx}
                {...{
                  setNodes,
                  setIsSelectingNode,
                  nodeAttributes,
                  idx,
                  setIsPanEnabled,
                  setSelectedNodeIdx,
                  selectedNodeIdx,
                  scale,
                  nodeOffset,
                  translateTop,
                  translateLeft,
                }}
              />
            ))}
            <Svg style={{ zIndex: 1 }}>
              {nodes.map((node, idx) => {
                if (idx === nodes.length - 1) return;
                return (
                  <MoveNodeLine
                    key={idx}
                    {...{
                      translateLeft,
                      translateTop,
                      node,
                      scale,
                      nodes,
                      idx,
                      isMovingNode,
                      selectedNodeIdx,
                      line1Offset,
                      line2Offset,
                    }}
                  />
                );
              })}
            </Svg>
          </View>
          <Animated.Image
            ref={animatedImage}
            source={theCuttingEdge}
            style={[
              {
                // width: "100%",
                // height: "100%",
                width: initialWidth,
                height: imageHeight,
                resizeMode: "contain",
                position: "absolute",
                zIndex: 0,
              },
              pinchToZoomAnimatedStyle,
            ]}
            onLoad={(image) => {
              if (
                image.nativeEvent.source.height > image.nativeEvent.source.width
              ) {
                const proportion =
                  image.nativeEvent.source.height /
                  image.nativeEvent.source.width;
                setImageHeight(initialWidth * proportion);
              }
            }}
          />
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
