import { FlatList } from "react-native-gesture-handler";
import NodeNote from "../nodeNote";
import { View } from "react-native";
import { Nodes } from "../ImageViewer/index.types";

interface NodeNoteContainerProps {
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
}

const NodeNoteContainer = ({ nodes, setNodes }: NodeNoteContainerProps) => (
  <View
    style={{
      top:20,
      width: "100%",
      height: "100%",
      backgroundColor: "white",
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
    }}
  >
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={nodes}
      renderItem={({ item, index }) => (
        <NodeNote {...{ node: item, index, setNodes }} />
      )}
      keyExtractor={(node, index) => index.toString()}
    />
  </View>
);

export default NodeNoteContainer;
