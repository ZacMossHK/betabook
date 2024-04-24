import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import React from "react";
import { NODE_SIZE, NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Nodes } from "../ImageViewer/index.types";

interface MovementNodeLineProps {
  nodeIndex: number;
  adjustedPositionNodes: Readonly<SharedValue<Nodes>>;
  ratioDiff: number;
}

const getNodeXYWithOffset = (
  adjustedPositionNodes: Readonly<SharedValue<Nodes>>,
  index: number
) => {
  "worklet";
  const { x, y } = adjustedPositionNodes.value[index];
  return [x, y].map((n) => n + NODE_SIZE_OFFSET);
};

const MovementNodeLine = ({
  nodeIndex,
  adjustedPositionNodes,
  ratioDiff,
}: MovementNodeLineProps) => (
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
      },
      useAnimatedStyle(() => {
        if (
          [nodeIndex, nodeIndex + 1].some(
            (index) => index === adjustedPositionNodes.value.length
          )
        )
          return {};
        const [x1, y1] = getNodeXYWithOffset(adjustedPositionNodes, nodeIndex);
        const [x2, y2] = getNodeXYWithOffset(
          adjustedPositionNodes,
          nodeIndex + 1
        );
        return {
          transform: [
            { translateX: x1 },
            { translateY: y1 },
            // formulas for width and rotation pilfered from https://jsfiddle.net/tmjLu8sb/4/
            {
              rotate:
                // needs to add 180 degrees because the maths puts the angle in the exact opposite direction
                (
                  Math.atan2(y1 - y2, x1 - x2) * (180 / Math.PI) +
                  180
                ).toString() + "deg",
            },
            {
              scaleX:
                Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) *
                // ratioDiff fixes pixel density issue from scaling - https://github.com/facebook/react-native/issues/41403#issuecomment-1805532160
                ratioDiff,
            },
          ],
        };
      }),
    ]}
  />
);

export default MovementNodeLine;
