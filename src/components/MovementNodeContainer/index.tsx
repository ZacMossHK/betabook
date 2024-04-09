import Animated, {
  AnimatedRef,
  SharedValue,
  measure,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Matrix3 } from "react-native-redash";
import MovementNode from "../MovementNode";
import { Coordinates, Nodes } from "../ImageViewer/index.types";

interface MovementNodeContainerProps {
  selectedNodeIndex: SharedValue<number | null>;
  selectedNodePosition: SharedValue<Coordinates | null>;
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  imageMatrix: SharedValue<Matrix3>;
  isViewRendered: SharedValue<boolean>;
  innerRef: AnimatedRef<React.Component<{}, {}, any>>;
  maxDistance: SharedValue<Coordinates>;
  isSelectingNode: SharedValue<boolean>;
  isTranslatingNode: SharedValue<boolean>;
}

const MovementNodeContainer = ({
  selectedNodeIndex,
  selectedNodePosition,
  nodes,
  setNodes,
  imageMatrix,
  isViewRendered,
  innerRef,
  maxDistance,
  isSelectingNode,
  isTranslatingNode,
}: MovementNodeContainerProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (!isViewRendered.value) return {};
    const measured = measure(innerRef);
    if (!measured) return {};
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
            (measured.width * imageMatrix.value[0] - measured.width) / 2,
        },
        {
          translateY:
            Math.max(
              -maxDistance.value.y,
              Math.min(maxDistance.value.y, imageMatrix.value[5])
            ) -
            (measured.height * imageMatrix.value[0] - measured.height) / 2,
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          zIndex: 2,
        },
        animatedStyle,
      ]}
    >
      {nodes.map((nodePosition, nodeIndex) => {
        // The first item in the array is there to stop it visually glitching and can be ignored.
        if (!nodeIndex) return;
        return (
          <MovementNode
            // TODO: replace this key with a unique value
            key={nodeIndex * nodePosition.x * nodePosition.y}
            {...{
              selectedNodeIndex,
              nodeIndex,
              selectedNodePosition,
              nodePosition,
              imageMatrix,
              isSelectingNode,
              setNodes,
              nodes,
              isTranslatingNode,
            }}
          />
        );
      })}
    </Animated.View>
  );
};

export default MovementNodeContainer;
