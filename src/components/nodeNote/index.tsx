import { memo, useEffect, useState } from "react";
import { Nodes } from "../ImageViewer/index.types";
import { Keyboard, Text, View } from "react-native";
import {
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { NODE_SIZE } from "../ImageViewer/index.constants";
import {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";
import { NODE_NOTE_CONTAINER_EDIT_HEIGHT } from "../NodeNoteContainer/index.contstants";

interface NodeNoteProps {
  note: string;
  index: number;
  handleSettingNodes: (
    setNodesCallback: (prevNodes: Nodes) => Nodes
  ) => Promise<void>;
  editedNodeIndex: SharedValue<number | null>;
  scrollFlatlistToIndex: (index: number) => void | undefined;
  isLast: boolean;
  nodeContainerHeight: SharedValue<number | "100%">;
  bottomSheetIndex: SharedValue<number>;
}

const NodeNote = memo(
  ({
    note,
    index,
    handleSettingNodes,
    isLast,
    editedNodeIndex,
    scrollFlatlistToIndex,
    nodeContainerHeight,
    bottomSheetIndex,
  }: NodeNoteProps) => {
    const [isEditingText, setIsEditingText] = useState(false);
    const [noteValue, setNoteValue] = useState(note);

    useAnimatedReaction(
      () =>
        editedNodeIndex.value === index &&
        (nodeContainerHeight.value === NODE_NOTE_CONTAINER_EDIT_HEIGHT ||
          (bottomSheetIndex.value === 2 &&
            nodeContainerHeight.value !== "100%")),
      (currentVal, prevVal) => {
        if (currentVal && !prevVal) runOnJS(setIsEditingText)(true);
      }
    );

    useEffect(() => {
      if (isEditingText) {
        scrollFlatlistToIndex(index);
      }
    }, [isEditingText]);

    const saveNodeNote = async () => {
      await handleSettingNodes((prevNodes: Nodes) => {
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
      handleSettingNodes((prevNodes: Nodes) => {
        const newNodes = [...prevNodes];
        const nodeToMove = newNodes[index];
        newNodes[index] = newNodes[index - 1];
        newNodes[index - 1] = nodeToMove;
        return newNodes;
      });

    const handleDownArrowPress = () =>
      handleSettingNodes((prevNodes: Nodes) => {
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
                // the up arrow doesn't render conditionally so the down arrow takes the correct position
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
              {!isLast && (
                <TouchableOpacity
                  style={{
                    height: NODE_SIZE,
                    width: NODE_SIZE,
                    backgroundColor: "#D6EFFF",
                    borderRadius: 15,
                    alignContent: "center",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={handleDownArrowPress}
                >
                  <Text>⌄</Text>
                </TouchableOpacity>
              )}
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
                  editedNodeIndex.value = index;
                  if (bottomSheetIndex.value === 2) return;
                  nodeContainerHeight.value = NODE_NOTE_CONTAINER_EDIT_HEIGHT;
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
  }
);

export default NodeNote;
