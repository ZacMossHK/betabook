import { useState } from "react";
import { Node, Nodes } from "../ImageViewer/index.types";
import { Button, Text, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

interface NodeNoteProps {
  node: Node;
  index: number;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
}

const NodeNote = ({ node, index, setNodes }: NodeNoteProps) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [noteValue, setNoteValue] = useState(node.note);
  const saveNodeNote = () =>
    setNodes((prevNodes) => {
      const newNodes = [...prevNodes];
      newNodes[index].note = noteValue;
      return newNodes;
    });

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
          onFocus={() => setIsEditingText(true)}
          onBlur={() => setIsEditingText(false)}
        />
      </View>
      {isEditingText && (
        <>
          <Button title="save" onPress={() => saveNodeNote()} />
          <Button title="cancel" onPress={() => setIsEditingText(false)} />
        </>
      )}
    </View>
  );
};

export default NodeNote;
