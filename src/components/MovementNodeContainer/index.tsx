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
import { NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import React, { useCallback } from "react";
import MovementNodeLine from "../MovementNodeLine";

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
            Math.max(
              -maxDistance.value.y,
              Math.min(maxDistance.value.y, imageMatrix.value[5])
            ) -
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
          selectedNodePosition.value !== null
          ? selectedNodePosition.value.x
          : node.x,
        scale,
        NODE_SIZE_OFFSET
      ),
      y: getCurrentNodePosition(
        selectedNodeIndex.value === nodeIndex &&
          selectedNodePosition.value !== null
          ? selectedNodePosition.value.y
          : node.y,
        scale,
        NODE_SIZE_OFFSET
      ),
      note: node.note,
    }));
  });

  const translateNode = useCallback(
    (selectedNodeIndex: number, selectedNodePosition: Coordinates) =>
      setNodes((prevNodes) => {
        const newNodes = [...prevNodes];
        newNodes[selectedNodeIndex] = {
          ...selectedNodePosition,
          note: newNodes[selectedNodeIndex].note,
        };
        return newNodes;
      }),
    []
  );

  const deleteNode = useCallback(
    (indexToDelete: number) =>
      setNodes((prevNodes) =>
        prevNodes.filter((_, index) => index !== indexToDelete)
      ),
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
            selectedNodePosition.value !== null
            ? selectedNodePosition.value.x
            : node.x,
          scale,
          NODE_SIZE_OFFSET
        );
        const staticNodeY = getCurrentNodePosition(
          selectedNodeIndex.value === nodeIndex &&
            selectedNodePosition.value !== null
            ? selectedNodePosition.value.y
            : node.y,
          scale,
          NODE_SIZE_OFFSET
        );
        return (
          <MovementNode
            key={`${0}-${nodeIndex}-${node.x}-${node.y}`}
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
            }}
          />
        );
      })}
      {nodes.length > 1
        ? nodes.map((node, nodeIndex) => {
            if (nodeIndex === nodes.length - 1) return;
            const scale = pinchScale.value * baseScale.value;
            const currentNode = {
              x: getCurrentNodePosition(
                selectedNodeIndex.value === nodeIndex &&
                  selectedNodePosition.value !== null
                  ? selectedNodePosition.value.x
                  : node.x,
                scale,
                NODE_SIZE_OFFSET
              ),
              y: getCurrentNodePosition(
                selectedNodeIndex.value === nodeIndex &&
                  selectedNodePosition.value !== null
                  ? selectedNodePosition.value.y
                  : node.y,
                scale,
                NODE_SIZE_OFFSET
              ),
            };
            const nextNode = {
              x: getCurrentNodePosition(
                selectedNodeIndex.value === nodeIndex &&
                  selectedNodePosition.value !== null
                  ? selectedNodePosition.value.x
                  : nodes[nodeIndex + 1].x,
                scale,
                NODE_SIZE_OFFSET
              ),
              y: getCurrentNodePosition(
                selectedNodeIndex.value === nodeIndex &&
                  selectedNodePosition.value !== null
                  ? selectedNodePosition.value.y
                  : nodes[nodeIndex + 1].y,
                scale,
                NODE_SIZE_OFFSET
              ),
            };

            return (
              <MovementNodeLine
                key={`${1}-${nodeIndex}-${node.x}-${node.y}`}
                {...{
                  nodeIndex,
                  adjustedPositionNodes,
                  currentNodeX: currentNode.x,
                  currentNodeY: currentNode.y,
                  nextNodeX: nextNode.x,
                  nextNodeY: nextNode.y,
                }}
              />
            );
          })
        : null}
    </Animated.View>
  );
};

export default MovementNodeContainer;
