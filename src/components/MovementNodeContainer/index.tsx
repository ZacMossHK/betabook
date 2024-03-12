import { Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import Animated, {
  AnimatedRef,
  SharedValue,
  measure,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Matrix3 } from "react-native-redash";
import MovementNode from "../MovementNode";
import { Coordinates } from "../ImageViewer/index.types";

interface MovementNodeContainerProps {
  selectedNodeIndex: SharedValue<number | null>;
  selectedNodePosition: SharedValue<Coordinates | null>;
  nodes: Coordinates[];
  setNodes: React.Dispatch<React.SetStateAction<Coordinates[]>>;
  imageMatrix: SharedValue<Matrix3>;
  isViewRendered: SharedValue<boolean>;
  innerRef: AnimatedRef<React.Component<{}, {}, any>>;
  maxDistance: SharedValue<Coordinates>;
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
}: MovementNodeContainerProps) => {
  const isSelectingNode = useSharedValue(false);
  const isTranslatingNode = useSharedValue(false);

  const translateNodeGesture = Gesture.Pan()
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

  const animatedStyle = useAnimatedStyle(() => {
    // selectedNodePosition has nothing to do with this but if a reference to it isn't included in this animatedStyle it doesn't work and I don't know why.
    if (!isViewRendered.value || !selectedNodePosition) return {};
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
    <View>
      <GestureDetector gesture={translateNodeGesture}>
        <Animated.View
          style={[
            {
              zIndex: 2,
            },
            animatedStyle,
          ]}
        >
          {nodes.length
            ? nodes.map((nodePosition, nodeIndex) => (
                <MovementNode
                  key={nodeIndex}
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
              ))
            : null}
        </Animated.View>
      </GestureDetector>
      {/* AnimatedLines CAN NOT be children of Animated Views */}
    </View>
  );
};

export default MovementNodeContainer;
