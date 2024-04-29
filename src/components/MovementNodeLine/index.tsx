import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Coordinates, Nodes } from "../ImageViewer/index.types";

interface MovementNodeLineProps {
  currentNode: Coordinates;
  nextNode: Coordinates;
  nodeIndex: number;
  adjustedPositionNodes: Readonly<SharedValue<Nodes>>;
  ratioDiff: number;
}

const getNodeXYWithOffset = (node: Coordinates) => {
  "worklet";
  const { x, y } = node;
  return [x, y].map((n) => n + NODE_SIZE_OFFSET);
};

const generateTransform = (
  currentNode: Coordinates,
  nextNode: Coordinates,
  ratioDiff: number
) => {
  "worklet";
  const [x1, y1] = getNodeXYWithOffset(currentNode);
  const [x2, y2] = getNodeXYWithOffset(nextNode);
  return [
    { translateX: x1 },
    { translateY: y1 },
    // formulas for width and rotation pilfered from https://jsfiddle.net/tmjLu8sb/4/
    {
      rotate:
        // needs to add 180 degrees because the maths puts the angle in the exact opposite direction
        (Math.atan2(y1 - y2, x1 - x2) * (180 / Math.PI) + 180).toString() +
        "deg",
    },
    {
      scaleX:
        Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) *
        // ratioDiff fixes pixel density issue from scaling - https://github.com/facebook/react-native/issues/41403#issuecomment-1805532160
        ratioDiff,
    },
  ];
};

const MovementNodeLine = ({
  currentNode,
  nextNode,
  nodeIndex,
  adjustedPositionNodes,
  ratioDiff,
}: MovementNodeLineProps) => {
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "black",
          height: 3,
          zIndex: 1,
          transformOrigin: "0% 50%",
          width: 1,
          flex: 1,
          position: "absolute",
          /* This is a workaround asuseAnimatedStyle does not consistently activate on mount - https://github.com/software-mansion/react-native-reanimated/issues/3296
          This transform renders the static position upon rerendering after adding a node.
          The static position is immediately overriden by useAnimatedStyle when any animation occurs - eg. panning, zooming, moving a node. */
          transform: generateTransform(currentNode, nextNode, ratioDiff),
        },
        useAnimatedStyle(() =>
          [nodeIndex, nodeIndex + 1].some(
            (index) => index === adjustedPositionNodes.value.length
          )
            ? {}
            : {
                transform: generateTransform(
                  adjustedPositionNodes.value[nodeIndex],
                  adjustedPositionNodes.value[nodeIndex + 1],
                  ratioDiff
                ),
              }
        ),
      ]}
    />
  );
};

export default MovementNodeLine;
