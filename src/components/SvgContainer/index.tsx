// const AnimatedLine = Animated.createAnimatedComponent(Line);

// const SvgContainer = () => (
//   <Svg style={{ zIndex: 1 }}>
//     {nodes.map((nodePosition, index) => {
//       if (index === nodes.length - 1) return;
//       const animatedLineProps = useAnimatedProps(() => {
//         const measured = measure(ref);
//         if (!measured) return {};

//         // TODO: these should be refactored
//         const getX = (nodeCoordinate: number) =>
//           (nodeCoordinate + NODE_SIZE_OFFSET) * imageMatrix.value[0] -
//           // this is the same as imageEdgeOffset in getNewNodePosition, maybe that should be abstracted out?
//           ((measured.width * imageMatrix.value[0] - measured.width) / 2 -
//             Math.max(
//               -maxDistance.value.x,
//               Math.min(maxDistance.value.x, imageMatrix.value[2])
//             ));

//         const getY = (nodeCoordinate: number) =>
//           (nodeCoordinate + NODE_SIZE_OFFSET) * imageMatrix.value[0] -
//           ((measured.height * imageMatrix.value[0] - measured.height) / 2 -
//             Math.max(
//               -maxDistance.value.y,
//               Math.min(maxDistance.value.y, imageMatrix.value[5])
//             ));

//         return {
//           x1: getX(
//             selectedNodeIndex.value === index &&
//               selectedNodePosition.value !== null
//               ? selectedNodePosition.value.x
//               : nodePosition.x
//           ),

//           y1: getY(
//             selectedNodeIndex.value === index &&
//               selectedNodePosition.value !== null
//               ? selectedNodePosition.value.y
//               : nodePosition.y
//           ),

//           x2: getX(
//             selectedNodeIndex.value === index + 1 &&
//               selectedNodePosition.value !== null
//               ? selectedNodePosition.value.x
//               : nodes[index + 1].x
//           ),
//           y2: getY(
//             selectedNodeIndex.value === index + 1 &&
//               selectedNodePosition.value !== null
//               ? selectedNodePosition.value.y
//               : nodes[index + 1].y
//           ),
//         };
//       });
//       return (
//         <AnimatedLine
//           key={index}
//           animatedProps={animatedLineProps}
//           stroke="black"
//           strokeWidth="4"
//         />
//       );
//     })}
//   </Svg>
// );
