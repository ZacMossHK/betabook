import Animated, {
  AnimatedRef,
  SharedValue,
  measure,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import React from "react";
import { NODE_SIZE, NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Coordinates, Nodes } from "../ImageViewer/index.types";

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
  innerRef: AnimatedRef<React.Component<{}, {}, any>>;
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
  innerRef,
}: MovementNodeProps) => {
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
      const measured = measure(innerRef);
      if (
        !measured ||
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
        // TODO: set imageHeight based on the actual height of the image!
        const imageHeight = measured.width * 1.33333333;
        const borderDistance = (measured.height - imageHeight) / 2;

        actualPosition.value = {
          x: event.changeX / scale + actualPosition.value.x,
          y: event.changeY / scale + actualPosition.value.y,
        };

        selectedNodePosition.value = {
          x: event.changeX / scale + selectedNodePosition.value.x,
          y: Math.max(
            borderDistance - NODE_SIZE_OFFSET,
            Math.min(
              actualPosition.value.y,
              borderDistance + imageHeight - NODE_SIZE_OFFSET
            )
          ),
        };
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
      newNodes[selectedNodeIndex.value] = selectedNodePosition.value;
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
