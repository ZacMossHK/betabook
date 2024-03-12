import { Matrix3 } from "react-native-redash";
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  TouchableWithoutFeedback,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import { Text } from "react-native";
import React from "react";
import { getCurrentNodePosition } from "../../helpers/nodes/nodePositions";
import { NODE_SIZE, NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Coordinates } from "../ImageViewer/index.types";

interface MovementNodeProps {
  selectedNodeIndex: SharedValue<number | null>;
  nodeIndex: number;
  selectedNodePosition: SharedValue<Coordinates | null>;
  nodePosition: Coordinates;
  imageMatrix: SharedValue<Matrix3>;
  isSelectingNode: SharedValue<boolean>;
  setNodes: React.Dispatch<React.SetStateAction<Coordinates[]>>;
  nodes: Coordinates[];
  isTranslatingNode: SharedValue<boolean>;
}

const MovementNode = ({
  selectedNodeIndex,
  nodeIndex,
  selectedNodePosition,
  nodePosition,
  imageMatrix,
  isSelectingNode,
  setNodes,
  nodes,
  isTranslatingNode,
}: MovementNodeProps) => {
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
      if (selectedNodeIndex.value === null || !isSelectingNode.value) return;

      isTranslatingNode.value = true;

      if (selectedNodePosition.value === null)
        selectedNodePosition.value = nodes[selectedNodeIndex.value];

      if (selectedNodePosition.value !== null)
        selectedNodePosition.value = {
          x:
            event.changeX / imageMatrix.value[0] + selectedNodePosition.value.x,
          y:
            event.changeY / imageMatrix.value[0] + selectedNodePosition.value.y,
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

  const deleteNode = Gesture.LongPress()
    .minDuration(800)
    .onStart(() => {
      isSelectingNode.value = false;
      selectedNodeIndex.value = null;
      runOnJS(setNodes)(
        // TODO: is this the most efficient way to do this? Eg. splice instead of filter?
        nodes.filter((node, indexToFilter) => indexToFilter !== nodeIndex)
      );
    });

  const movementNodeAnimatedStyle = useAnimatedStyle(() => {
    return {
      top: getCurrentNodePosition(
        selectedNodeIndex.value === nodeIndex &&
          selectedNodePosition.value !== null
          ? selectedNodePosition.value.y
          : nodePosition.y,
        imageMatrix.value[0],
        NODE_SIZE_OFFSET
      ),
      left: getCurrentNodePosition(
        selectedNodeIndex.value === nodeIndex &&
          selectedNodePosition.value !== null
          ? selectedNodePosition.value.x
          : nodePosition.x,
        imageMatrix.value[0],
        NODE_SIZE_OFFSET
      ),
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
            borderWidth: 10,
            position: "absolute",
            backgroundColor: "white",
            flex: 1,
          },
          movementNodeAnimatedStyle,
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
          // onPressIn={() => {
          //   // console.log("hi");
          //   isSelectingNode.value = true;
          //   selectedNodeIndex.value = nodeIndex;
          // }}
          // onLongPress={() => {
          //   // console.log("press");
          //   isSelectingNode.value = false;
          //   selectedNodeIndex.value = null;
          //   setNodes(
          //     // TODO: is this the most efficient way to do this? Eg. splice instead of filter?
          //     nodes.filter((node, indexToFilter) => indexToFilter !== nodeIndex)
          //   );
          // }}
          // onPressOut={() => {
          //   // console.log("out");
          // if (isSelectingNode.value && isTranslatingNode.value) return;

          //   isTranslatingNode.value = false;
          //   isSelectingNode.value = false;
          //   selectedNodeIndex.value = null;
          // }}
        >
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold" }}>
            {nodeIndex}
          </Text>
        </TouchableWithoutFeedback>
      </Animated.View>
    </GestureDetector>
  );
};

export default MovementNode;
