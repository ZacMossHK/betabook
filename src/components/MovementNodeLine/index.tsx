import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Coordinates, Nodes } from "../ImageViewer/index.types";
import { useAnimation } from "../../providers/AnimationProvider";
import { memo } from "react";
import { PixelRatio } from "react-native";

interface MovementNodeLineProps {
  currentNodeX: number;
  currentNodeY: number;
  nextNodeX: number;
  nextNodeY: number;
  nodeIndex: number;
  adjustedPositionNodes: Readonly<SharedValue<Nodes>>;
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
  if (!currentNode || !nextNode) return [];
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
const pixelRatio = PixelRatio.get();
const pixelRatioRounded = Math.round(pixelRatio);
const ratioDiff = pixelRatio / pixelRatioRounded;

const MovementNodeLine = memo(
  ({
    currentNodeX,
    currentNodeY,
    nextNodeX,
    nextNodeY,
    nodeIndex,
    adjustedPositionNodes,
  }: MovementNodeLineProps) => {
    const { selectedLineIndex } = useAnimation();

    const currentNode = { x: currentNodeX, y: currentNodeY };
    const nextNode = { x: nextNodeX, y: nextNodeY };

    return (
      <Animated.View
        style={[
          {
            backgroundColor: "black",
            height: 3,
            zIndex: 1,
            transformOrigin: "0% 50%",
            width: 1,
            position: "absolute",
            /* This is a workaround as useAnimatedStyle does not consistently activate on mount - https://github.com/software-mansion/react-native-reanimated/issues/3296
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
                  backgroundColor:
                    selectedLineIndex.value === nodeIndex ? "red" : "black",
                  // TODO: a lot of lines with transform props cause a huge performance drop, there should be logic here to work out if a line is on screen and if it isn't, give it opacity 0 and no transform props
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
  }
);

export default MovementNodeLine;
