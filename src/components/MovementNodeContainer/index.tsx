import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { Matrix3 } from "react-native-redash";
import MovementNode from "../MovementNode";
import {
  Coordinates,
  ImageProps,
  Nodes,
  SizeDimensions,
} from "../ImageViewer/index.types";
import { getCurrentNodePosition } from "../../helpers/nodes/nodePositions";
import {
  NODE_SIZE_OFFSET,
  SUB_NODE_SIZE_OFFSET,
} from "../ImageViewer/index.constants";
import React, { useCallback } from "react";
import MovementNodeLine from "../MovementNodeLine";
import { View } from "react-native";

interface MovementNodeContainerProps {
  selectedNodeIndex: SharedValue<number | null>;
  selectedNodePosition: SharedValue<Coordinates | null>;
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  imageMatrix: SharedValue<Matrix3>;
  isViewRendered: SharedValue<boolean>;
  maxDistance: SharedValue<Coordinates>;
  isSelectingNode: SharedValue<boolean>;
  isTranslatingNode: SharedValue<boolean>;
  pinchScale: SharedValue<number>;
  baseScale: SharedValue<number>;
  viewportMeasurements: SizeDimensions | null;
  imageProps: ImageProps;
  openBottomSheetHeight: SharedValue<number>;
  isAnimating: SharedValue<boolean>;
  selectedSubNodeIndex: SharedValue<number | null>;
}

const MovementNodeContainer = ({
  selectedNodeIndex,
  selectedNodePosition,
  nodes,
  setNodes,
  imageMatrix,
  isViewRendered,
  maxDistance,
  isSelectingNode,
  isTranslatingNode,
  pinchScale,
  baseScale,
  viewportMeasurements,
  imageProps,
  openBottomSheetHeight,
  isAnimating,
  selectedSubNodeIndex,
}: MovementNodeContainerProps) => {
  // pinched from https://github.com/facebook/react-native/issues/41403#issuecomment-1805532160

  const animatedStyle = useAnimatedStyle(() => {
    if (!isViewRendered.value || !viewportMeasurements) return {};

    const scale = pinchScale.value * baseScale.value;
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
            (viewportMeasurements.width * scale - viewportMeasurements.width) /
              2,
        },
        {
          translateY:
            (isAnimating.value
              ? imageMatrix.value[5]
              : Math.max(
                  -(maxDistance.value.y + openBottomSheetHeight.value),
                  Math.min(maxDistance.value.y, imageMatrix.value[5])
                )) -
            (viewportMeasurements.height * scale -
              viewportMeasurements.height) /
              2,
        },
      ],
    };
  });

  const adjustedPositionNodes = useDerivedValue<Nodes>(() => {
    const scale = pinchScale.value * baseScale.value;
    return nodes.map((node, nodeIndex) => ({
      x: getCurrentNodePosition(
        selectedNodeIndex.value === nodeIndex &&
          selectedNodePosition.value !== null &&
          selectedSubNodeIndex.value === null
          ? selectedNodePosition.value.x
          : node.x,
        scale,
        NODE_SIZE_OFFSET
      ),
      y: getCurrentNodePosition(
        selectedNodeIndex.value === nodeIndex &&
          selectedNodePosition.value !== null &&
          selectedSubNodeIndex.value === null
          ? selectedNodePosition.value.y
          : node.y,
        scale,
        NODE_SIZE_OFFSET
      ),
      note: node.note,
      subNodes: node.subNodes.map((subNode, subNodeIndex) => ({
        x: getCurrentNodePosition(
          selectedNodeIndex.value === nodeIndex &&
            selectedNodePosition.value !== null &&
            selectedSubNodeIndex.value === subNodeIndex
            ? selectedNodePosition.value.x
            : subNode.x,
          scale,
          SUB_NODE_SIZE_OFFSET
        ),
        y: getCurrentNodePosition(
          selectedNodeIndex.value === nodeIndex &&
            selectedNodePosition.value !== null &&
            selectedSubNodeIndex.value === subNodeIndex
            ? selectedNodePosition.value.y
            : subNode.y,
          scale,
          SUB_NODE_SIZE_OFFSET
        ),
        note: subNode.note,
        subNodes: subNode.subNodes,
      })),
    }));
  });

  const translateNode = useCallback(
    (
      selectedNodeIndex: number,
      selectedNodePosition: Coordinates,
      selectedSubNodeIndex: number | null
    ) =>
      setNodes((prevNodes) => {
        const newNodes = [...prevNodes];
        if (selectedSubNodeIndex === null) {
          const newNode = {
            ...selectedNodePosition,
            note: newNodes[selectedNodeIndex].note,
            subNodes: newNodes[selectedNodeIndex].subNodes,
          };
          newNodes[selectedNodeIndex] = newNode;
          return newNodes;
        }
        const newSubNode = {
          ...selectedNodePosition,
          note: newNodes[selectedNodeIndex].subNodes[selectedSubNodeIndex].note,
          subNodes:
            newNodes[selectedNodeIndex].subNodes[selectedSubNodeIndex].subNodes,
        };
        const subNodes = [...newNodes[selectedNodeIndex].subNodes];
        subNodes[selectedSubNodeIndex] = newSubNode;
        newNodes[selectedNodeIndex] = {
          ...newNodes[selectedNodeIndex],
          subNodes,
        };
        return newNodes;
      }),
    []
  );

  const deleteNode = useCallback(
    (indexToDelete: number, subNodeIndexToDelete: number | null) =>
      setNodes((prevNodes) => {
        if (subNodeIndexToDelete === null)
          return prevNodes.filter((_, index) => index !== indexToDelete);
        const newNodes = [...prevNodes];
        const subNodes = newNodes[indexToDelete].subNodes.filter(
          (_, index) => index !== subNodeIndexToDelete
        );
        newNodes[indexToDelete] = { ...newNodes[indexToDelete], subNodes };
        return newNodes;
      }),
    []
  );

  return (
    <Animated.View
      style={[
        {
          zIndex: 2,
        },
        animatedStyle,
      ]}
    >
      {nodes.map((node, nodeIndex) => {
        const scale = pinchScale.value * baseScale.value;

        const staticNodeX = getCurrentNodePosition(
          selectedNodeIndex.value === nodeIndex &&
            selectedNodePosition.value !== null &&
            selectedSubNodeIndex.value === null
            ? selectedNodePosition.value.x
            : node.x,
          scale,
          NODE_SIZE_OFFSET
        );
        const staticNodeY = getCurrentNodePosition(
          selectedNodeIndex.value === nodeIndex &&
            selectedNodePosition.value !== null &&
            selectedSubNodeIndex.value === null
            ? selectedNodePosition.value.y
            : node.y,
          scale,
          NODE_SIZE_OFFSET
        );

        const subNodes = node.subNodes.map((subNode, subNodeIndex) => {
          const staticSubNodeX = getCurrentNodePosition(
            selectedNodeIndex.value === nodeIndex &&
              selectedNodePosition.value !== null &&
              selectedSubNodeIndex.value === subNodeIndex
              ? selectedNodePosition.value.x
              : subNode.x,
            scale,
            NODE_SIZE_OFFSET
          );
          const staticSubNodeY = getCurrentNodePosition(
            selectedNodeIndex.value === nodeIndex &&
              selectedNodePosition.value !== null &&
              selectedSubNodeIndex.value === subNodeIndex
              ? selectedNodePosition.value.y
              : subNode.y,
            scale,
            NODE_SIZE_OFFSET
          );

          return (
            <MovementNode
              key={`${nodeIndex}-${subNodeIndex}-${subNode.x}-${subNode.y}`}
              {...{
                selectedNodeIndex,
                nodeIndex,
                subNodeIndex,
                selectedNodePosition,
                isSelectingNode,
                deleteNode,
                isTranslatingNode,
                adjustedPositionNodes,
                translateNode,
                imagePropsWidth: imageProps.width,
                imagePropsHeight: imageProps.height,
                pinchScale,
                baseScale,
                staticNodeX: staticSubNodeX,
                staticNodeY: staticSubNodeY,
                originalNodeX: subNode.x,
                originalNodeY: subNode.y,
                viewportMeasurementsWidth: viewportMeasurements
                  ? viewportMeasurements.width
                  : null,
                viewportMeasurementsHeight: viewportMeasurements
                  ? viewportMeasurements?.height
                  : null,
                selectedSubNodeIndex,
              }}
            />
          );
        });

        return (
          <View key={`${0}-${nodeIndex}-${node.x}-${node.y}`}>
            <MovementNode
              {...{
                selectedNodeIndex,
                nodeIndex,
                selectedNodePosition,
                isSelectingNode,
                deleteNode,
                isTranslatingNode,
                adjustedPositionNodes,
                translateNode,
                imagePropsWidth: imageProps.width,
                imagePropsHeight: imageProps.height,
                pinchScale,
                baseScale,
                staticNodeX,
                staticNodeY,
                originalNodeX: node.x,
                originalNodeY: node.y,
                viewportMeasurementsWidth: viewportMeasurements
                  ? viewportMeasurements.width
                  : null,
                viewportMeasurementsHeight: viewportMeasurements
                  ? viewportMeasurements?.height
                  : null,
                selectedSubNodeIndex,
              }}
            />
            {subNodes}
          </View>
        );
      })}
      {nodes.length > 1
        ? nodes.map((node, nodeIndex) => {
            const scale = pinchScale.value * baseScale.value;
            const currentNode = {
              x: getCurrentNodePosition(
                selectedNodeIndex.value === nodeIndex &&
                  selectedNodePosition.value !== null &&
                  selectedSubNodeIndex.value === null
                  ? selectedNodePosition.value.x
                  : node.x,
                scale,
                NODE_SIZE_OFFSET
              ),
              y: getCurrentNodePosition(
                selectedNodeIndex.value === nodeIndex &&
                  selectedNodePosition.value !== null &&
                  selectedSubNodeIndex.value === null
                  ? selectedNodePosition.value.y
                  : node.y,
                scale,
                NODE_SIZE_OFFSET
              ),
            };
            const subNodeLines = node.subNodes.length
              ? [node, ...node.subNodes].map(
                  (subNode, subNodeIndex, newSubNodes) => {
                    if (subNodeIndex === newSubNodes.length - 1) return;
                    const currentSubNode = !subNodeIndex
                      ? currentNode
                      : {
                          x: getCurrentNodePosition(
                            selectedNodeIndex.value === nodeIndex &&
                              selectedNodePosition.value !== null &&
                              selectedSubNodeIndex.value === subNodeIndex
                              ? selectedNodePosition.value.x
                              : subNode.x,
                            scale,
                            SUB_NODE_SIZE_OFFSET
                          ),
                          y: getCurrentNodePosition(
                            selectedNodeIndex.value === nodeIndex &&
                              selectedNodePosition.value !== null &&
                              selectedSubNodeIndex.value === subNodeIndex
                              ? selectedNodePosition.value.y
                              : subNode.y,
                            scale,
                            SUB_NODE_SIZE_OFFSET
                          ),
                        };
                    const nextSubNode = {
                      x: getCurrentNodePosition(
                        selectedNodeIndex.value === nodeIndex &&
                          selectedNodePosition.value !== null &&
                          selectedSubNodeIndex.value === subNodeIndex
                          ? selectedNodePosition.value.x
                          : newSubNodes[subNodeIndex + 1].x,
                        scale,
                        SUB_NODE_SIZE_OFFSET
                      ),
                      y: getCurrentNodePosition(
                        selectedNodeIndex.value === nodeIndex &&
                          selectedNodePosition.value !== null &&
                          selectedSubNodeIndex.value === subNodeIndex
                          ? selectedNodePosition.value.y
                          : newSubNodes[subNodeIndex + 1].y,
                        scale,
                        SUB_NODE_SIZE_OFFSET
                      ),
                    };
                    return (
                      <MovementNodeLine
                        key={`${subNodeIndex}-${nodeIndex}-${subNode.x}-${subNode.y}`}
                        {...{
                          nodeIndex,
                          subNodeIndex,
                          adjustedPositionNodes,
                          currentNodeX: currentSubNode.x,
                          currentNodeY: currentSubNode.y,
                          nextNodeX: nextSubNode.x,
                          nextNodeY: nextSubNode.y,
                        }}
                      />
                    );
                  }
                )
              : null;

            return (
              <View key={`${nodeIndex}-${node.x}-${node.y}`}>
                {nodeIndex < nodes.length - 1 ? (
                  <MovementNodeLine
                    {...{
                      nodeIndex,
                      adjustedPositionNodes,
                      currentNodeX: currentNode.x,
                      currentNodeY: currentNode.y,
                      nextNodeX: getCurrentNodePosition(
                        selectedNodeIndex.value === nodeIndex &&
                          selectedNodePosition.value !== null &&
                          selectedSubNodeIndex.value === null
                          ? selectedNodePosition.value.x
                          : nodes[nodeIndex + 1].x,
                        scale,
                        NODE_SIZE_OFFSET
                      ),
                      nextNodeY: getCurrentNodePosition(
                        selectedNodeIndex.value === nodeIndex &&
                          selectedNodePosition.value !== null &&
                          selectedSubNodeIndex.value === null
                          ? selectedNodePosition.value.y
                          : nodes[nodeIndex + 1].y,
                        scale,
                        NODE_SIZE_OFFSET
                      ),
                    }}
                  />
                ) : null}
                {subNodeLines}
              </View>
            );
          })
        : null}
    </Animated.View>
  );
};

export default MovementNodeContainer;
