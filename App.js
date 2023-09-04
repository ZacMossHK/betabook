import { View, SafeAreaView } from "react-native";
import theCuttingEdge from "./assets/IMG_20230716_184450.jpg";
import React, { useEffect, useState } from "react";
import Svg from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedRef,
  useDerivedValue,
  max,
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
  const [imageWidth, setImageWidth] = useState(0);
  const nodeOffset = useSharedValue({ x: 0, y: 0 });
  const nodeStart = useSharedValue({ x: 0, y: 0 });
  const line1Node = useSharedValue({ x2: 0, y2: 0 });
  const line1Start = useSharedValue({ x2: 0, y2: 0 });
  const line2Node = useSharedValue({ x1: 0, y1: 0 });
  const line2Start = useSharedValue({ x1: 0, y1: 0 });
  const animatedImage = useAnimatedRef();
  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const panOffsetTranslationX = useSharedValue(0);
  const panOffsetTranslationY = useSharedValue(0);
  const panOffsetPositionX = useSharedValue(0);
  const panOffsetPositionY = useSharedValue(0);
  const pinchFocalPointStartX = useSharedValue(0);
  const pinchFocalPointStartY = useSharedValue(0);
  const isPanning = useSharedValue(false);

  const scale = useDerivedValue(() => baseScale.value * pinchScale.value);
  const translateTop = useDerivedValue(
    () => -1 * ((initialHeight * scale.value - initialHeight) / 2 || 0)
  );
  const translateLeft = useDerivedValue(
    () => -1 * ((initialWidth * scale.value - initialWidth) / 2 || 0)
  );

  const panOffset = useDerivedValue(() => {
    let x = panOffsetPositionX.value + panOffsetTranslationX.value;
    let y = panOffsetPositionY.value + panOffsetTranslationY.value;
    const widthMaxOffset = (imageWidth * scale.value - imageWidth) / 2;
    if (x > widthMaxOffset) x = widthMaxOffset;
    if (x < -widthMaxOffset) x = -widthMaxOffset;
    const maxHeightOffset = (imageHeight * scale.value - imageHeight) / 2;
    if (y > maxHeightOffset) y = maxHeightOffset;
    if (y < -maxHeightOffset) y = -maxHeightOffset;
    return {
      x,
      y,
    };
  });

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
    line1Node.value = { x2: 0, y2: 0 };
    line2Node.value = { x1: 0, y1: 0 };
  }, [isSelectingNode]);

  const pinchToZoomAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
        {
          translateX: panOffset.value.x / scale.value,
        },
        {
          translateY: panOffset.value.y / scale.value,
        },
      ],
    };
  });

  // get offset distance from centre
  // x - width / 2
  // divide by scale because the distance from the centre gets smaller as the scale gets bigger
  // offsetDistance / scale.value
  // add bottom half
  // value + width / 2
  const getScaledPosition = (xyValue, initialSize, scale) =>
    (xyValue - initialSize / 2) / scale.value + initialSize / 2;

  const applyImage = (n) => {
    const yMargin = (initialHeight - imageHeight * scale.value) / 2;
    if (n.y / scale.value < yMargin || n.y > initialHeight - yMargin) return;
    n.borderColor = "black";
    n.x = getScaledPosition(n.x - panOffset.value.x, initialWidth, scale);
    n.y = getScaledPosition(n.y - panOffset.value.y, initialHeight, scale);
    setNodes((prevState) => [...prevState, n]);
  };

  const longPress = Gesture.LongPress()
    .enabled(!isSelectingNode)
    .runOnJS(true)
    .minDuration(300)
    .onStart(applyImage)
    .onEnd(() => setIsSelectingNode(false));

  const panImage = Gesture.Pan()
    .enabled(!isSelectingNode)
    .onStart(() => {
      "worklet";
      panOffsetTranslationX.value = 0;
      panOffsetTranslationY.value = 0;
    })
    .onUpdate((n) => {
      "worklet";
      panOffsetTranslationX.value = n.translationX;
      panOffsetTranslationY.value = n.translationY;
    })
    .onEnd(() => {
      panOffsetPositionX.value += panOffsetTranslationX.value;
      panOffsetPositionY.value += panOffsetTranslationY.value;
      panOffsetTranslationX.value = 0;
      panOffsetTranslationY.value = 0;
    });

  const moveNode = Gesture.Pan()
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
      let line1y2 =
        n.translationY + line1Start.value.y2 * scale.value + translateTop.value;
      let line2y1 =
        n.translationY + line2Start.value.y1 * scale.value + translateTop.value;
      const yPosition = getScaledPosition(n.y, initialHeight, scale);
      if (yPosition < yMargin) {
        nodeTranslationY = (yMargin - nodes[selectedNodeIdx].y) * scale.value;
        line1y2 = line2y1 = yMargin * scale.value + translateTop.value;
      }
      if (yPosition > initialHeight - yMargin) {
        nodeTranslationY =
          (initialHeight - yMargin - nodes[selectedNodeIdx].y) * scale.value;
        line1y2 = line2y1 =
          (initialHeight - yMargin) * scale.value + translateTop.value;
      }
      nodeOffset.value = {
        x: n.translationX + nodeStart.value.x,
        y: nodeTranslationY,
      };
      line1Node.value = {
        x2:
          n.translationX +
          line1Start.value.x2 * scale.value +
          translateLeft.value,
        y2: line1y2,
      };
      line2Node.value = {
        x1:
          n.translationX +
          line2Start.value.x1 * scale.value +
          translateLeft.value,
        y1: line2y1,
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
    .onEnd((n) => {
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector
        style={{ flex: 1 }}
        gesture={Gesture.Simultaneous(pinch, panImage, longPress, moveNode)}
      >
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
                  isMovingNode,
                  panOffset,
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
                      line1Node,
                      line2Node,
                      panOffset,
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
                setImageWidth(initialWidth);
              }
            }}
          />
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
