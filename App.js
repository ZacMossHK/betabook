// forked from https://github.com/software-mansion/react-native-gesture-handler/issues/2138#issuecomment-1231634779

import React from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedRef,
  measure,
} from "react-native-reanimated";
import { identity3, multiply3 } from "react-native-redash";

const translateMatrix = (matrix, x, y) => {
  "worklet";
  return multiply3(matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
};

const scaleMatrix = (matrix, value) => {
  "worklet";
  return multiply3(matrix, [value, 0, 0, 0, value, 0, 0, 0, 1]);
};

const image = require("./assets/IMG_20230716_184450.jpg");

const ImageViewer = () => {
  const ref = useAnimatedRef();
  const origin = useSharedValue({ x: 0, y: 0 });
  const transform = useSharedValue(identity3);
  const pinchScale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translation = useSharedValue({ x: 0, y: 0 });
  const maxDistance = useSharedValue({ x: 0, y: 0 });
  const adjustedTranslationX = useSharedValue(0);

  const getMatrix = (translation, origin, pinchScale) => {
    "worklet";
    let matrix = identity3;
    if (translation.x !== 0 || translation.y !== 0) {
      matrix = translateMatrix(matrix, translation.x, translation.y);
    }
    if (pinchScale !== 1) {
      matrix = translateMatrix(matrix, origin.x, origin.y);
      matrix = scaleMatrix(matrix, pinchScale);
      matrix = translateMatrix(matrix, -origin.x, -origin.y);
    }
    return multiply3(matrix, transform.value);
  };

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      const measured = measure(ref);
      origin.value = {
        x: event.focalX - measured.width / 2,
        y: event.focalY - measured.height / 2,
      };
    })
    .onChange((event) => {
      if (event.scale * baseScale.value <= 1) {
        pinchScale.value = 1 / baseScale.value;
      } else if (event.scale * baseScale.value >= 5) {
        pinchScale.value = 5 / baseScale.value;
      } else {
        pinchScale.value = event.scale;
      }
    })
    .onEnd(() => {
      let matrix = identity3;
      matrix = translateMatrix(matrix, origin.value.x, origin.value.y);
      matrix = scaleMatrix(matrix, pinchScale.value);
      matrix = translateMatrix(matrix, -origin.value.x, -origin.value.y);
      transform.value = multiply3(matrix, transform.value);
      baseScale.value *= pinchScale.value;
      pinchScale.value = 1;
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onChange((event) => {
      const scaledOriginalMatrix = getMatrix(
        { x: 0, y: 0 },
        origin.value,
        pinchScale.value
      );
      const currentPosition = {
        x: scaledOriginalMatrix[2] + event.translationX,
      };
      if (
        Math.abs(currentPosition.x) > maxDistance.value.x ||
        adjustedTranslationX.value
      ) {
        /* this prevents overpanning the image past the border, and immediately pans back once the direction is reversed
        working out overpanning took countless late nights to work out and I am extremely proud of this */
        const maxDistanceTranslationX =
          maxDistance.value.x * (currentPosition.x > 0 ? 1 : -1) -
          scaledOriginalMatrix[2];
        if (
          !adjustedTranslationX.value ||
          (adjustedTranslationX.value > maxDistanceTranslationX &&
            currentPosition.x > 0) ||
          (adjustedTranslationX.value < maxDistanceTranslationX &&
            currentPosition.x < 0)
        ) {
          // this sets adjustedTranslationX to the border if it overpans
          adjustedTranslationX.value = maxDistanceTranslationX;
        }
        adjustedTranslationX.value += event.changeX;
      }
      translation.value = {
        x: adjustedTranslationX.value || event.translationX,
        y: event.translationY,
      };
    })
    .onEnd(() => {
      let matrix = identity3;
      matrix = translateMatrix(
        matrix,
        translation.value.x,
        translation.value.y
      );
      transform.value = multiply3(matrix, transform.value);
      translation.value = { x: 0, y: 0 };
      adjustedTranslationX.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const measured = measure(ref);

    if (!measured) return {};

    if (
      !translation.value.x &&
      !translation.value.y &&
      pinchScale.value === 1
    ) {
      if (Math.abs(transform.value[2]) > maxDistance.value.x) {
        // this resets the transform at the edge if trying to pan outside of the image's boundaries
        transform.value[2] =
          maxDistance.value.x * (transform.value[2] > 0 ? 1 : -1);
      } else {
        return; // required to stop animatedStyle endlessly refreshing - possibly related to https://github.com/software-mansion/react-native-reanimated/issues/1767
      }
    }

    let matrix = getMatrix(translation.value, origin.value, pinchScale.value);
    const imageHeight = measured.width * 1.33333333;
    maxDistance.value = {
      x: (measured.width * matrix[0] - measured.width) / 2,
      // the max distance for y will be a negative number so needs .abs to turn it into a positive number
      // TODO: This will NOT work if the image is landscape rather than portrait!
      y: Math.abs(Math.min((measured.height - imageHeight * matrix[0]) / 2, 0)),
    };

    return {
      transform: [
        {
          translateX: Math.max(
            -maxDistance.value.x,
            Math.min(maxDistance.value.x, matrix[2])
          ),
        },
        {
          translateY: matrix[5],
        },
        { scaleX: matrix[0] },
        { scaleY: matrix[4] },
      ],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
      <Animated.View ref={ref} collapsable={false} style={[styles.fullscreen]}>
        <Animated.Image
          source={image}
          resizeMode={"contain"}
          style={[styles.fullscreen, animatedStyle]}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});

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

// ↓↓↓↓↓↓ OLD CODE BELOW!!! ↓↓↓↓↓↓

// import { View, SafeAreaView, Dimensions, Image, Text } from "react-native";
// // import theCuttingEdge from "./assets/IMG_20230716_184450.jpg";
// import React, { useEffect, useState } from "react";
// import Svg from "react-native-svg";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   useAnimatedRef,
//   useDerivedValue,
//   max,
// } from "react-native-reanimated";
// import {
//   Gesture,
//   GestureDetector,
//   GestureHandlerRootView,
// } from "react-native-gesture-handler";
// import MoveNodeLine from "./src/components/MoveNodeLine";
// import MoveNode from "./src/components/MoveNode";
// import {
//   Canvas,
//   Skia,
//   useFont,
//   useImage,
//   useValue,
// } from "@shopify/react-native-skia";
// import { Picture } from "./src/components/Picture";
// import {
//   multiply4,
//   processTransform3d,
//   identity4,
//   translate,
//   scale,
//   tom4,
//   Matrix4,
// } from "react-native-redash";

// const exampleImages = [
//   {
//     absoluteX: 172.5490264892578,
//     absoluteY: 523.5294189453125,
//     duration: 301,
//     handlerTag: 1,
//     numberOfPointers: 1,
//     oldState: 2,
//     state: 4,
//     x: 40,
//     y: 40,
//     scale: 1,
//   },
//   {
//     absoluteX: 261.9607849121094,
//     absoluteY: 376.4705810546875,
//     duration: 301,
//     handlerTag: 1,
//     numberOfPointers: 1,
//     oldState: 2,
//     state: 4,
//     x: 261.9607849121094,
//     y: 405.8823547363281,
//     scale: 1,
//   },
//   {
//     absoluteX: 261.9607849121094,
//     absoluteY: 376.4705810546875,
//     duration: 301,
//     handlerTag: 1,
//     numberOfPointers: 1,
//     oldState: 2,
//     state: 4,
//     x: 200.9607849121094,
//     y: 300.8823547363281,
//     scale: 1,
//   },
// ];
// const { x, y, width, height } = Dimensions.get("window");

// const initialHeight = 917.6470947265625;
// const initialWidth = 423.5294189453125;
// const zurich = require("./assets/zurich.jpg");
// export default App = () => {
//   // if (image == null) return null;

//   const [nodes, setNodes] = useState([]);
//   const [isSelectingNode, setIsSelectingNode] = useState(false);
//   const [isPanEnabled, setIsPanEnabled] = useState(false);
//   const [selectedNodeIdx, setSelectedNodeIdx] = useState(0);
//   const [isMovingNode, setIsMovingNode] = useState(false);
//   const [imageHeight, setImageHeight] = useState(0);
//   const [imageWidth, setImageWidth] = useState(0);
//   const nodeOffset = useSharedValue({ x: 0, y: 0 });
//   const nodeStart = useSharedValue({ x: 0, y: 0 });
//   const line1Node = useSharedValue({ x2: 0, y2: 0 });
//   const line1Start = useSharedValue({ x2: 0, y2: 0 });
//   const line2Node = useSharedValue({ x1: 0, y1: 0 });
//   const line2Start = useSharedValue({ x1: 0, y1: 0 });
//   const animatedImage = useAnimatedRef();
//   const baseScale = useSharedValue(1);
//   const pinchScale = useSharedValue(1);
//   const panOffsetTranslationX = useSharedValue(0);
//   const panOffsetTranslationY = useSharedValue(0);
//   const panOffsetPositionX = useSharedValue(0);
//   const panOffsetPositionY = useSharedValue(0);
//   const pinchFocalStartX = useSharedValue(0);
//   const pinchFocalStartY = useSharedValue(0);
//   const pinchFocalTranslationX = useSharedValue(0);
//   const pinchFocalTranslationY = useSharedValue(0);

//   // // const scale = useDerivedValue(() => baseScale.value * pinchScale.value);
//   // const translateTop = useDerivedValue(
//   //   () => -1 * ((initialHeight * scale.value - initialHeight) / 2 || 0)
//   // );
//   // const translateLeft = useDerivedValue(
//   //   () => -1 * ((initialWidth * scale.value - initialWidth) / 2 || 0)
//   // );

//   // const panOffset = useDerivedValue(() => {
//   //   let x = panOffsetPositionX.value + panOffsetTranslationX.value;
//   //   let y = panOffsetPositionY.value + panOffsetTranslationY.value;
//   //   // const widthMaxOffset = (imageWidth * scale.value - imageWidth) / 2;
//   //   // if (x > widthMaxOffset) x = widthMaxOffset;
//   //   // if (x < -widthMaxOffset) x = -widthMaxOffset;
//   //   // const maxHeightOffset = (imageHeight * scale.value - imageHeight) / 2;
//   //   // if (y > maxHeightOffset) y = maxHeightOffset;
//   //   // if (y < -maxHeightOffset) y = -maxHeightOffset;
//   //   return {
//   //     x,
//   //     y,
//   //   };
//   // });

//   // useEffect(() => {
//   //   "worklet";
//   //   line2Start.value = {
//   //     x1: nodes[selectedNodeIdx]?.x,
//   //     y1: nodes[selectedNodeIdx]?.y,
//   //   };
//   //   line1Start.value = {
//   //     x2: nodes[selectedNodeIdx]?.x,
//   //     y2: nodes[selectedNodeIdx]?.y,
//   //   };
//   //   if (isSelectingNode) return;
//   //   nodeOffset.value = { x: 0, y: 0 };
//   //   line1Node.value = { x2: 0, y2: 0 };
//   //   line2Node.value = { x1: 0, y1: 0 };
//   // }, [isSelectingNode]);

//   // const pinchToZoomAnimatedStyle = useAnimatedStyle(() => {
//   //   return {
//   //     transform: [
//   //       { translateX: pinchFocalTranslationX.value },
//   //       { translateY: pinchFocalTranslationY.value },
//   //       {
//   //         translateX: pinchFocalStartX.value,
//   //       },
//   //       {
//   //         translateY: pinchFocalStartY.value,
//   //       },
//   //       {
//   //         scale: scale.value,
//   //       },
//   //       {
//   //         translateX: pinchFocalStartX.value * -1,
//   //       },
//   //       {
//   //         translateY: pinchFocalStartY.value * -1,
//   //       },
//   //     ],
//   //   };
//   // });

//   // // get offset distance from centre
//   // // x - width / 2
//   // // divide by scale because the distance from the centre gets smaller as the scale gets bigger
//   // // offsetDistance / scale.value
//   // // add bottom half
//   // // value + width / 2
//   // const getScaledPosition = (xyValue, initialSize, scale) =>
//   //   (xyValue - initialSize / 2) / scale.value + initialSize / 2;

//   // const applyImage = (n) => {
//   //   const yMargin = (initialHeight - imageHeight * scale.value) / 2;
//   //   if (n.y / scale.value < yMargin || n.y > initialHeight - yMargin) return;
//   //   n.borderColor = "black";
//   //   n.x = getScaledPosition(n.x - panOffset.value.x, initialWidth, scale);
//   //   n.y = getScaledPosition(n.y - panOffset.value.y, initialHeight, scale);
//   //   setNodes((prevState) => [...prevState, n]);
//   // };

//   // const longPress = Gesture.LongPress()
//   //   .enabled(!isSelectingNode)
//   //   .runOnJS(true)
//   //   .minDuration(300)
//   //   .onStart(applyImage)
//   //   .onEnd(() => setIsSelectingNode(false));

//   // const panImage = Gesture.Pan()
//   //   .enabled(!isSelectingNode)
//   //   .onStart(() => {
//   //     "worklet";
//   //     panOffsetTranslationX.value = 0;
//   //     panOffsetTranslationY.value = 0;
//   //   })
//   //   .onUpdate((n) => {
//   //     "worklet";
//   //     panOffsetTranslationX.value = n.translationX;
//   //     panOffsetTranslationY.value = n.translationY;
//   //   })
//   //   .onEnd(() => {
//   //     panOffsetPositionX.value += panOffsetTranslationX.value;
//   //     panOffsetPositionY.value += panOffsetTranslationY.value;
//   //     panOffsetTranslationX.value = 0;
//   //     panOffsetTranslationY.value = 0;
//   //   });

//   // const moveNode = Gesture.Pan()
//   //   .runOnJS(true)
//   //   .onStart((n) => {
//   //     if (!isSelectingNode) return;
//   //     setIsMovingNode(true);
//   //   })
//   //   .onUpdate((n) => {
//   //     "worklet";
//   //     if (!isSelectingNode) return;
//   //     const yMargin = (initialHeight - imageHeight) / 2;
//   //     let nodeTranslationY = n.translationY + nodeStart.value.y;
//   //     let line1y2 =
//   //       n.translationY + line1Start.value.y2 * scale.value + translateTop.value;
//   //     let line2y1 =
//   //       n.translationY + line2Start.value.y1 * scale.value + translateTop.value;
//   //     const yPosition = getScaledPosition(n.y, initialHeight, scale);
//   //     if (yPosition < yMargin) {
//   //       nodeTranslationY = (yMargin - nodes[selectedNodeIdx].y) * scale.value;
//   //       line1y2 = line2y1 = yMargin * scale.value + translateTop.value;
//   //     }
//   //     if (yPosition > initialHeight - yMargin) {
//   //       nodeTranslationY =
//   //         (initialHeight - yMargin - nodes[selectedNodeIdx].y) * scale.value;
//   //       line1y2 = line2y1 =
//   //         (initialHeight - yMargin) * scale.value + translateTop.value;
//   //     }
//   //     nodeOffset.value = {
//   //       x: n.translationX + nodeStart.value.x,
//   //       y: nodeTranslationY,
//   //     };
//   //     line1Node.value = {
//   //       x2:
//   //         n.translationX +
//   //         line1Start.value.x2 * scale.value +
//   //         translateLeft.value,
//   //       y2: line1y2,
//   //     };
//   //     line2Node.value = {
//   //       x1:
//   //         n.translationX +
//   //         line2Start.value.x1 * scale.value +
//   //         translateLeft.value,
//   //       y1: line2y1,
//   //     };
//   //   })
//   //   .onEnd(() => {
//   //     if (!isSelectingNode) return;
//   //     setNodes((prevState) => {
//   //       prevState[selectedNodeIdx].borderColor = "black";
//   //       prevState[selectedNodeIdx].x += nodeOffset.value.x / scale.value;
//   //       prevState[selectedNodeIdx].y += nodeOffset.value.y / scale.value;
//   //       return prevState;
//   //     });
//   //     setIsMovingNode(false);
//   //     setIsSelectingNode(false);
//   //   });

//   // const pinch = Gesture.Pinch()
//   //   .enabled(!isSelectingNode)
//   //   .onStart((n) => {
//   //     "worklet";
//   //     pinchFocalStartX.value = n.focalX + -imageWidth / 2;
//   //     pinchFocalStartY.value = n.focalY + -imageHeight / 2;
//   //     console.log(pinchFocalStartX.value, pinchFocalStartY.value);
//   //   })
//   //   .onUpdate((n) => {
//   //     "worklet";
//   //     // pinchFocalStartX.value *= scale.value;
//   //     // pinchFocalStartY.value *= scale.value;
//   //     // pinchFocalStartX.value = n.focalX + -imageWidth / 2;
//   //     // pinchFocalStartY.value = n.focalY + -imageHeight / 2;
//   //     // console.log(panOffsetTranslationX.value, panOffsetTranslationY.value);
//   //     pinchFocalTranslationX.value =
//   //       (pinchFocalStartX.value - (n.focalX + -imageWidth / 2)) * -1;
//   //     pinchFocalTranslationY.value =
//   //       (pinchFocalStartY.value - (n.focalY + -imageHeight / 2)) * -1;

//   //     if (n.scale * baseScale.value <= 1) {
//   //       pinchScale.value = 1;
//   //       baseScale.value = 1;
//   //       return;
//   //     }
//   //     if (n.scale * baseScale.value >= 5) {
//   //       pinchScale.value = 1;
//   //       baseScale.value = 5;
//   //       return;
//   //     }
//   //     pinchScale.value = n.scale;
//   //   })
//   //   .onEnd((n) => {
//   //     "worklet";
//   //     // below is testing code!!!
//   //     panOffsetTranslationX.value = 0;
//   //     panOffsetTranslationY.value = 0;
//   //     pinchFocalTranslationX.value = 0;
//   //     pinchFocalTranslationY.value = 0;
//   //     baseScale.value = 1;
//   //     pinchScale.value = 1;
//   //     return;
//   //     // testing code ends!

//   //     if (n.scale * baseScale.value <= 1) {
//   //       pinchScale.value = 1;
//   //       baseScale.value = 1;
//   //       return;
//   //     }
//   //     if (n.scale * baseScale.value >= 5) {
//   //       pinchScale.value = 1;
//   //       baseScale.value = 5;
//   //       return;
//   //     }
//   //     baseScale.value *= n.scale;
//   //     pinchScale.value = 1;
//   //   });

//   // return (
//   //   <GestureHandlerRootView style={{ flex: 1 }}>
//   //     <GestureDetector
//   //       style={{ flex: 1 }}
//   //       gesture={Gesture.Simultaneous(
//   //         pinch
//   //         // panImage,
//   //         // longPress,
//   //         //  moveNode
//   //       )}
//   //     >
//   //       <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
//   //         <View
//   //           style={{
//   //             zIndex: 1,
//   //           }}
//   //         >
//   //           {nodes.map((nodeAttributes, idx) => (
//   //             <MoveNode
//   //               key={idx}
//   //               {...{
//   //                 setNodes,
//   //                 setIsSelectingNode,
//   //                 nodeAttributes,
//   //                 idx,
//   //                 setIsPanEnabled,
//   //                 setSelectedNodeIdx,
//   //                 selectedNodeIdx,
//   //                 scale,
//   //                 nodeOffset,
//   //                 translateTop,
//   //                 translateLeft,
//   //                 isMovingNode,
//   //                 panOffset,
//   //               }}
//   //             />
//   //           ))}
//   //           <Svg style={{ zIndex: 1 }}>
//   //             {nodes.map((node, idx) => {
//   //               if (idx === nodes.length - 1) return;
//   //               return (
//   //                 <MoveNodeLine
//   //                   key={idx}
//   //                   {...{
//   //                     translateLeft,
//   //                     translateTop,
//   //                     node,
//   //                     scale,
//   //                     nodes,
//   //                     idx,
//   //                     isMovingNode,
//   //                     selectedNodeIdx,
//   //                     line1Node,
//   //                     line2Node,
//   //                     panOffset,
//   //                   }}
//   //                 />
//   //               );
//   //             })}
//   //           </Svg>
//   //         </View>
//   //         <Animated.Image
//   //           ref={animatedImage}
//   //           source={theCuttingEdge}
//   //           style={[
//   //             {
//   //               width: initialWidth,
//   //               height: imageHeight,
//   //               resizeMode: "contain",
//   //               position: "absolute",
//   //               zIndex: 0,
//   //             },
//   //             pinchToZoomAnimatedStyle,
//   //           ]}
//   //           onLoad={(image) => {
//   //             if (
//   //               image.nativeEvent.source.height > image.nativeEvent.source.width
//   //             ) {
//   //               const proportion =
//   //                 image.nativeEvent.source.height /
//   //                 image.nativeEvent.source.width;
//   //               setImageHeight(initialWidth * proportion);
//   //               setImageWidth(initialWidth);
//   //             }
//   //           }}
//   //         />
//   //       </SafeAreaView>
//   //     </GestureDetector>
//   //   </GestureHandlerRootView>
//   // );

//   // can it be done in react native stuff
//   const image = useImage(zurich);

//   const matrix = useSharedValue(identity4);
//   const pan = Gesture.Pan().onChange((e) => {
//     matrix.value = multiply4(
//       matrix.value,
//       Matrix4.translate(e.changeX, e.changeY, 3)
//     );
//     // console.log(matrix.value);
//   });
//   const pinch = Gesture.Pinch().onChange((e) => {
//     matrix.value = multiply4(
//       matrix.value,
//       Matrix4.scale(e.scaleChange, e.scaleChange, 1)
//     );
//   });
//   const style = useAnimatedStyle(() => {
//     console.log(matrix.value);
//     return {
//       transform: [
//         {
//           matrix: matrix.value,
//         },
//       ],
//     };
//   });
//   if (!image) {
//     return null;
//   }
//   return (
//     <GestureHandlerRootView>
//       <GestureDetector gesture={Gesture.Simultaneous(pan)}>
//         {/* <View> */}
//         <Animated.View style={style}>
//           <Canvas style={{ width, height }}>
//             <Picture image={image} />
//           </Canvas>
//         </Animated.View>
//         {/* </View> */}
//       </GestureDetector>
//     </GestureHandlerRootView>
//   );
// };
