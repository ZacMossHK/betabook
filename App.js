import { StyleSheet, View, Image, SafeAreaView, Text } from "react-native";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import theCuttingEdge from "./assets/IMG_20230716_184450.jpg";
import React, { useState } from "react";
import Svg, { Line } from "react-native-svg";

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
];

const Node = ({ idx, setDeletingNode, setNodes, nodeAttributes }) => {
  return (
    <View
      style={{
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
      }}
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
          setDeletingNode(true);
          setNodes((prevState) => {
            prevState[idx].borderColor =
              prevState[idx].borderColor === "black" ? "red" : "black";
            return prevState;
          });
        }}
        onPress={() => {
          setDeletingNode(false);
        }}
        onLongPress={() => {
          setNodes((prevState) =>
            prevState.filter(
              (a) => !(a.x === nodeAttributes.x && a.y === nodeAttributes.y)
            )
          );
          setDeletingNode(false);
        }}
      >
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold" }}>
          {idx + 1}
        </Text>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default GestureDemo = () => {
  const [nodes, setNodes] = useState([]);
  const [deletingNode, setDeletingNode] = useState(false);

  const applyImage = (n) => {
    console.log(n.x, n.y);
    n.borderColor = "black";
    setNodes((prevState) => [...prevState, n]);
  };

  const touch = Gesture.Tap().onStart(applyImage);
  const longPress = Gesture.LongPress()
    .enabled(!deletingNode)
    .minDuration(300)
    .onStart(applyImage)
    .onEnd(() => setDeletingNode(false));
  const pan = Gesture.Pan().onUpdate((n) => console.log(n.x, n.y));
  const longerPress = Gesture.LongPress()
    .minDuration(5000)
    .onStart(() => console.log("NEXT"));
  const race = Gesture.Race(longPress, longerPress);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={longPress}>
        <SafeAreaView style={{ flex: 1 }}>
          {nodes.map((nodeAttributes, idx) => (
            <Node
              key={idx}
              {...{ setNodes, setDeletingNode, nodeAttributes, idx }}
            />
          ))}
          <Svg style={{ zIndex: 1 }}>
            {nodes.map((node, idx) => {
              if (idx === nodes.length - 1) return;
              return (
                <Line
                  key={idx}
                  x1={node.x}
                  x2={nodes[idx + 1].x}
                  y1={node.y}
                  y2={nodes[idx + 1].y}
                  stroke="black"
                  strokeWidth="4"
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
