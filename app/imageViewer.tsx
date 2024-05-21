import Animated, {
  runOnJS,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import {
  Coordinates,
  ImageProps,
  SizeDimensions,
} from "../src/components/ImageViewer/index.types";
import { identity3 } from "react-native-redash";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMatrix } from "../src/helpers/matrixTransformers/utils";
import MovementNodeContainer from "../src/components/MovementNodeContainer";
import ImageContainer from "../src/components/ImageContainer";
import { Keyboard, Pressable, SafeAreaView, Text, View } from "react-native";
import NodeNoteContainer from "../src/components/NodeNoteContainer";
import { useClimb } from "../src/providers/ClimbProvider";
import { useIsEditingTitle } from "../src/providers/EditingTitleProvider";
import BottomSheet, {
  BottomSheetHandle,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { NODE_SIZE } from "../src/components/ImageViewer/index.constants";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const ImageViewer = () => {
  const { climb, nodes, setNodes, saveClimb } = useClimb();
  const { isEditingTitle, setIsEditingTitle } = useIsEditingTitle();

  const bottomSheetRef = useRef<BottomSheet>(null);

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
  const bottomSheetIndex = useSharedValue(0);

  const [imageProps, setImageProps] = useState<ImageProps>({
    height: climb.imageProps.height,
    width: climb.imageProps.width,
    uri: climb.imageProps.uri,
  });
  const [viewportMeasurements, setViewportMeasurements] =
    useState<SizeDimensions | null>(null);

  const snapPoints = useMemo(() => [60, 369, "100%"], []);

  useEffect(() => {
    selectedNodePosition.value = null;
    selectedNodeIndex.value = null;
    isSelectingNode.value = false;
    saveClimb();
  }, [nodes]);

  useEffect(() => {
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
  const handleOpenBottomSheet = () => bottomSheetRef.current?.snapToIndex(1);
  const handleCloseBottomSheet = () => bottomSheetRef.current?.snapToIndex(0);

  const tapBottomSheetHandle = Gesture.Tap().onStart(() => {
    if (!bottomSheetIndex.value) {
      runOnJS(handleOpenBottomSheet)();
    } else {
      runOnJS(handleCloseBottomSheet)();
    }
  });

  if (!imageProps) return;

  return (
    <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
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
          <View style={{ flex: 1, zIndex: 10 }}>
            <BottomSheet
              handleComponent={(props) => (
                <GestureDetector gesture={tapBottomSheetHandle}>
                  <View>
                    <BottomSheetHandle {...props} />
                    <View
                      style={{
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: NODE_SIZE,
                          height: NODE_SIZE,
                          borderRadius: NODE_SIZE,
                          borderColor: "black",
                          borderWidth: 4,
                          backgroundColor: "white",
                        }}
                      />
                      <Text
                        style={{
                          marginLeft: 7,
                          fontFamily: "InriaSans_400Regular",
                          fontSize: 16,
                          color: "white",
                        }}
                      >
                        Edit nodes
                      </Text>
                    </View>
                  </View>
                </GestureDetector>
              )}
              keyboardBlurBehavior="restore"
              enableOverDrag={false}
              backgroundStyle={{ backgroundColor: "#F55536", borderRadius: 0 }}
              ref={bottomSheetRef}
              snapPoints={snapPoints}
              animatedIndex={bottomSheetIndex}
            >
              <BottomSheetView style={{ alignItems: "center" }}>
                <NodeNoteContainer {...{ nodes, setNodes }} />
              </BottomSheetView>
            </BottomSheet>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Pressable>
  );
};

export default ImageViewer;
