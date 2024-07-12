import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { memo, useMemo, useState } from "react";
import {
  NODE_SIZE,
  NODE_SIZE_OFFSET,
  SUB_NODE_SIZE,
  SUB_NODE_SIZE_OFFSET,
} from "../ImageViewer/index.constants";
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
    selectedNodePosition: Coordinates,
    selectedSubNodeIndex: number | null
  ) => void;
  deleteNode: (
    indexToDelete: number,
    subNodeIndexToDelete: number | null
  ) => void;
  subNodeIndex?: number;
  selectedSubNodeIndex: SharedValue<number | null>;
  isPanning: SharedValue<boolean>;
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
    subNodeIndex,
    selectedSubNodeIndex,
    isPanning,
  }: MovementNodeProps) => {
    // zIndex must be set through state instead of animatedStyle style as animating layout style props (eg. zIndex) causes slowdown when animating
    const [zIndex, setZIndex] = useState(
      selectedNodeIndex.value === nodeIndex ? 3 : 2
    );

    const isSubNode = subNodeIndex !== undefined;
    const nodeOffset = isSubNode ? SUB_NODE_SIZE_OFFSET : NODE_SIZE_OFFSET;

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
            if (isPanning.value) return;
            isSelectingNode.value = true;
            selectedNodeIndex.value = nodeIndex;
            selectedSubNodeIndex.value = isSubNode ? subNodeIndex : null;
          })
          .onEnd(() => {
            if (!isSubNode) return;
            selectedNodeIndex.value = null;
            selectedSubNodeIndex.value = null;
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
              isPanning.value ||
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
                    verticalBorderDistance - nodeOffset,
                    Math.min(
                      actualPosition.value.y,
                      verticalBorderDistance + imageHeight - nodeOffset
                    )
                  ),
                };
              } else {
                selectedNodePosition.value = {
                  x: Math.max(
                    horizontalBorderDistance - nodeOffset,
                    Math.min(
                      actualPosition.value.x,
                      horizontalBorderDistance + imageWidth - nodeOffset
                    )
                  ),
                  y: Math.min(
                    viewportMeasurementsHeight - nodeOffset,
                    Math.max(actualPosition.value.y, -nodeOffset)
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
              selectedNodePosition.value,
              selectedSubNodeIndex.value
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
            runOnJS(deleteNode)(nodeIndex, isSubNode ? subNodeIndex : null);
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
              width: isSubNode ? SUB_NODE_SIZE : NODE_SIZE,
              height: isSubNode ? SUB_NODE_SIZE : NODE_SIZE,
              borderRadius: isSubNode ? 0 : NODE_SIZE,
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
              if (!adjustedPositionNodes.value[nodeIndex]) return {};
              const node = isSubNode
                ? adjustedPositionNodes.value[nodeIndex].subNodes[subNodeIndex]
                : adjustedPositionNodes.value[nodeIndex];
              if (!node) return {};
              return {
                transform: [{ translateX: node.x }, { translateY: node.y }],
                borderColor:
                  !isPanning.value &&
                  selectedNodeIndex.value === nodeIndex &&
                  isSelectingNode.value &&
                  ((!isSubNode && selectedSubNodeIndex.value === null) ||
                    (isSubNode && selectedSubNodeIndex.value === subNodeIndex))
                    ? "red"
                    : "black",
              };
            }),
          ]}
        >
          <Text
            style={{
              color: "black",
              fontSize: isSubNode ? 7 : 10,
              fontFamily: "InriaSans_700Bold",
            }}
          >
            {(isSubNode ? subNodeIndex : nodeIndex) + 1}
          </Text>
        </Animated.View>
      </GestureDetector>
    );
  }
);

export default MovementNode;
