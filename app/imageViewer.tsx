import Animated, {
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import {
  Coordinates,
  ImageProps,
  SizeDimensions,
} from "../src/components/ImageViewer/index.types";
import { identity3 } from "react-native-redash";
import { useEffect, useState } from "react";
import { getMatrix } from "../src/helpers/matrixTransformers/utils";
import MovementNodeContainer from "../src/components/MovementNodeContainer";
import ImageContainer from "../src/components/ImageContainer";
import { Button, Keyboard, Pressable, SafeAreaView, View } from "react-native";
import NodeNoteContainer from "../src/components/NodeNoteContainer";
import { useClimb } from "../src/providers/ClimbProvider";
import { useNavigation, useRouter } from "expo-router";
import { useIsEditingTitle } from "../src/providers/EditingTitleProvider";

const ImageViewer = () => {
  const { climb, nodes, setNodes, saveClimb, clearClimb } = useClimb();
  const { isEditingTitle, setIsEditingTitle } = useIsEditingTitle();

  const navigation = useNavigation();

  const origin = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const transform = useSharedValue(identity3);
  const pinchScale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translation = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const maxDistance = useSharedValue<Coordinates>({ x: 0, y: 0 });
  const isViewRendered = useSharedValue(false);
  const selectedNodeIndex = useSharedValue<number | null>(null);
  const selectedNodePosition = useSharedValue<Coordinates | null>(null);
  const isSelectingNode = useSharedValue(false);
  const isTranslatingNode = useSharedValue(false);

  const [imageProps, setImageProps] = useState<ImageProps>({
    height: climb.imageProps.height,
    width: climb.imageProps.width,
    uri: climb.imageProps.uri,
  });
  const [viewportMeasurements, setViewportMeasurements] =
    useState<SizeDimensions | null>(null);
  const [isDisplayingNodeNotes, setIsDisplayingNodeNotes] = useState(false);

  useEffect(() => {
    selectedNodePosition.value = null;
    selectedNodeIndex.value = null;
    isSelectingNode.value = false;
    saveClimb();
  }, [nodes]);

  useEffect(() => {
    navigation.addListener("beforeRemove", () => {
      clearClimb();
    });
    if (!climb.fileName) {
      setIsEditingTitle(true);
    }
    setNodes(climb.nodes);
  }, []);

  const imageMatrix = useDerivedValue(() =>
    getMatrix(
      translation.value,
      origin.value,
      pinchScale.value,
      transform.value
    )
  );

  if (!imageProps) return;

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      {/* show grey transparent overlay if the title is being edited */}
      {isEditingTitle && (
        <View
          style={{
            backgroundColor: "grey",
            opacity: 0.8,
            width: "100%",
            height: "100%",
            position: "absolute",
            zIndex: 10,
          }}
        />
      )}
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Animated.View collapsable={false} style={{ flex: 1 }}>
          {isDisplayingNodeNotes && (
            <NodeNoteContainer
              {...{ nodes, setNodes, setIsDisplayingNodeNotes }}
            />
          )}
          <MovementNodeContainer
            {...{
              selectedNodeIndex,
              selectedNodePosition,
              nodes,
              setNodes,
              imageMatrix,
              isViewRendered,
              maxDistance,
              isSelectingNode,
              isTranslatingNode,
              baseScale,
              pinchScale,
              imageProps,
              viewportMeasurements,
            }}
          />
          <ImageContainer
            {...{
              isViewRendered,
              translation,
              pinchScale,
              baseScale,
              transform,
              maxDistance,
              imageMatrix,
              origin,
              setNodes,
              nodes,
              imageProps,
              viewportMeasurements,
              setViewportMeasurements,
            }}
          />
          <View style={{ flex: 1, top: "83%" }}>
            <Button
              title="nodes"
              color="orange"
              onPress={() => setIsDisplayingNodeNotes(true)}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </Pressable>
  );
};

export default ImageViewer;
