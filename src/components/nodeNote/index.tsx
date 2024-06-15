import { useEffect, useRef, useState } from "react";
import { Nodes } from "../ImageViewer/index.types";
import { Keyboard, Text, View } from "react-native";
import {
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { NODE_SIZE } from "../ImageViewer/index.constants";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";

interface NodeNoteProps {
  note: string;
  index: number;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  nodes: Nodes;
  animateToNodePosition: (nodeX: number, nodeY: number, scale: number) => void;
}

const NodeNote = ({
  note,
  index,
  setNodes,
  nodes,
  animateToNodePosition,
  isEditingTextSharedValue,
  scrollFlatlistToIndex,
  nodeNodeContainerViewHeight,
}: NodeNoteProps) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [noteValue, setNoteValue] = useState(note);

  const handleSettingEditingText = () => {
    scrollFlatlistToIndex(index);
    setIsEditingText(true);
  };

  useAnimatedReaction(
    () => nodeNodeContainerViewHeight.value,
    (currentVal, prevVal) => {
      // the NodeNote must wait until the height change of the container has happened so it can scroll and focus on the text input
      if (
        Math.floor(currentVal) === 105 &&
        Math.floor(prevVal) !== 105 &&
        isEditingTextSharedValue.value === index &&
        !isEditingText
      ) {
        runOnJS(handleSettingEditingText)();
      }
    }
  );

  const saveNodeNote = async () => {
    await setNodes((prevNodes) => {
      const newNodes = [...prevNodes];
      newNodes[index] = { ...newNodes[index], note: noteValue };
      return newNodes;
    });
  };

  const handleFinishingEditingText = async () => {
    if (noteValue.length) await saveNodeNote();
    await setIsEditingText(false);
    Keyboard.dismiss();
  };

  const handleUpArrowPress = () =>
    setNodes((prevNodes) => {
      const newNodes = [...prevNodes];
      const nodeToMove = newNodes[index];
      newNodes[index] = newNodes[index - 1];
      newNodes[index - 1] = nodeToMove;
      return newNodes;
    });

  const handleDownArrowPress = () =>
    setNodes((prevNodes) => {
      const newNodes = [...prevNodes];
      const nodeToMove = newNodes[index];
      newNodes[index] = newNodes[index + 1];
      newNodes[index + 1] = nodeToMove;
      return newNodes;
    });

  return (
    <View
      style={{
        backgroundColor: isEditingText ? "#EFEFEF" : "white",
        borderRadius: 15,
        paddingLeft: 9,
        paddingRight: 25,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: "column" }}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flexDirection: "column", marginRight: 5 }}>
            <TouchableOpacity
              style={{
                height: NODE_SIZE,
                width: NODE_SIZE,
                backgroundColor: "#D6EFFF",
                borderRadius: 15,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
                opacity: index ? 1 : 0,
              }}
              disabled={!index}
              onPress={handleUpArrowPress}
            >
              <Text>^</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                height: NODE_SIZE,
                width: NODE_SIZE,
                backgroundColor: "#D6EFFF",
                borderRadius: 15,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
                opacity: index + 1 !== nodes.length ? 1 : 0,
              }}
              disabled={index + 1 === nodes.length}
              onPress={handleDownArrowPress}
            >
              <Text>⌄</Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              top: -0.5,
              width: NODE_SIZE,
              height: NODE_SIZE,
              borderRadius: NODE_SIZE,
              borderColor: isEditingText ? "red" : "black",
              borderWidth: 4,
              backgroundColor: "white",
              marginRight: 15,
            }}
          />
          <Text
            style={{
              width: 15,
              fontFamily: "InriaSans_400Regular",
              fontSize: 14,
              color: "#14281D",
            }}
          >
            {index + 1}.
          </Text>
          {!isEditingText && (
            <TouchableWithoutFeedback
              style={{ width: "100%" }}
              onPress={() => {
                Keyboard.addListener("keyboardDidHide", () => {
                  isEditingTextSharedValue.value = null;
                  Keyboard.removeAllListeners("keyboardDidHide");
                });
                animateToNodePosition(nodes[index].x, nodes[index].y, 4);
                isEditingTextSharedValue.value = index;
              }}
            >
              <Text
                style={{
                  textAlignVertical: "top",
                  width: "100%",
                  fontFamily: "InriaSans_400Regular",
                  fontSize: 14,
                  color: "#14281D",
                }}
              >
                {note.length ? note : "Write your note..."}
              </Text>
            </TouchableWithoutFeedback>
          )}
          {isEditingText && (
            <TextInput
              multiline={true}
              style={{
                textAlignVertical: "top",
                width: "100%",
                fontFamily: "InriaSans_400Regular",
                fontSize: 14,
                color: "#14281D",
              }}
              placeholder="Write your note..."
              onChangeText={setNoteValue}
              defaultValue={note}
              autoFocus
              onBlur={handleFinishingEditingText}
            />
          )}
        </View>
        {isEditingText && (
          <TouchableOpacity
            style={{
              padding: 9,
              backgroundColor: "#D6EFFF",
              borderRadius: 15,
              alignSelf: "flex-end",
            }}
            onPress={handleFinishingEditingText}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "InriaSans_700Bold",
                color: "#14281D",
              }}
            >
              OK
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default NodeNote;
