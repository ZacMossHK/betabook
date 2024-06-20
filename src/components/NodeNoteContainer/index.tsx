import { FlatList } from "react-native-gesture-handler";
import NodeNote from "../NodeNote";
import { Nodes } from "../ImageViewer/index.types";
import { useRef, useState } from "react";
import {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";

interface NodeNoteContainerProps {
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  bottomSheetIndex: SharedValue<number>;
  isHandlePressOpening: SharedValue<boolean>;
  handleOpenBottomSheet: () => void | undefined;
  animateToNodePosition: (nodeX: number, nodeY: number, scale: number) => void;
}

const NodeNoteContainer = ({
  nodes,
  setNodes,
  bottomSheetIndex,
  isHandlePressOpening,
  handleOpenBottomSheet,
  animateToNodePosition,
  isEditingTextSharedValue,
  isNodeNoteContainerHeightChangeComplete,
}: NodeNoteContainerProps) => {
  const flatListRef = useRef<FlatList>(null);
  /* it's faster to set a new nodes array when the flatlist isn't being rendered. The flatlist is only rendered when the draw is open.
  However the draw opening through snapping to an index is faster than the rendering
  When the handle is pressed to open, the shared value isHandlePressOpening is changed to true, which kicks off the animated reactions*/
  const [isRenderingNodeNoteContainer, setIsRenderingNodeNoteContainer] =
    useState(false);

  useAnimatedReaction(
    () => bottomSheetIndex.value > 0,
    (currentIndex, prevIndex) => {
      if (currentIndex && !prevIndex && !isRenderingNodeNoteContainer) {
        runOnJS(setIsRenderingNodeNoteContainer)(true);
      }
      if (!currentIndex && prevIndex) {
        runOnJS(setIsRenderingNodeNoteContainer)(false);
      }
    }
  );

  const scrollFlatlistToIndex = (index: number) =>
    flatListRef.current?.scrollToIndex({ index, animated: false });

  const handleOpeningContainerFromHandlePress = async () => {
    await setIsRenderingNodeNoteContainer(true);
    handleOpenBottomSheet();
    isHandlePressOpening.value = false;
  };

  useAnimatedReaction(
    () => isHandlePressOpening.value,
    (currentValue) => {
      if (!currentValue) return;
      runOnJS(handleOpeningContainerFromHandlePress)();
    }
  );

  if (!isRenderingNodeNoteContainer) return null;

  return (
    <FlatList
      ref={flatListRef}
      nestedScrollEnabled={true}
      style={{ paddingHorizontal: 10 }}
      keyboardShouldPersistTaps="handled"
      data={nodes}
      renderItem={({ item, index }) => (
        <NodeNote
          {...{
            note: item.note,
            index,
            setNodes,
            nodes,
            animateToNodePosition,
            isEditingTextSharedValue,
            scrollFlatlistToIndex,
            isNodeNoteContainerHeightChangeComplete,
          }}
        />
      )}
      keyExtractor={(node, index) => `2-${index}-${node.x}-${node.y}`}
    />
  );
};

export default NodeNoteContainer;
