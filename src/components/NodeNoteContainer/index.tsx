import { FlatList } from "react-native-gesture-handler";
import NodeNote from "../nodeNote";
import { Nodes } from "../ImageViewer/index.types";

interface NodeNoteContainerProps {
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
}

const NodeNoteContainer = ({ nodes, setNodes }: NodeNoteContainerProps) => (
  <FlatList
    nestedScrollEnabled={true}
    style={{ width: "100%", paddingHorizontal: 10 }}
    keyboardShouldPersistTaps="handled"
    data={nodes}
    renderItem={({ item, index }) => (
      <NodeNote {...{ node: item, index, setNodes }} />
    )}
    keyExtractor={(_, index) => index.toString()}
  />
);

export default NodeNoteContainer;
