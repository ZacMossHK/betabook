import { StyleSheet, View, Image, SafeAreaView, Text } from "react-native";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import theCuttingEdge from "./assets/IMG_20230716_184450.jpg";
import React, { useEffect, useState } from "react";
import Svg, { Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedRef,
  measure,
  runOnUI,
  useDerivedValue,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import MoveNodeLine from "./src/components/MoveNodeLine";
import MoveNode from "./src/components/MoveNode";
const { width, height } = Image.resolveAssetSource(theCuttingEdge);
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

// const AnimatedLine = Animated.createAnimatedComponent(Line);

// const Node = ({
//   idx,
//   setIsSelectingNode,
//   setNodes,
//   nodeAttributes,
//   setIsPanEnabled,
//   setSelectedNodeIdx,
//   selectedNodeIdx,
//   scale,
//   nodeOffset,
//   translateTop,
//   translateLeft,
// }) => {
//   const animatedStyle = useAnimatedStyle(() => ({
//     top: translateTop.value + nodeAttributes.y * scale.value - 25,
//     left: translateLeft.value + nodeAttributes.x * scale.value - 25,
//   }));
//   const animatedStyleWithTransform = useAnimatedStyle(() => ({
//     top: translateTop.value + nodeAttributes.y * scale.value - 25,
//     left: translateLeft.value + nodeAttributes.x * scale.value - 25,
//     transform: [
//       { translateX: nodeOffset.value.x },
//       { translateY: nodeOffset.value.y },
//     ],
//   }));

//   return (
//     <Animated.View
//       style={[
//         {
//           width: 50,
//           height: 50,
//           borderRadius: 50,
//           borderColor: nodeAttributes.borderColor,
//           borderWidth: 10,
//           position: "absolute",
//           top: nodeAttributes.y - 25,
//           left: nodeAttributes.x - 25,
//           zIndex: 2,
//           backgroundColor: "white",
//         },
//         idx === selectedNodeIdx ? animatedStyleWithTransform : animatedStyle,
//       ]}
//     >
//       <TouchableWithoutFeedback
//         style={{
//           width: "100%",
//           height: "100%",
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//         delayLongPress={650}
//         onPressIn={() => {
//           setSelectedNodeIdx(idx);
//           setIsSelectingNode(true);
//           setIsPanEnabled(true);
//           setNodes((prevState) => {
//             prevState[idx].borderColor = "red";
//             return prevState;
//           });
//         }}
//         onPress={() => {
//           setIsSelectingNode(false);
//           setNodes((prevState) => {
//             prevState[idx].borderColor = "red";
//             return prevState;
//           });
//         }}
//         onLongPress={() => {
//           setNodes((prevState) =>
//             prevState.filter(
//               (a) => !(a.x === nodeAttributes.x && a.y === nodeAttributes.y)
//             )
//           );
//           setIsSelectingNode(false);
//         }}
//       >
//         <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold" }}>
//           {idx + 1}
//         </Text>
//       </TouchableWithoutFeedback>
//     </Animated.View>
//   );
// };

export default GestureDemo = () => {
  const [nodes, setNodes] = useState(exampleImages);
  const [isSelectingNode, setIsSelectingNode] = useState(false);
  const [isPanEnabled, setIsPanEnabled] = useState(false);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(0);
  const [isMovingNode, setIsMovingNode] = useState(false);
  const nodeOffset = useSharedValue({ x: 0, y: 0 });
  const nodeStart = useSharedValue({ x: 0, y: 0 });
  const line1Offset = useSharedValue({ x2: 0, y2: 0 });
  const line1Start = useSharedValue({ x2: 0, y2: 0 });
  const line2Offset = useSharedValue({ x1: 0, y1: 0 });
  const line2Start = useSharedValue({ x1: 0, y1: 0 });
  const animatedImage = useAnimatedRef();
  const initialHeight = useSharedValue(0);
  const initialWidth = useSharedValue(0);
  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const scale = useDerivedValue(() => baseScale.value * pinchScale.value);
  const translateTop = useDerivedValue(
    () => -1 * ((976.86279296875 * scale.value - 976.86279296875) / 2 || 0)
  );
  const translateLeft = useDerivedValue(
    () => -1 * ((423.5294189453125 * scale.value - 423.5294189453125) / 2 || 0)
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

  // const lineAnimatedProps = useAnimatedProps(() => ({
  //   x1: translateLeft.value + node.x * scale.value,
  //   y1: translateTop.value + node.y * scale.value,
  //   x2: translateLeft.value + nodes[idx + 1].x * scale.value,
  //   y2: translateTop.value + nodes[idx + 1].y * scale.value,
  // }));

  // const line1AnimatedProps = useAnimatedProps(() => ({
  //   x2: line1Offset.value.x2,
  //   y2: line1Offset.value.y2,
  // }));

  // const line2AnimatedProps = useAnimatedProps(() => ({
  //   x1: line2Offset.value.x1,
  //   y1: line2Offset.value.y1,
  // }));

  const applyImage = (n) => {
    n.borderColor = "black";
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
    .onStart(() => {
      if (!isSelectingNode) return;
      setIsMovingNode(true);
    })
    .onUpdate((n) => {
      "worklet";
      if (!isSelectingNode) return;
      nodeOffset.value = {
        x: n.translationX + nodeStart.value.x,
        y: n.translationY + nodeStart.value.y,
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
        prevState[selectedNodeIdx].x += nodeOffset.value.x;
        prevState[selectedNodeIdx].y += nodeOffset.value.y;
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
      // const { height, width } = measure(animatedImage);
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
        <SafeAreaView style={{ flex: 1 }}>
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
                // if (isMovingNode && selectedNodeIdx === idx) {
                //   return (
                //     <AnimatedLine
                //       key={idx}
                //       lineAnimatedProps={line2AnimatedProps}
                //       stroke="black"
                //       strokeWidth="4"
                //       x2={nodes[idx + 1].x * scale.value}
                //       y2={nodes[idx + 1].y * scale.value}
                //     />
                //   );
                // }
                // if (isMovingNode && selectedNodeIdx === idx + 1) {
                //   return (
                //     <AnimatedLine
                //       key={idx}
                //       animatedProps={line1AnimatedProps}
                //       stroke="black"
                //       strokeWidth="4"
                //       x1={node.x * scale.value}
                //       y1={node.y * scale.value}
                //     />
                //   );
                // }

                // return (
                //   <AnimatedLine
                //     animatedProps={lineAnimatedProps}
                //     key={idx}
                //     stroke="black"
                //     strokeWidth="4"
                //     x1={translateLeft.value + node.x * scale.value}
                //     y1={translateTop.value + node.y * scale.value}
                //     x2={translateLeft.value + nodes[idx + 1].x * scale.value}
                //     y2={translateTop.value + nodes[idx + 1].y * scale.value}
                //   />
                // );
              })}
            </Svg>
          </View>
          <Animated.Image
            ref={animatedImage}
            source={theCuttingEdge}
            style={[
              {
                width: "100%",
                height: "100%",
                resizeMode: "contain",
                position: "absolute",
                zIndex: 0,
              },
              pinchToZoomAnimatedStyle,
            ]}
            onLayout={(e) => {
              runOnUI(() => {
                initialHeight.value = e.nativeEvent.height;
                initialWidth.value = e.nativeEvent.width;
              })();
            }}
          />
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // alignItems: "center",
    // justifyContent: "center",
    // padding: 20,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
