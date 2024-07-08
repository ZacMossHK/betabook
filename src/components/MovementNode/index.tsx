import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { memo, useMemo, useState } from "react";
import { NODE_SIZE, NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Coordinates, Nodes } from "../ImageViewer/index.types";
import { Text } from "react-native";

interface MovementNodeProps {
  selectedNodeIndex: SharedValue<number | null>;
  nodeIndex: number;
  selectedNodePosition: SharedValue<Coordinates | null>;
  isSelectingNode: SharedValue<boolean>;
  isTranslatingNode: SharedValue<boolean>;
  adjustedPositionNodes: Readonly<SharedValue<Nodes>>;
  pinchScale: SharedValue<number>;
  baseScale: SharedValue<number>;
  staticNodeX: number;
  staticNodeY: number;
  originalNodeX: number;
  originalNodeY: number;
  viewportMeasurementsWidth: number | null;
  viewportMeasurementsHeight: number | null;
  imagePropsWidth: number;
  imagePropsHeight: number;
  translateNode: (
    selectedNodeIndex: number,
    selectedNodePosition: Coordinates
  ) => void;
  deleteNode: (indexToDelete: number) => void;
}

const MovementNode = memo(
  ({
    selectedNodeIndex,
    nodeIndex,
    selectedNodePosition,
    isSelectingNode,
    isTranslatingNode,
    adjustedPositionNodes,
    pinchScale,
    baseScale,
    staticNodeX,
    staticNodeY,
    originalNodeX,
    originalNodeY,
    viewportMeasurementsWidth,
    viewportMeasurementsHeight,
    imagePropsWidth,
    imagePropsHeight,
    translateNode,
    deleteNode,
  }: MovementNodeProps) => {
    // zIndex must be set through state instead of animatedStyle style as animating layout style props (eg. zIndex) causes slowdown when animating
    const [zIndex, setZIndex] = useState(
      selectedNodeIndex.value === nodeIndex ? 3 : 2
    );
    const isImageWiderThanView =
      viewportMeasurementsWidth && viewportMeasurementsHeight
        ? imagePropsWidth / imagePropsHeight >=
          viewportMeasurementsWidth / viewportMeasurementsHeight
        : false;

    const imageHeight =
      viewportMeasurementsWidth &&
      viewportMeasurementsWidth * (imagePropsHeight / imagePropsWidth);
    const verticalBorderDistance =
      viewportMeasurementsHeight &&
      imageHeight &&
      (viewportMeasurementsHeight - imageHeight) / 2;
    const imageWidth =
      viewportMeasurementsHeight &&
      viewportMeasurementsHeight * (imagePropsWidth / imagePropsHeight);
    const horizontalBorderDistance =
      viewportMeasurementsWidth &&
      imageWidth &&
      (viewportMeasurementsWidth - imageWidth) / 2;

    useAnimatedReaction(
      () => selectedNodeIndex.value,
      (currentValue) => {
        if (currentValue === null) return;
        if (currentValue === nodeIndex && zIndex === 2) {
          runOnJS(setZIndex)(3);
        }
        if (currentValue !== nodeIndex && zIndex !== 2) {
          runOnJS(setZIndex)(2);
        }
      }
    );

    const nodeHitSlop = 10;

    const actualPosition = useSharedValue<Coordinates>({ x: 0, y: 0 });

    const tap = useMemo(
      () =>
        Gesture.Tap()
          .maxDuration(5000)
          .hitSlop(nodeHitSlop)
          .onBegin(() => {
            isSelectingNode.value = true;
            selectedNodeIndex.value = nodeIndex;
          })
          .onEnd(() => {
            isTranslatingNode.value = false;
            isSelectingNode.value = false;
            selectedNodeIndex.value = null;
          }),
      [nodeIndex]
    );

    const translate = useMemo(
      () =>
        Gesture.Pan()
          .maxPointers(1)
          .hitSlop(nodeHitSlop)
          .onChange((event) => {
            if (
              !viewportMeasurementsWidth ||
              !viewportMeasurementsHeight ||
              selectedNodeIndex.value === null ||
              !isSelectingNode.value ||
              verticalBorderDistance === null ||
              imageHeight === null ||
              horizontalBorderDistance === null ||
              imageWidth === null
            )
              return;

            isTranslatingNode.value = true;

            if (selectedNodePosition.value === null) {
              const currentNode = { x: originalNodeX, y: originalNodeY };
              selectedNodePosition.value = currentNode;
              actualPosition.value = currentNode;
            } else {
              const scale = pinchScale.value * baseScale.value;
              actualPosition.value = {
                x: event.changeX / scale + actualPosition.value.x,
                y: event.changeY / scale + actualPosition.value.y,
              };
              // This makes sure you can't move nodes off the side of the image with borders
              // This needs refactoring!
              if (isImageWiderThanView) {
                selectedNodePosition.value = {
                  x: actualPosition.value.x,
                  y: Math.max(
                    verticalBorderDistance - NODE_SIZE_OFFSET,
                    Math.min(
                      actualPosition.value.y,
                      verticalBorderDistance + imageHeight - NODE_SIZE_OFFSET
                    )
                  ),
                };
              } else {
                selectedNodePosition.value = {
                  x: Math.max(
                    horizontalBorderDistance - NODE_SIZE_OFFSET,
                    Math.min(
                      actualPosition.value.x,
                      horizontalBorderDistance + imageWidth - NODE_SIZE_OFFSET
                    )
                  ),
                  y: Math.min(
                    viewportMeasurementsHeight - NODE_SIZE_OFFSET,
                    Math.max(actualPosition.value.y, -NODE_SIZE_OFFSET)
                  ),
                };
              }
            }
          })
          .onEnd(() => {
            isSelectingNode.value = false;
            isTranslatingNode.value = false;
            if (
              selectedNodeIndex.value === null ||
              selectedNodePosition.value === null
            )
              return;
            runOnJS(translateNode)(
              selectedNodeIndex.value,
              selectedNodePosition.value
            );
          }),
      [
        viewportMeasurementsWidth,
        viewportMeasurementsHeight,
        imagePropsWidth,
        imagePropsHeight,
        originalNodeX,
        originalNodeY,
      ]
    );

    const nodeLongPress = useMemo(
      () =>
        Gesture.LongPress()
          .blocksExternalGesture(tap)
          .hitSlop(nodeHitSlop)
          .minDuration(800)
          .onStart(() => {
            runOnJS(deleteNode)(nodeIndex);
          }),
      [nodeIndex]
    );

    return (
      <GestureDetector
        gesture={Gesture.Exclusive(nodeLongPress, translate, tap)}
      >
        <Animated.View
          style={[
            {
              width: NODE_SIZE,
              height: NODE_SIZE,
              borderRadius: NODE_SIZE,
              borderColor: "black",
              borderWidth: 3,
              position: "absolute",
              backgroundColor: "white",
              zIndex,
              alignItems: "center",
              justifyContent: "center",
              /* This is a workaround as useAnimatedStyle does not consistently activate on mount - https://github.com/software-mansion/react-native-reanimated/issues/3296
            This transform renders the static position upon rerendering after adding a node.
            The static position is immediately overriden by useAnimatedStyle when any animation occurs - eg. panning, zooming, moving a node. */
              transform: [
                { translateX: staticNodeX },
                { translateY: staticNodeY },
              ],
            },
            useAnimatedStyle(() => {
              const node = adjustedPositionNodes.value[nodeIndex];
              if (!node) return {};
              return {
                transform: [{ translateX: node.x }, { translateY: node.y }],
                borderColor:
                  selectedNodeIndex.value === nodeIndex && isSelectingNode.value
                    ? "red"
                    : "black",
              };
            }),
          ]}
        >
          <Text
            style={{
              color: "black",
              fontSize: 10,
              fontFamily: "InriaSans_700Bold",
            }}
          >
            {nodeIndex + 1}
          </Text>
        </Animated.View>
      </GestureDetector>
    );
  }
);

export default MovementNode;
