import React, { useEffect, useLayoutEffect, useState } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { Text } from "react-native";

export default MoveNode = ({
  idx,
  setIsSelectingNode,
  setNodes,
  nodeAttributes,
  setIsPanEnabled,
  setSelectedNodeIdx,
  selectedNodeIdx,
  scale,
  nodeOffset,
  translateTop,
  translateLeft,
  isMovingNode,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (isMovingNode && idx === selectedNodeIdx) {
      return {
        top:
          translateTop.value +
          nodeOffset.value.y +
          nodeAttributes.y * scale.value -
          25,
        left:
          translateLeft.value +
          nodeOffset.value.x +
          nodeAttributes.x * scale.value -
          25,
      };
    }
    return {
      top: translateTop.value + nodeAttributes.y * scale.value - 25,
      left: translateLeft.value + nodeAttributes.x * scale.value - 25,
    };
  });
  return (
    <Animated.View
      style={[
        {
          width: 50,
          height: 50,
          borderRadius: 50,
          borderColor: nodeAttributes.borderColor,
          borderWidth: 10,
          position: "absolute",
          zIndex: 2,
          backgroundColor: "white",
        },
        animatedStyle,
      ]}
    >
      <TouchableWithoutFeedback
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
        delayLongPress={650}
        onPressIn={() => {
          setSelectedNodeIdx(idx);
          setIsSelectingNode(true);
          setIsPanEnabled(true);
          setNodes((prevState) => {
            prevState[idx].borderColor = "red";
            return prevState;
          });
        }}
        onPress={() => {
          setIsSelectingNode(false);
          setNodes((prevState) => {
            prevState[idx].borderColor = "red";
            return prevState;
          });
        }}
        onLongPress={() => {
          setNodes((prevState) =>
            prevState.filter(
              (a) => !(a.x === nodeAttributes.x && a.y === nodeAttributes.y)
            )
          );
          setIsSelectingNode(false);
        }}
      >
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold" }}>
          {idx + 1}
        </Text>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};
