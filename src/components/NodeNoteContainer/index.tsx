import { FlatList } from "react-native-gesture-handler";
import NodeNote from "../NodeNote";
import { Nodes } from "../ImageViewer/index.types";
import { useState } from "react";
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
}

const NodeNoteContainer = ({
  nodes,
  setNodes,
  bottomSheetIndex,
  isHandlePressOpening,
  handleOpenBottomSheet,
}: NodeNoteContainerProps) => {
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
          }}
        />
      )}
      keyExtractor={(node, index) => `2-${index}-${node.x}-${node.y}`}
    />
  );
};

export default NodeNoteContainer;
