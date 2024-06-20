import { FlatList } from "react-native-gesture-handler";
import NodeNote from "../NodeNote";
import { Node, Nodes } from "../ImageViewer/index.types";
import { useCallback, useRef } from "react";
import { SharedValue } from "react-native-reanimated";

interface NodeNoteContainerProps {
  nodes: Nodes;
  animateToNodePosition: (nodeX: number, nodeY: number, scale: number) => void;
  editedNodeIndex: SharedValue<number | null>;
  isNodeNoteContainerHeightChangeComplete: SharedValue<boolean>;
  handleSettingNodes: (
    setNodesCallback: (prevNodes: Nodes) => Nodes
  ) => Promise<void>;
}

const NodeNoteContainer = ({
  nodes,
  animateToNodePosition,
  editedNodeIndex,
  isNodeNoteContainerHeightChangeComplete,
  handleSettingNodes,
}: NodeNoteContainerProps) => {
  const flatListRef = useRef<FlatList>(null);

  const scrollFlatlistToIndex = useCallback(
    (index: number) =>
      flatListRef.current?.scrollToIndex({ index, animated: false }),
    [flatListRef]
  );

  const renderNodeNote = useCallback(
    ({ item, index }: { item: Node; index: number }) => (
      <NodeNote
        {...{
          note: item.note,
          index,
          handleSettingNodes,
          nodesLength: nodes.length,
          animateToNodePosition,
          editedNodeIndex,
          scrollFlatlistToIndex,
          isNodeNoteContainerHeightChangeComplete,
          nodeX: item.x,
          nodeY: item.y,
        }}
      />
    ),
    []
  );

  const keyExtractor = useCallback(
    (node: Node, index: number) => `note-${index}-${node.x}-${node.y}`,
    []
  );

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
