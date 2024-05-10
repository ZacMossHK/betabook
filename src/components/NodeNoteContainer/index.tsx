import { FlatList } from "react-native-gesture-handler";
import NodeNote from "../nodeNote";
import { Button, View } from "react-native";
import { Nodes } from "../ImageViewer/index.types";

interface NodeNoteContainerProps {
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  setIsDisplayingNodeNotes: React.Dispatch<React.SetStateAction<boolean>>;
}

const NodeNoteContainer = ({
  nodes,
  setNodes,
  setIsDisplayingNodeNotes,
}: NodeNoteContainerProps) => {
  return (
    <View style={{ height: "100%", zIndex: 10, backgroundColor: "black" }}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        style={{ top: "10%" }}
        data={nodes}
        renderItem={({ item, index }) => (
          <NodeNote {...{ node: item, index, setNodes }} />
        )}
        keyExtractor={(node, index) => index.toString()}
      />
      <View style={{ bottom: "10%" }}>
        <Button
          title="back"
          onPress={() => {
            setIsDisplayingNodeNotes(false);
          }}
        />
      </View>
    </View>
  );
};

export default NodeNoteContainer;
