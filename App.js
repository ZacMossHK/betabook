import { StyleSheet, View, Image, SafeAreaView, Text } from "react-native";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import theCuttingEdge from "./assets/IMG_20230716_184450.jpg";
import React, { useEffect, useState } from "react";
import Svg, { Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
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
    x: 172.5490264892578,
    y: 552.941162109375,
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
  },
];

const AnimatedLine = Animated.createAnimatedComponent(Line);

const Node = ({
  idx,
  setIsSelectingNode,
  setNodes,
  nodeAttributes,
  setIsPanEnabled,
  setSelectedNodeIdx,
  animatedStyles,
  selectedNodeIdx,
}) => {
  return (
    <Animated.View
      style={[
        {
          width: 50,
          height: 50,
          borderRadius: 50,
          borderColor: nodeAttributes.borderColor,
          borderWidth: 10,
          position: "absolute",
          top: nodeAttributes.y - 25,
          left: nodeAttributes.x - 25,
          zIndex: 2,
          backgroundColor: "white",
        },
        [idx === selectedNodeIdx && animatedStyles],
      ]}
    >
      <TouchableWithoutFeedback
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
        delayLongPress={650}
        onPressIn={() => {
          setSelectedNodeIdx(idx);
          setIsSelectingNode(true);
          setIsPanEnabled(true);
          setNodes((prevState) => {
            prevState[idx].borderColor = "red";
            return prevState;
          });
        }}
        onPress={() => {
          setIsSelectingNode(false);
          setNodes((prevState) => {
            prevState[idx].borderColor = "red";
            return prevState;
          });
        }}
        onLongPress={() => {
          setNodes((prevState) =>
            prevState.filter(
              (a) => !(a.x === nodeAttributes.x && a.y === nodeAttributes.y)
            )
          );
          setIsSelectingNode(false);
        }}
      >
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold" }}>
          {idx + 1}
        </Text>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default GestureDemo = () => {
  const [nodes, setNodes] = useState([]);
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

  useEffect(() => {
    line2Start.value = {
      x1: nodes[selectedNodeIdx]?.x,
      y1: nodes[selectedNodeIdx]?.y,
    };
    line1Start.value = {
      x2: nodes[selectedNodeIdx]?.x,
      y2: nodes[selectedNodeIdx]?.y,
    };
  }, [isSelectingNode]);
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: nodeOffset.value.x },
        { translateY: nodeOffset.value.y },
      ],
    };
  });

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
      if (!isSelectingNode) return;
      nodeOffset.value = {
        x: n.translationX + nodeStart.value.x,
        y: n.translationY + nodeStart.value.y,
      };
      line1Offset.value = {
        x2: n.translationX + line1Start.value.x2,
        y2: n.translationY + line1Start.value.y2,
      };
      line2Offset.value = {
        x1: n.translationX + line2Start.value.x1,
        y1: n.translationY + line2Start.value.y1,
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
    })
    .onFinalize(() => {
      nodeOffset.value = { x: 0, y: 0 };
      line1Offset.vaue = { x2: 0, y2: 0 };
      line2Offset.vaue = { x1: 0, y1: 0 };
    });

  const exclusive = Gesture.Exclusive(longPress, pan);

  const line1AnimatedProps = useAnimatedProps(() => ({
    x2: line1Offset.value.x2,
    y2: line1Offset.value.y2,
  }));
  const line2AnimatedProps = useAnimatedProps(() => ({
    x1: line2Offset.value.x1,
    y1: line2Offset.value.y1,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={exclusive}>
        <SafeAreaView style={{ flex: 1 }}>
          {nodes.map((nodeAttributes, idx) => (
            <Node
              key={idx}
              {...{
                animatedStyles,
                setNodes,
                setIsSelectingNode,
                nodeAttributes,
                idx,
                setIsPanEnabled,
                setSelectedNodeIdx,
                selectedNodeIdx,
              }}
            />
          ))}
          <Svg style={{ zIndex: 1 }}>
            {nodes.map((node, idx) => {
              if (idx === nodes.length - 1) return;
              if (isMovingNode && selectedNodeIdx === idx) {
                return (
                  <AnimatedLine
                    key={idx}
                    animatedProps={line2AnimatedProps}
                    stroke="black"
                    strokeWidth="4"
                    x2={nodes[idx + 1].x}
                    y2={nodes[idx + 1].y}
                  />
                );
              }
              if (isMovingNode && selectedNodeIdx === idx + 1) {
                return (
                  <AnimatedLine
                    key={idx}
                    animatedProps={line1AnimatedProps}
                    stroke="black"
                    strokeWidth="4"
                    x1={node.x}
                    y1={node.y}
                  />
                );
              }
              return (
                <AnimatedLine
                  key={idx}
                  stroke="black"
                  strokeWidth="4"
                  x1={node.x}
                  y1={node.y}
                  x2={nodes[idx + 1].x}
                  y2={nodes[idx + 1].y}
                />
              );
            })}
          </Svg>
          <Image
            source={theCuttingEdge}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "contain",
              position: "absolute",
              zIndex: 0,
            }}
          />
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

// export default function App() {
//   return (
//     <View style={styles.container}>
//       {/* <Text>ReactNativeZoomableView</Text> */}
//       {/* <View style={{ height: "100%", width: "100%" }}> */}
//       {/* <ReactNativeZoomableView
//           maxZoom={20}
//           minZoom={1}
//           bindToBorders={true}
//           disablePanOnInitialZoom={true}
//           // Give these to the zoomable view so it can apply the boundaries around the actual content.
//           // Need to make sure the content is actually centered and the width and height are
//           // dimensions when it's rendered naturally. Not the intrinsic size.
//           // For example, an image with an intrinsic size of 400x200 will be rendered as 300x150 in this case.
//           // Therefore, we'll feed the zoomable view the 300x150 size.
//           // contentWidth={100}
//           // contentHeight={400}
//         > */}
//       <GestureDemo />
//       {/* <Image
//             style={{ width: "100%", height: "100%", resizeMode: "contain" }}
//             source={theCuttingEdge}
//           /> */}
//       {/* <TouchLoggingComponent /> */}
//       {/* </ReactNativeZoomableView> */}
//       //{" "}
//     </View>
//     // </View>
//   );
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // padding: 20,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
