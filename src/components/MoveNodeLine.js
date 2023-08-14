import React from "react";
import { Line } from "react-native-svg";
import Animated, { useAnimatedProps } from "react-native-reanimated";

const AnimatedLine = Animated.createAnimatedComponent(Line);

export default MoveNodeLine = ({
  translateLeft,
  translateTop,
  node,
  scale,
  nodes,
  idx,
  isMovingNode,
  selectedNodeIdx,
  line1Node,
  line2Node,
  panOffset,
}) => {
  const nextNode = nodes[idx + 1];
  const lineAnimatedProps = useAnimatedProps(() => ({
    x1: translateLeft.value + panOffset.value.x + node.x * scale.value,
    y1: translateTop.value + panOffset.value.y + node.y * scale.value,
    x2: translateLeft.value + panOffset.value.x + nextNode.x * scale.value,
    y2: translateTop.value + panOffset.value.y + nextNode.y * scale.value,
  }));

  const line1AnimatedProps = useAnimatedProps(() => ({
    x1: translateLeft.value + panOffset.value.x + node.x * scale.value,
    y1: translateTop.value + panOffset.value.y + node.y * scale.value,
    x2: line1Node.value.x2 + panOffset.value.x,
    y2: line1Node.value.y2 + panOffset.value.y,
  }));

  const line2AnimatedProps = useAnimatedProps(() => ({
    x1: line2Node.value.x1 + panOffset.value.x,
    y1: line2Node.value.y1 + panOffset.value.y,
    x2: translateLeft.value + panOffset.value.x + nextNode.x * scale.value,
    y2: translateTop.value + panOffset.value.y + nextNode.y * scale.value,
  }));

  if (isMovingNode && selectedNodeIdx === idx) {
    return (
      <AnimatedLine
        key={idx}
        animatedProps={line2AnimatedProps}
        stroke="black"
        strokeWidth="4"
      />
    );
  }
  if (isMovingNode && selectedNodeIdx === idx + 1) {
    return (
      <AnimatedLine
        key={idx}
        animatedProps={line1AnimatedProps}
        stroke="black"
        strokeWidth="4"
      />
    );
  }

  return (
    <AnimatedLine
      animatedProps={lineAnimatedProps}
      key={idx}
      stroke="black"
      strokeWidth="4"
    />
  );
};
