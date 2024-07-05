import { FlatList } from "react-native-gesture-handler";
import NodeNote from "../NodeNote";
import { Node, Nodes } from "../ImageViewer/index.types";
import { useCallback, useRef } from "react";
import { SharedValue } from "react-native-reanimated";

interface NodeNoteContainerProps {
  nodes: Nodes;
  editedNodeIndex: SharedValue<number | null>;
  handleSettingNodes: (
    setNodesCallback: (prevNodes: Nodes) => Nodes
  ) => Promise<void>;
  nodeContainerHeight: SharedValue<number | "100%">;
}

const NodeNoteContainer = ({
  nodes,
  editedNodeIndex,
  handleSettingNodes,
  nodeContainerHeight,
}: NodeNoteContainerProps) => {
  const flatListRef = useRef<FlatList>(null);

  const scrollFlatlistToIndex = useCallback(
    (index: number) =>
      flatListRef.current?.scrollToIndex({ index, animated: false }),
    [flatListRef]
  );

  const renderNodeNote = ({ item, index }: { item: Node; index: number }) => (
    <NodeNote
      {...{
        note: item.note,
        index,
        handleSettingNodes,
        isLast: index + 1 === nodes.length,
        editedNodeIndex,
        scrollFlatlistToIndex,
        nodeContainerHeight,
      }}
    />
  );

  const keyExtractor = (node: Node, index: number) =>
    `note-${index}-${node.x}-${node.y}`;

  return (
    <FlatList
      ref={flatListRef}
      nestedScrollEnabled={true}
      style={{ paddingHorizontal: 10 }}
      keyboardShouldPersistTaps="handled"
      data={nodes}
      renderItem={renderNodeNote}
      keyExtractor={keyExtractor}
    />
  );
};

export default NodeNoteContainer;
