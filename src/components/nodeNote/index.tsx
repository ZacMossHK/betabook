import { useState } from "react";
import { Node, Nodes } from "../ImageViewer/index.types";
import { Button, Keyboard, Text, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

interface NodeNoteProps {
  node: Node;
  index: number;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
}

const NodeNote = ({ node, index, setNodes }: NodeNoteProps) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [noteValue, setNoteValue] = useState(node.note);

  const saveNodeNote = () => {
    setNodes((prevNodes) => {
      const newNodes = [...prevNodes];
      newNodes[index] = { ...newNodes[index], note: noteValue };
      return newNodes;
    });
  };

  return (
    <View>
      <View>
        <Text>{index + 1}</Text>
        <TextInput
          style={{
            backgroundColor: "white",
            height: 40,
            textAlign: "center",
          }}
          placeholder={node.note}
          onChangeText={setNoteValue}
          defaultValue={node.note}
          onFocus={() => setIsEditingText(true)}
          onBlur={() => Keyboard.dismiss()}
        />
      </View>
      {isEditingText && (
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
      )}
    </View>
  );
};

export default NodeNote;
