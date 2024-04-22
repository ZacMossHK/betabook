import React from "react";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";

// const myLine = React.forwardRef((props, ref) => {
//   console.log(props);
//   if (!ref) return <Line ref={ref} {...props} />;
// });

class MyLine extends React.Component {
  render() {
    return <Line {...this.props} />;
  }
}

const AnimatedLine = Animated.createAnimatedComponent(MyLine);
const SvgContainer = ({ imageMatrix, pinchScale, baseScale }: any) => {
  const animProp = useAnimatedProps(() => {
    const scale = pinchScale.value * baseScale.value;
    console.log(scale);
    return {
      x1: scale * 5,
      // x1: 1,
    };
  });
  return (
    <Svg style={{ flex: 1, zIndex: 1 }}>
      {/* {nodes.map((nodePosition, index) => {
      if (index === nodes.length - 1) return;
      const animatedLineProps = useAnimatedProps(() => {
        const measured = measure(ref);
        if (!measured) return {};

        // TODO: these should be refactored
        const getX = (nodeCoordinate: number) =>
          (nodeCoordinate + NODE_SIZE_OFFSET) * imageMatrix.value[0] -
          // this is the same as imageEdgeOffset in getNewNodePosition, maybe that should be abstracted out?
          ((measured.width * imageMatrix.value[0] - measured.width) / 2 -
            Math.max(
              -maxDistance.value.x,
              Math.min(maxDistance.value.x, imageMatrix.value[2])
            ));

        const getY = (nodeCoordinate: number) =>
          (nodeCoordinate + NODE_SIZE_OFFSET) * imageMatrix.value[0] -
          ((measured.height * imageMatrix.value[0] - measured.height) / 2 -
            Math.max(
              -maxDistance.value.y,
              Math.min(maxDistance.value.y, imageMatrix.value[5])
            ));

        return {
          x1: getX(
            selectedNodeIndex.value === index &&
              selectedNodePosition.value !== null
              ? selectedNodePosition.value.x
              : nodePosition.x
          ),

          y1: getY(
            selectedNodeIndex.value === index &&
              selectedNodePosition.value !== null
              ? selectedNodePosition.value.y
              : nodePosition.y
          ),

          x2: getX(
            selectedNodeIndex.value === index + 1 &&
              selectedNodePosition.value !== null
              ? selectedNodePosition.value.x
              : nodes[index + 1].x
          ),
          y2: getY(
            selectedNodeIndex.value === index + 1 &&
              selectedNodePosition.value !== null
              ? selectedNodePosition.value.y
              : nodes[index + 1].y
          ),
        };
      });
      return (
        <AnimatedLine
          key={index}
          animatedProps={animatedLineProps}
          stroke="black"
          strokeWidth="4"
        />
      );
    })} */}
      <AnimatedLine
        // animatedProps={useAnimatedProps(() => ({
        //   x1: 0,
        //   x2: 100,
        //   y1: 100,
        //   y2: 0,
        // }))}
        animatedProps={animProp}
        // x1={0}
        x2={100}
        y1={100}
        y2={300}
        stroke="black"
        strokeWidth="4"
      />
    </Svg>
  );
};

export default SvgContainer;
