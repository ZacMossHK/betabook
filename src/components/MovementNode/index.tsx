import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import React from "react";
import { NODE_SIZE, NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Coordinates, Nodes, SizeDimensions } from "../ImageViewer/index.types";
import { useClimb } from "../../providers/ClimbProvider";

interface MovementNodeProps {
  selectedNodeIndex: SharedValue<number | null>;
  nodeIndex: number;
  selectedNodePosition: SharedValue<Coordinates | null>;
  nodePosition: Coordinates;
  isSelectingNode: SharedValue<boolean>;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  nodes: Nodes;
  isTranslatingNode: SharedValue<boolean>;
  adjustedPositionNodes: Readonly<SharedValue<Nodes>>;
  pinchScale: SharedValue<number>;
  baseScale: SharedValue<number>;
  staticNode: Coordinates;
  viewportMeasurements: SizeDimensions | null;
}

const MovementNode = ({
  selectedNodeIndex,
  nodeIndex,
  selectedNodePosition,
  isSelectingNode,
  setNodes,
  nodes,
  isTranslatingNode,
  adjustedPositionNodes,
  pinchScale,
  baseScale,
  staticNode,
  viewportMeasurements,
}: MovementNodeProps) => {
  const { climb } = useClimb();

  if (!climb) return null;

  const actualPosition = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const tap = Gesture.Tap()
    .maxDuration(5000)
    .onBegin(() => {
      isSelectingNode.value = true;
      selectedNodeIndex.value = nodeIndex;
    })
    .onEnd(() => {
      isTranslatingNode.value = false;
      isSelectingNode.value = false;
      selectedNodeIndex.value = null;
    });

  const translate = Gesture.Pan()
    .maxPointers(1)
    .onChange((event) => {
      if (
        !viewportMeasurements ||
        selectedNodeIndex.value === null ||
        !isSelectingNode.value
      )
        return;

      isTranslatingNode.value = true;

      if (selectedNodePosition.value === null) {
        selectedNodePosition.value = nodes[selectedNodeIndex.value];
        actualPosition.value = nodes[selectedNodeIndex.value];
      } else {
        const scale = pinchScale.value * baseScale.value;
        actualPosition.value = {
          x: event.changeX / scale + actualPosition.value.x,
          y: event.changeY / scale + actualPosition.value.y,
        };
        // This makes sure you can't move nodes off the side of the image with borders
        // This needs refactoring!
        if (climb.imageProps.width >= viewportMeasurements.width) {
          const imageHeight =
            viewportMeasurements.width *
            (climb.imageProps.height / climb.imageProps.width);
          const verticalBorderDistance =
            (viewportMeasurements.height - imageHeight) / 2;
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
          const imageWidth =
            viewportMeasurements.height *
            (climb.imageProps.width / climb.imageProps.height);
          const horizontalBorderDistance =
            (viewportMeasurements.width - imageWidth) / 2;
          selectedNodePosition.value = {
            x: Math.max(
              horizontalBorderDistance - NODE_SIZE_OFFSET,
              Math.min(
                actualPosition.value.x,
                horizontalBorderDistance + imageWidth - NODE_SIZE_OFFSET
              )
            ),
            y: actualPosition.value.y,
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
      const newNodes = [...nodes];
      newNodes[selectedNodeIndex.value] = {
        ...selectedNodePosition.value,
        note: "",
      };
      runOnJS(setNodes)(newNodes);
    });

  const deleteNode = Gesture.LongPress()
    .blocksExternalGesture(tap)
    .minDuration(800)
    .onStart(() => {
      runOnJS(setNodes)(
        // TODO: is this the most efficient way to do this? Eg. splice instead of filter?
        nodes.filter((node, indexToFilter) => indexToFilter !== nodeIndex)
      );
    });

  const movementNodeAnimatedStyle = useAnimatedStyle(() => {
    const node = adjustedPositionNodes.value[nodeIndex];
    if (!node) return {};
    return {
      transform: [{ translateX: node.x }, { translateY: node.y }],
      zIndex: selectedNodeIndex.value === nodeIndex ? 3 : 2,
      borderColor:
        selectedNodeIndex.value === nodeIndex && isSelectingNode.value
          ? "red"
          : "black",
    };
  });

  return (
    <GestureDetector gesture={Gesture.Exclusive(deleteNode, translate, tap)}>
      <Animated.View
        key={nodeIndex}
        style={[
          {
            width: NODE_SIZE,
            height: NODE_SIZE,
            borderRadius: NODE_SIZE,
            borderColor: "black",
            borderWidth: 4,
            position: "absolute",
            backgroundColor: "white",
            flex: 1,
            zIndex: 2,
            /* This is a workaround as useAnimatedStyle does not consistently activate on mount - https://github.com/software-mansion/react-native-reanimated/issues/3296
            This transform renders the static position upon rerendering after adding a node.
            The static position is immediately overriden by useAnimatedStyle when any animation occurs - eg. panning, zooming, moving a node. */
            transform: [
              { translateX: staticNode.x },
              { translateY: staticNode.y },
            ],
          },
          movementNodeAnimatedStyle,
        ]}
      />
    </GestureDetector>
  );
};

export default MovementNode;
