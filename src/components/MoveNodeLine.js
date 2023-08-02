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
  line1Offset,
  line2Offset,
}) => {
  const nextNode = nodes[idx + 1];
  const lineAnimatedProps = useAnimatedProps(() => ({
    x1: translateLeft.value + node.x * scale.value,
    y1: translateTop.value + node.y * scale.value,
    x2: translateLeft.value + nextNode.x * scale.value,
    y2: translateTop.value + nextNode.y * scale.value,
  }));

  const line1AnimatedProps = useAnimatedProps(() => ({
    x1: translateLeft.value + node.x * scale.value,
    y1: translateTop.value + node.y * scale.value,
    x2: line1Offset.value.x2,
    y2: line1Offset.value.y2,
  }));

  const line2AnimatedProps = useAnimatedProps(() => ({
    x1: line2Offset.value.x1,
    y1: line2Offset.value.y1,
    x2: translateLeft.value + nextNode.x * scale.value,
    y2: translateTop.value + nextNode.y * scale.value,
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
      x1={translateLeft.value + node.x * scale.value}
      y1={translateTop.value + node.y * scale.value}
      x2={translateLeft.value + nodes[idx + 1].x * scale.value}
      y2={translateTop.value + nodes[idx + 1].y * scale.value}
    />
  );
};
