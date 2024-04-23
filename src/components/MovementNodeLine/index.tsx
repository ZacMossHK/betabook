import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import React from "react";
import { NODE_SIZE_OFFSET } from "../ImageViewer/index.constants";
import { Nodes } from "../ImageViewer/index.types";

interface MovementNodeLineProps {
  nodeIndex: number;
  adjustedPositionNodes: Readonly<SharedValue<Nodes>>;
  ratioDiff: number;
}

const MovementNodeLine = ({
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
        },
        useAnimatedStyle(() => {
          const node = adjustedPositionNodes.value[nodeIndex];
          const x1 = node.x + NODE_SIZE_OFFSET;
          const y1 = node.y + NODE_SIZE_OFFSET;
          const x2 =
            adjustedPositionNodes.value[nodeIndex + 1].x + NODE_SIZE_OFFSET;
          const y2 =
            adjustedPositionNodes.value[nodeIndex + 1].y + NODE_SIZE_OFFSET;
          return {
            // formulas for width and rotation pilfered from https://jsfiddle.net/tmjLu8sb/4/
            // width: Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)),
            transform: [
              { translateX: x1 },
              { translateY: y1 },
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
                  ratioDiff,
              },
            ],
          };
        }),
      ]}
    />
  );
};

export default MovementNodeLine;
