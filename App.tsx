// forked from https://github.com/software-mansion/react-native-gesture-handler/issues/2138#issuecomment-1231634779

import React from "react";
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
  const nodePosition = useSharedValue<Coordinates>({ x: 100, y: 100 });
  const isNodeVisible = useSharedValue(false);

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
    // .enabled(!isSelectingNode)
    .minDuration(300)
    // .onStart(applyImage)
    .onStart((e) => {
      const offset = 25;
      nodePosition.value = { x: e.x - offset, y: e.y - offset };
      isNodeVisible.value = true;
    });
  // .onEnd(() => setIsSelectingNode(false));

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

  return (
    <GestureDetector gesture={Gesture.Simultaneous(longPress, pinch, pan)}>
      <View style={{ flex: 1 }}>
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
                display: isNodeVisible.value ? "flex" : "none",
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
          <Animated.View
            style={[
              {
                width: 50,
                height: 50,
                borderRadius: 50,
                borderColor: "black",
                borderWidth: 10,
                position: "absolute",
                backgroundColor: "white",
                flex: 1,
              },
              useAnimatedStyle(() => {
                const getCurrentNodePosition = (coordinate: number) =>
                  coordinate * imageMatrix.value[0] +
                  25 * imageMatrix.value[0] -
                  25;
                return {
                  top: getCurrentNodePosition(nodePosition.value.y),
                  left: getCurrentNodePosition(nodePosition.value.x),
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
              // delayLongPress={650}
              // onPressIn={() => {
              //   setSelectedNodeIdx(idx);
              //   setIsSelectingNode(true);
              //   setIsPanEnabled(true);
              //   setNodes((prevState) => {
              //     prevState[idx].borderColor = "red";
              //     return prevState;
              //   });
              // }}
              // onPress={() => {
              //   setIsSelectingNode(false);
              //   setNodes((prevState) => {
              //     prevState[idx].borderColor = "red";
              //     return prevState;
              //   });
              // }}
              // onLongPress={() => {
              //   setNodes((prevState) =>
              //     prevState.filter(
              //       (a) => !(a.x === nodeAttributes.x && a.y === nodeAttributes.y)
              //     )
              //   );
              //   setIsSelectingNode(false);
              // }}
            >
              <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold" }}>
                {/* {idx + 1} */}1
              </Text>
            </TouchableWithoutFeedback>
          </Animated.View>
        </Animated.View>
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
      </View>
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
