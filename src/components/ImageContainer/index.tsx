import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import imageContainerStyles from "./index.styles";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Coordinates,
  Nodes,
  SizeDimensions,
  TransformableMatrix3,
} from "../ImageViewer/index.types";
import { Matrix3, identity3, multiply3 } from "react-native-redash";
import {
  getMatrix,
  translateAndScaleMatrix,
  translateMatrix,
} from "../../helpers/matrixTransformers/utils";
import { getNewNodePosition } from "../../helpers/nodes/nodePositions";
import { NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { useClimb } from "../../providers/ClimbProvider";
import { Dimensions } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useAnimation } from "../../providers/AnimationProvider";

interface ImageContainerProps {
  isViewRendered: SharedValue<boolean>;
  translation: SharedValue<Coordinates>;
  pinchScale: SharedValue<number>;
  baseScale: SharedValue<number>;
  transform: SharedValue<Matrix3>;
  maxDistance: SharedValue<Coordinates>;
  imageMatrix: SharedValue<Matrix3>;
  origin: SharedValue<Coordinates>;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  nodes: Nodes;
  viewportMeasurements: SizeDimensions | null;
  setViewportMeasurements: React.Dispatch<
    React.SetStateAction<SizeDimensions | null>
  >;
  isAnimating: SharedValue<boolean>;
  openBottomSheetHeight: SharedValue<number>;
  openBottomSheetScaleDownPositionAdjustmentY: SharedValue<number>;
  hasHitTopEdge: SharedValue<boolean>;
  imageHeight: number;
  imageWidth: number;
  isImageWiderThanView: boolean | null;
}

const ImageContainer = ({
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
  viewportMeasurements,
  setViewportMeasurements,
  isAnimating,
  openBottomSheetHeight,
  openBottomSheetScaleDownPositionAdjustmentY,
  hasHitTopEdge,
  imageHeight,
  imageWidth,
  isImageWiderThanView,
}: ImageContainerProps) => {
  const { climb } = useClimb();
  const { selectedLineIndex } = useAnimation();
  if (!climb) return null;

  // forked from https://github.com/software-mansion/react-native-gesture-handler/issues/2138#issuecomment-1231634779

  const adjustedTranslationX = useSharedValue(0);
  const adjustedTranslationY = useSharedValue(0);
  const adjustedScale = useSharedValue(0);
  const isPanning = useSharedValue(false);
  const isPinching = useSharedValue(false);

  const getDistanceToLineSegment = (
    currentNodeX: number,
    currentNodeY: number,
    nextNodeX: number,
    nextNodeY: number,
    x: number,
    y: number
  ) => {
    "worklet";
    if (!viewportMeasurements) return null;

    // all values must be multiplied by 10 ** 14 to convert any float values to integers
    let hitSlop = 12 * 10 ** 14;

    [currentNodeX, currentNodeY, nextNodeX, nextNodeY, x, y] = [
      currentNodeX,
      currentNodeY,
      nextNodeX,
      nextNodeY,
      x,
      y,
    ].map(
      (value, index) =>
        (index < 4
          ? value
          : getNewNodePosition(
              viewportMeasurements[index % 2 ? "height" : "width"],
              imageMatrix.value[0],
              imageMatrix.value[index % 2 ? 5 : 2],
              value,
              NODE_SIZE_OFFSET
            )) *
        10 ** 14
    );

    // Calculate the area to check collinearity
    const area = Math.abs(
      currentNodeX * (nextNodeY - y) +
        nextNodeX * (y - currentNodeY) +
        x * (currentNodeY - nextNodeY)
    );

    // Length of the line segment
    const lineSegmentLength = Math.sqrt(
      Math.pow(nextNodeX - currentNodeX, 2) +
        Math.pow(nextNodeY - currentNodeY, 2)
    );

    // Distance from point to the line
    const distance = area / lineSegmentLength;

    // Check if the point is within the tolerance distance hitSlop
    if (distance > hitSlop) {
      return null;
    }

    // Check if the point is within the bounding box with some tolerance
    const withinXBounds =
      Math.min(currentNodeX, nextNodeX) - hitSlop <= x &&
      x <= Math.max(currentNodeX, nextNodeX) + hitSlop;
    const withinYBounds =
      Math.min(currentNodeY, nextNodeY) - hitSlop <= y &&
      y <= Math.max(currentNodeY, nextNodeY) + hitSlop;

    return withinXBounds && withinYBounds ? distance : null;
  };

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      if (!viewportMeasurements) return;
      origin.value = {
        x: event.focalX - viewportMeasurements.width / 2,
        y: maxDistance.value.y
          ? event.focalY - viewportMeasurements.height / 2
          : 0,
      };
      isPinching.value = true;
    })
    .onChange((event) => {
      if (!viewportMeasurements) return;

      if (adjustedScale.value) adjustedScale.value *= event.scaleChange;

      if (
        !openBottomSheetHeight.value &&
        maxDistance.value.y &&
        !origin.value.y
      ) {
        transform.value = multiply3(
          translateAndScaleMatrix(identity3, origin.value, pinchScale.value),
          transform.value
        );
        baseScale.value *= pinchScale.value;
        pinchScale.value = 1;
        origin.value.y = event.focalY - viewportMeasurements.height / 2;
        adjustedScale.value = 1;
      }

      if (!maxDistance.value.y && adjustedScale.value) {
        origin.value.y = 0;
      }

      const scaleChangeSinceStart = adjustedScale.value || event.scale;

      let nextPosY = 0;

      if (
        openBottomSheetHeight.value &&
        !hasHitTopEdge.value &&
        event.scaleChange < 1
      ) {
        const oldImageHeight = imageHeight * baseScale.value * pinchScale.value;
        const newImageHeight =
          imageHeight * baseScale.value * scaleChangeSinceStart;
        nextPosY = (oldImageHeight - newImageHeight) / 2;
      }

      if (scaleChangeSinceStart * baseScale.value <= 1) {
        pinchScale.value = 1 / baseScale.value;
        nextPosY = 0;
      } else if (scaleChangeSinceStart * baseScale.value >= 5) {
        pinchScale.value = 5 / baseScale.value;
      } else {
        pinchScale.value = scaleChangeSinceStart;
      }

      if (!nextPosY) return;
      openBottomSheetScaleDownPositionAdjustmentY.value += nextPosY;
    })
    .onEnd(() => {
      isPinching.value = false;
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
    .onStart(() => {
      isPanning.value = true;
    })
    .onChange((event) => {
      const scaledOriginalMatrix = getMatrix(
        { x: 0, y: 0 },
        origin.value,
        pinchScale.value,
        transform.value
      );

      let changeAmountY = event.changeY;
      if (
        openBottomSheetHeight.value !== 0 &&
        event.changeY > 0 &&
        !hasHitTopEdge.value
      )
        changeAmountY = 0;

      // adjustedTranslationY.value is always 0 unless vertical translation is valid
      adjustedTranslationY.value =
        maxDistance.value.y || openBottomSheetHeight.value
          ? adjustedTranslationY.value + changeAmountY
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

      // the max distance at the top and bottom are not the same when the drawer is open
      if (openBottomSheetHeight.value) {
        if (currentPosition.y > maxDistance.value.y) {
          adjustedTranslationY.value =
            maxDistance.value.y - scaledOriginalMatrix[5];
        }

        if (
          currentPosition.y <
          -(maxDistance.value.y + openBottomSheetHeight.value)
        ) {
          adjustedTranslationY.value =
            -(maxDistance.value.y + openBottomSheetHeight.value) -
            scaledOriginalMatrix[5];
        }
      }

      if (
        !openBottomSheetHeight.value &&
        Math.abs(currentPosition.y) > maxDistance.value.y
      ) {
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
      isPanning.value = false;
    });

  const getNewNodePositions = (x: number, y: number) => {
    "worklet";
    if (!viewportMeasurements) return { x: 0, y: 0 };
    return {
      x: getNewNodePosition(
        viewportMeasurements.width,
        imageMatrix.value[0],
        imageMatrix.value[2],
        x,
        NODE_SIZE_OFFSET
      ),
      y: getNewNodePosition(
        viewportMeasurements.height,
        imageMatrix.value[0],
        imageMatrix.value[5],
        y,
        NODE_SIZE_OFFSET
      ),
    };
  };
  const isNewNodePositionOutsideImageBorder = (
    newNodePosition: Coordinates
  ) => {
    "worklet";
    if (!viewportMeasurements) return true;
    const imageHeight =
      viewportMeasurements.width *
      (climb.imageProps.height / climb.imageProps.width);
    const borderDistance = (viewportMeasurements.height - imageHeight) / 2;
    // checks if the node is outside of the borders of the image
    return (
      newNodePosition.y + NODE_SIZE_OFFSET < borderDistance ||
      newNodePosition.y + NODE_SIZE_OFFSET > borderDistance + imageHeight
    );
  };

  const longPress = Gesture.LongPress()
    .minDuration(300)
    .onStart((event) => {
      if (
        event.numberOfPointers > 1 ||
        !viewportMeasurements ||
        selectedLineIndex.value !== null
      )
        return;

      const newNodePosition = getNewNodePositions(event.x, event.y);
      if (isNewNodePositionOutsideImageBorder(newNodePosition)) {
        return;
      }
      runOnJS(setNodes)([...nodes, { ...newNodePosition, note: "" }]);
    });

  const lineLongPress = Gesture.LongPress()
    .minDuration(400)
    .onBegin((event) => {
      if (nodes.length <= 1 || event.numberOfPointers !== 1) return;
      const validLines = [];
      for (const [index, node] of nodes.entries()) {
        if (index + 1 === nodes.length) continue;
        const tapDistance = getDistanceToLineSegment(
          node.x,
          node.y,
          nodes[index + 1].x,
          nodes[index + 1].y,
          event.x,
          event.y
        );
        if (tapDistance) validLines.push({ index, tapDistance });
      }
      if (!validLines.length) return;
      selectedLineIndex.value = validLines.sort(
        (a, b) => a.tapDistance - b.tapDistance
      )[0].index;
    })
    .onStart((event) => {
      if (
        event.numberOfPointers > 1 ||
        !viewportMeasurements ||
        selectedLineIndex.value === null
      )
        return;

      const newNodePosition = getNewNodePositions(event.x, event.y);
      if (isNewNodePositionOutsideImageBorder(newNodePosition)) {
        return;
      }
      const nodesCopy = [...nodes];
      nodesCopy.splice(selectedLineIndex.value + 1, 0, {
        ...newNodePosition,
        note: "",
      });
      selectedLineIndex.value = null;
      runOnJS(setNodes)(nodesCopy);
    })
    .onFinalize(() => {
      selectedLineIndex.value = null;
    });

  useAnimatedReaction(
    () =>
      !isPanning.value &&
      !isPinching.value &&
      openBottomSheetScaleDownPositionAdjustmentY.value,
    (currentVal) => {
      if (!currentVal) return;
      transform.value = multiply3(
        translateMatrix(
          identity3,
          translation.value.x,
          translation.value.y -
            openBottomSheetScaleDownPositionAdjustmentY.value
        ),
        transform.value
      );
      translation.value = { x: 0, y: 0 };
      openBottomSheetScaleDownPositionAdjustmentY.value = 0;
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    // necessary as measuring a view that has not rendered properly will produce a warning
    if (!isViewRendered.value && !_WORKLET) return {};

    if (!viewportMeasurements || !isViewRendered.value) return {};

    if (
      !translation.value.x &&
      !translation.value.y &&
      pinchScale.value === 1 &&
      // I don't know why animateToNodePosition doesn't work unless this if block doesn't run but it doesn't so isAnimating disables it while animations are running
      !isAnimating.value
    ) {
      const newMatrix = [...transform.value] as TransformableMatrix3;

      if (Math.abs(transform.value[2]) > maxDistance.value.x) {
        // this resets the transform at the edge if trying to pan outside of the image's boundaries
        newMatrix[2] = maxDistance.value.x * (transform.value[2] > 0 ? 1 : -1);
      }
      if (
        openBottomSheetHeight.value &&
        transform.value[5] >
          maxDistance.value.y +
            openBottomSheetHeight.value * imageMatrix.value[0]
      ) {
        newMatrix[5] = maxDistance.value.y - openBottomSheetHeight.value;
      }
      if (
        !openBottomSheetHeight.value &&
        Math.abs(transform.value[5]) > maxDistance.value.y
      ) {
        // this resets the transform at the edge if trying to pan outside of the image's boundaries

        newMatrix[5] = maxDistance.value.y * (transform.value[5] > 0 ? 1 : -1);
      }
      transform.value = newMatrix as Matrix3;
      return {}; // required to stop animatedStyle endlessly refreshing - possibly related to https://github.com/software-mansion/react-native-reanimated/issues/1767
    }
    let topEdge;
    // TODO: refactor this!

    if (isImageWiderThanView) {
      topEdge =
        -((viewportMeasurements.height - imageHeight) / 2) +
        (imageHeight / 2) * imageMatrix.value[0] -
        imageHeight / 2;

      if (openBottomSheetHeight.value && imageMatrix.value[5] <= topEdge)
        hasHitTopEdge.value = true;

      maxDistance.value = {
        x:
          (viewportMeasurements.width * imageMatrix.value[0] -
            viewportMeasurements.width) /
          2,
        // the max distance for y will be a negative number so needs .abs to turn it into a positive number
        y:
          openBottomSheetHeight.value && hasHitTopEdge.value
            ? topEdge
            : Math.abs(
                Math.min(
                  (viewportMeasurements.height -
                    imageHeight * imageMatrix.value[0]) /
                    2,
                  0
                )
              ),
      };
    } else {
      // this is only necessary if the aspect ratio of the image is thinner than the width of the viewport
      maxDistance.value = {
        // the max distance for x will be a negative number so needs .abs to turn it into a positive number
        x: Math.abs(
          Math.min(
            (viewportMeasurements.width - imageWidth * imageMatrix.value[0]) /
              2,
            0
          )
        ),
        y:
          (viewportMeasurements.height * imageMatrix.value[0] -
            viewportMeasurements.height) /
          2,
      };
    }

    return {
      transform: [
        {
          translateX: Math.max(
            -maxDistance.value.x,
            Math.min(maxDistance.value.x, imageMatrix.value[2])
          ),
        },
        {
          translateY: isAnimating.value
            ? imageMatrix.value[5]
            : Math.max(
                -(maxDistance.value.y + openBottomSheetHeight.value),
                Math.min(maxDistance.value.y, imageMatrix.value[5])
              ),
        },
        { scaleX: imageMatrix.value[0] },
        { scaleY: imageMatrix.value[4] },
      ],
    };
  });
  const fullscreenStyle = {
    ...imageContainerStyles.fullscreen,
    height: Dimensions.get("screen").height - 60 - useHeaderHeight(),
  };
  return (
    <GestureDetector
      gesture={Gesture.Simultaneous(longPress, lineLongPress, pinch, pan)}
    >
      <Animated.View
        onLayout={({ nativeEvent }) => {
          if (!viewportMeasurements) {
            const { height, width } = nativeEvent.layout;
            setViewportMeasurements({ height, width });
          }
          isViewRendered.value = true;
        }}
        collapsable={false}
        style={fullscreenStyle}
      >
        <Animated.Image
          source={{ uri: climb.imageProps.uri }}
          resizeMode={"contain"}
          style={[fullscreenStyle, animatedStyle]}
          fadeDuration={0}
        />
      </Animated.View>
    </GestureDetector>
  );
};

export default ImageContainer;
