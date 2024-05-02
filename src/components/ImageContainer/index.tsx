import Animated, {
  AnimatedRef,
  SharedValue,
  measure,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import imageContainerStyles from "./index.styles";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Coordinates,
  ImageProps,
  Nodes,
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

interface ImageContainerProps {
  innerRef: AnimatedRef<React.Component<{}, {}, any>>;
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
  imageProps: ImageProps;
}

const ImageContainer = ({
  innerRef,
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
  imageProps,
}: ImageContainerProps) => {
  // forked from https://github.com/software-mansion/react-native-gesture-handler/issues/2138#issuecomment-1231634779

  const adjustedTranslationX = useSharedValue(0);
  const adjustedTranslationY = useSharedValue(0);
  const adjustedScale = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      const measured = measure(innerRef);
      if (!measured) return;
      origin.value = {
        x: event.focalX - measured.width / 2,
        y: maxDistance.value.y ? event.focalY - measured.height / 2 : 0,
      };
    })
    .onChange((event) => {
      const measured = measure(innerRef);
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
        pinchScale.value,
        transform.value
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
      const measured = measure(innerRef);
      if (!measured) return;
      const newNodePosition = {
        x: getNewNodePosition(
          measured.width,
          imageMatrix.value[0],
          imageMatrix.value[2],
          event.x,
          NODE_SIZE_OFFSET
        ),
        y: getNewNodePosition(
          measured.height,
          imageMatrix.value[0],
          imageMatrix.value[5],
          event.y,
          NODE_SIZE_OFFSET
        ),
      };
      const imageHeight =
        measured.width * (imageProps.height / imageProps.width);
      const borderDistance = (measured.height - imageHeight) / 2;
      // checks if the node is outside of the borders of the image
      if (
        newNodePosition.y + NODE_SIZE_OFFSET < borderDistance ||
        newNodePosition.y + NODE_SIZE_OFFSET > borderDistance + imageHeight
      ) {
        return;
      }
      runOnJS(setNodes)([...nodes, newNodePosition]);
    });

  const animatedStyle = useAnimatedStyle(() => {
    // necessary as measuring a view that has not rendered properly will produce a warning
    if (!isViewRendered.value) return {};

    const measured = measure(innerRef);
    if (!measured || !isViewRendered.value) return {};

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
    // TODO: refactor this!
    if (imageProps.width >= measured.width) {
      const imageHeight =
        measured.width * (imageProps.height / imageProps.width);
      maxDistance.value = {
        x: (measured.width * imageMatrix.value[0] - measured.width) / 2,
        // the max distance for y will be a negative number so needs .abs to turn it into a positive number
        y: Math.abs(
          Math.min(
            (measured.height - imageHeight * imageMatrix.value[0]) / 2,
            0
          )
        ),
      };
    } else {
      // this is only necessary if the aspect ratio of the image is thinner than the width of the viewport
      const imageWidth =
        measured.height * (imageProps.width / imageProps.height);
      maxDistance.value = {
        // the max distance for x will be a negative number so needs .abs to turn it into a positive number
        x: Math.abs(
          Math.min((measured.width - imageWidth * imageMatrix.value[0]) / 2, 0)
        ),
        y: (measured.height * imageMatrix.value[0] - measured.height) / 2,
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
      <Animated.View
        onLayout={() => {
          if (innerRef.current) isViewRendered.value = true;
        }}
        ref={innerRef}
        collapsable={false}
        style={[imageContainerStyles.fullscreen]}
      >
        <Animated.Image
          source={{ uri: imageProps.uri }}
          resizeMode={"contain"}
          style={[imageContainerStyles.fullscreen, animatedStyle]}
          fadeDuration={0}
        />
      </Animated.View>
    </GestureDetector>
  );
};

export default ImageContainer;
