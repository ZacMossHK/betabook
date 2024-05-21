import { useState } from "react";
import { Node, Nodes } from "../ImageViewer/index.types";
import { Button, Keyboard, Text, View } from "react-native";
import { TextInput, TouchableOpacity } from "react-native-gesture-handler";
import { NODE_SIZE } from "../ImageViewer/index.constants";
import { useClimb } from "../../providers/ClimbProvider";

interface NodeNoteProps {
  node: Node;
  index: number;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
}

const NodeNote = ({ node, index, setNodes }: NodeNoteProps) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [noteValue, setNoteValue] = useState(node.note);
  const { saveClimb } = useClimb();

  const saveNodeNote = async () => {
    await setNodes((prevNodes) => {
      const newNodes = [...prevNodes];
      newNodes[index] = { ...newNodes[index], note: noteValue };
      return newNodes;
    });
  };

  const fontStyle = {
    fontFamily: "InriaSans_400Regular",
    size: 14,
    color: "#14281D",
  };

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
            defaultValue={node.note}
            onFocus={() => setIsEditingText(true)}
            onBlur={async () => {
              // TODO: refactor this!!!!
              Keyboard.dismiss();
              if (!noteValue.length) return;
              await saveNodeNote();
              await setIsEditingText(false);
            }}
          />
        </View>
        {isEditingText && (
          <TouchableOpacity
            style={{
              padding: 9,
              backgroundColor: "#D6EFFF",
              borderRadius: 15,
              alignSelf: "flex-end",
            }}
            onPress={async () => {
              // TODO: refactor this!!!!
              Keyboard.dismiss();
              if (!noteValue.length) return;
              await saveNodeNote();
              await setIsEditingText(false);
            }}
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
      {/* {isEditingText && (
        <>
          <Button
            title="save"
            onPress={() => {
              saveNodeNote();
              setIsEditingText(false);
              Keyboard.dismiss();
            }}
          />
          <Button
            title="cancel"
            onPress={() => {
              setIsEditingText(false);
              Keyboard.dismiss();
            }}
          />
        </>
      )} */}
    </View>
  );
};

export default NodeNote;
