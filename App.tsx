// forked from https://github.com/software-mansion/react-native-gesture-handler/issues/2138#issuecomment-1231634779

import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  TransformsStyle,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedRef,
  measure,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import { Matrix3, identity3, multiply3 } from "react-native-redash";

const translateMatrix = (matrix: Matrix3, x: number, y: number): Matrix3 => {
  "worklet";
  return multiply3(matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
};

const scaleMatrix = (matrix: Matrix3, value: number): Matrix3 => {
  "worklet";
  return multiply3(matrix, [value, 0, 0, 0, value, 0, 0, 0, 1]);
};

const translateAndScaleMatrix = (
  matrix: Matrix3,
  origin: Coordinates,
  pinchScale: number
): Matrix3 => {
  "worklet";
  matrix = translateMatrix(matrix, origin.x, origin.y);
  matrix = scaleMatrix(matrix, pinchScale);
  return translateMatrix(matrix, -origin.x, -origin.y);
};

const image = require("./assets/IMG_20230716_184450.jpg");

export interface Coordinates {
  x: number;
  y: number;
}

type TransformableMatrix3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

const ImageViewer = () => {
  const ref = useAnimatedRef();
  const origin = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const transform = useSharedValue(identity3);
  const pinchScale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translation = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const maxDistance = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const adjustedTranslationX = useSharedValue(0);
  const adjustedTranslationY = useSharedValue(0);
  const isViewRendered = useSharedValue(false);
  const adjustedScale = useSharedValue(0);
  const selectedNodeIndex = useSharedValue<number | null>(null);

  const [nodes, setNodes] = useState<any[]>([]);

  const nodeSize = 50;
  const nodeSizeOffset = nodeSize / 2;

  const getMatrix = (
    translation: Coordinates,
    origin: Coordinates,
    pinchScale: number
  ): Matrix3 => {
    "worklet";
    let matrix = identity3;
    if (translation.x !== 0 || translation.y !== 0) {
      matrix = translateMatrix(matrix, translation.x, translation.y);
    }
    if (pinchScale !== 1) {
      matrix = translateAndScaleMatrix(matrix, origin, pinchScale);
    }
    return multiply3(matrix, transform.value);
  };

  const imageMatrix = useDerivedValue(() =>
    getMatrix(translation.value, origin.value, pinchScale.value)
  );

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      const measured = measure(ref);
      if (!measured) return;
      origin.value = {
        x: event.focalX - measured.width / 2,
        // TODO: this will NOT work if the image is landscape instead of portrait!
        y: maxDistance.value.y ? event.focalY - measured.height / 2 : 0,
      };
    })
    .onChange((event) => {
      const measured = measure(ref);
      if (!measured) return;

      if (adjustedScale.value) adjustedScale.value *= event.scaleChange;

      if (maxDistance.value.y && !origin.value.y) {
        transform.value = multiply3(
          translateAndScaleMatrix(identity3, origin.value, pinchScale.value),
          transform.value
        );
        baseScale.value *= pinchScale.value;
        pinchScale.value = 1;
        origin.value.y = event.focalY - measured.height / 2;
        adjustedScale.value = 1;
      }

      if (!maxDistance.value.y && adjustedScale.value) {
        origin.value.y = 0;
      }

      const scaleChangeSinceStart = adjustedScale.value || event.scale;

      // TODO: replace baseScale with the actual current scale from matrix[0]
      if (scaleChangeSinceStart * baseScale.value <= 1) {
        pinchScale.value = 1 / baseScale.value;
      } else if (scaleChangeSinceStart * baseScale.value >= 5) {
        pinchScale.value = 5 / baseScale.value;
      } else {
        pinchScale.value = scaleChangeSinceStart;
      }
    })
    .onEnd(() => {
      transform.value = multiply3(
        translateAndScaleMatrix(identity3, origin.value, pinchScale.value),
        transform.value
      );
      baseScale.value *= pinchScale.value;
      pinchScale.value = 1;
      adjustedScale.value = 0;
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onChange((event) => {
      const scaledOriginalMatrix = getMatrix(
        { x: 0, y: 0 },
        origin.value,
        pinchScale.value
      );
      // adjustedTranslationY.value is always 0 unless vertical translation is valid
      adjustedTranslationY.value = maxDistance.value.y
        ? adjustedTranslationY.value + event.changeY
        : 0;
      const currentPosition = {
        x: scaledOriginalMatrix[2] + event.translationX,
        y: scaledOriginalMatrix[5] + adjustedTranslationY.value,
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

      if (Math.abs(currentPosition.y) > maxDistance.value.y) {
        // this allows an overpanned image to immediately pan back vertically once the vertical direction is reverse away from the border
        adjustedTranslationY.value =
          maxDistance.value.y * (currentPosition.y > 0 ? 1 : -1) -
          scaledOriginalMatrix[5];
      }

      translation.value = {
        x: adjustedTranslationX.value || event.translationX,
        y: adjustedTranslationY.value,
      };
    })
    .onEnd(() => {
      transform.value = multiply3(
        translateMatrix(identity3, translation.value.x, translation.value.y),
        transform.value
      );
      translation.value = { x: 0, y: 0 };
      adjustedTranslationX.value = 0;
      adjustedTranslationY.value = 0;
    });

  const longPress = Gesture.LongPress()
    .minDuration(300)
    .onStart((event) => {
      if (event.numberOfPointers > 1) return;
      const measured = measure(ref);
      if (!measured) return;

      const getNewNodePosition = (
        dimensionMeasurement: number,
        scale: number,
        imagePositionCoordinate: number,
        eventCoordinate: number
      ) => {
        /* TODO:  (dimensionMeasurement * scale - dimensionMeasurement) / 2 
        This formulae matches the one from maxDistance, can this be refactored? */
        const imageEdgeOffset =
          (dimensionMeasurement * scale - dimensionMeasurement) / 2 -
          imagePositionCoordinate;
        return (imageEdgeOffset + eventCoordinate) / scale - nodeSizeOffset;
      };

      runOnJS(setNodes)([
        ...nodes,
        {
          x: getNewNodePosition(
            measured.width,
            imageMatrix.value[0],
            imageMatrix.value[2],
            event.x
          ),
          y: getNewNodePosition(
            measured.height,
            imageMatrix.value[0],
            imageMatrix.value[5],
            event.y
          ),
        },
      ]);
    });

  const animatedStyle = useAnimatedStyle((): TransformsStyle => {
    // necessary as measuring a view that has not rendered properly will produce a warning
    if (!isViewRendered.value) return {};

    const measured = measure(ref);

    if (!measured) return {};

    if (
      !translation.value.x &&
      !translation.value.y &&
      pinchScale.value === 1
    ) {
      const newMatrix = [...transform.value] as TransformableMatrix3;

      if (Math.abs(transform.value[2]) > maxDistance.value.x) {
        // this resets the transform at the edge if trying to pan outside of the image's boundaries
        newMatrix[2] = maxDistance.value.x * (transform.value[2] > 0 ? 1 : -1);
      }
      if (Math.abs(transform.value[5]) > maxDistance.value.y) {
        // this resets the transform at the edge if trying to pan outside of the image's boundaries
        newMatrix[5] = maxDistance.value.y * (transform.value[5] > 0 ? 1 : -1);
      }
      transform.value = newMatrix as Matrix3;
      return {}; // required to stop animatedStyle endlessly refreshing - possibly related to https://github.com/software-mansion/react-native-reanimated/issues/1767
    }

    const imageHeight = measured.width * 1.33333333;
    maxDistance.value = {
      x: (measured.width * imageMatrix.value[0] - measured.width) / 2,
      // the max distance for y will be a negative number so needs .abs to turn it into a positive number
      // TODO: This will NOT work if the image is landscape rather than portrait!
      y: Math.abs(
        Math.min((measured.height - imageHeight * imageMatrix.value[0]) / 2, 0)
      ),
    };
    return {
      transform: [
        {
          translateX: Math.max(
            -maxDistance.value.x,
            Math.min(maxDistance.value.x, imageMatrix.value[2])
          ),
        },
        {
          translateY: Math.max(
            -maxDistance.value.y,
            Math.min(maxDistance.value.y, imageMatrix.value[5])
          ),
        },
        { scaleX: imageMatrix.value[0] },
        { scaleY: imageMatrix.value[4] },
      ],
    };
  });

  const MovementNodeContainer = () => {
    const isSelectingNode = useSharedValue(false);
    const isTranslatingNode = useSharedValue(false);
    const selectedNodePosition = useSharedValue<Coordinates | null>(null);

    const translateNodeGesture = Gesture.Pan()
      .maxPointers(1)
      .onChange((event) => {
        if (selectedNodeIndex.value === null || !isSelectingNode.value) return;

        isTranslatingNode.value = true;

        if (selectedNodePosition.value === null)
          selectedNodePosition.value = nodes[selectedNodeIndex.value];

        if (selectedNodePosition.value !== null)
          selectedNodePosition.value = {
            x:
              event.changeX / imageMatrix.value[0] +
              selectedNodePosition.value.x,
            y:
              event.changeY / imageMatrix.value[0] +
              selectedNodePosition.value.y,
          };
      })
      .onEnd(() => {
        isSelectingNode.value = false;
        isTranslatingNode.value = false;
        if (
          selectedNodeIndex.value === null ||
          selectedNodePosition.value === null
        )
          return;
        const newNodes = [...nodes];
        newNodes[selectedNodeIndex.value] = selectedNodePosition.value;
        runOnJS(setNodes)(newNodes);
      });

    return (
      <GestureDetector gesture={translateNodeGesture}>
        <Animated.View
          style={[
            {
              zIndex: 2,
            },
            useAnimatedStyle(() => {
              if (!isViewRendered.value) return {};
              const measured = measure(ref);
              if (!measured) return {};
              /* This View is the container for all the Move Nodes, and its movement should track along with the image.
          The container view doesn't scale because scaling changes the size of the Nodes, which we don't want!
          Instead, the node coordinates are scaled according to the scale of the image,
          and the move node container then moves so that the coordinates 'appear' to stay in the same place.
          
          The formulae for working out how far the View has to move to match the position of the scale image is:
          distance moved by image - (image dimension measurement * scale - image dimension measurement) / 2 */
              return {
                transform: [
                  {
                    translateX:
                      Math.max(
                        -maxDistance.value.x,
                        Math.min(maxDistance.value.x, imageMatrix.value[2])
                      ) -
                      (measured.width * imageMatrix.value[0] - measured.width) /
                        2,
                  },
                  {
                    translateY:
                      Math.max(
                        -maxDistance.value.y,
                        Math.min(maxDistance.value.y, imageMatrix.value[5])
                      ) -
                      (measured.height * imageMatrix.value[0] -
                        measured.height) /
                        2,
                  },
                ],
              };
            }),
          ]}
        >
          {nodes.length
            ? nodes.map((nodePosition, nodeIndex) => (
                <Animated.View
                  key={nodeIndex}
                  style={[
                    {
                      width: nodeSize,
                      height: nodeSize,
                      borderRadius: nodeSize,
                      borderColor: "black",
                      borderWidth: 10,
                      position: "absolute",
                      backgroundColor: "white",
                      flex: 1,
                    },
                    useAnimatedStyle(() => {
                      const getCurrentNodePosition = (coordinate: number) =>
                        coordinate * imageMatrix.value[0] +
                        nodeSizeOffset * imageMatrix.value[0] -
                        nodeSizeOffset;
                      return {
                        top: getCurrentNodePosition(
                          selectedNodeIndex.value === nodeIndex &&
                            selectedNodePosition.value !== null
                            ? selectedNodePosition.value.y
                            : nodePosition.y
                        ),
                        left: getCurrentNodePosition(
                          selectedNodeIndex.value === nodeIndex &&
                            selectedNodePosition.value !== null
                            ? selectedNodePosition.value.x
                            : nodePosition.x
                        ),
                        zIndex: selectedNodeIndex.value === nodeIndex ? 3 : 2,
                        borderColor:
                          selectedNodeIndex.value === nodeIndex &&
                          isSelectingNode.value
                            ? "red"
                            : "black",
                      };
                    }),
                  ]}
                >
                  <TouchableWithoutFeedback
                    style={{
                      width: "100%",
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    delayLongPress={800}
                    onPressIn={() => {
                      isSelectingNode.value = true;
                      selectedNodeIndex.value = nodeIndex;
                    }}
                    onLongPress={() => {
                      isSelectingNode.value = false;
                      selectedNodeIndex.value = null;
                      setNodes(
                        // TODO: is this the most efficient way to do this? Eg. splice instead of filter?
                        nodes.filter(
                          (node, indexToFilter) => indexToFilter !== nodeIndex
                        )
                      );
                    }}
                    onPressOut={() => {
                      if (isSelectingNode.value && isTranslatingNode.value)
                        return;

                      isTranslatingNode.value = false;
                      isSelectingNode.value = false;
                      selectedNodeIndex.value = null;
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold" }}>
                      {nodeIndex}
                    </Text>
                  </TouchableWithoutFeedback>
                </Animated.View>
              ))
            : null}
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <MovementNodeContainer />
      <GestureDetector gesture={Gesture.Simultaneous(longPress, pinch, pan)}>
        <Animated.View
          onLayout={() => {
            if (ref.current) isViewRendered.value = true;
          }}
          ref={ref}
          collapsable={false}
          style={[styles.fullscreen]}
        >
          <Animated.Image
            source={image}
            resizeMode={"contain"}
            style={[styles.fullscreen, animatedStyle]}
            fadeDuration={0}
          />
        </Animated.View>
      </GestureDetector>
    </View>
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
