import Animated, {
  measure,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Coordinates,
  SizeDimensions,
} from "../src/components/ImageViewer/index.types";
import { Matrix3, identity3 } from "react-native-redash";
import { useEffect, useRef, useState } from "react";
import { getMatrix } from "../src/helpers/matrixTransformers/utils";
import MovementNodeContainer from "../src/components/MovementNodeContainer";
import ImageContainer from "../src/components/ImageContainer";
import { Keyboard, Pressable, SafeAreaView, Text, View } from "react-native";
import NodeNoteContainer from "../src/components/NodeNoteContainer";
import { useClimb } from "../src/providers/ClimbProvider";
import { useIsEditingTitle } from "../src/providers/EditingTitleProvider";
import BottomSheet, { BottomSheetHandle } from "@gorhom/bottom-sheet";
import {
  NODE_SIZE,
  NODE_SIZE_OFFSET,
} from "../src/components/ImageViewer/index.constants";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getCurrentNodePosition } from "../src/helpers/nodes/nodePositions";

const BOTTOMSHEET_LOW_HEIGHT = 60;
const BOTTOMSHEET_MID_HEIGHT = 369;

const ImageViewer = () => {
  const { climb, nodes, setNodes, setNewClimbName, saveClimb } = useClimb();

  if (!climb) return null;

  const { isEditingTitle, setIsEditingTitle } = useIsEditingTitle();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const nodeNoteContainerViewRef = useAnimatedRef();

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
  const isHandlePressOpening = useSharedValue(false);
  const isAnimating = useSharedValue(false);
  const isEditingTextSharedValue = useSharedValue<number | null>(null);
  const nodeNodeContainerViewHeight = useSharedValue(0);

  const snapPoints = useDerivedValue(() => [
    BOTTOMSHEET_LOW_HEIGHT,
    isEditingTextSharedValue.value !== null ? 200 : BOTTOMSHEET_MID_HEIGHT,
    "100%",
  ]);

  useFrameCallback(() => {
    /* when the nodeNoteContainer's view changes animated height that new value is passed to the NodeNote
    so it can respond to it once the height change is completed */
    if (!nodeNoteContainerViewRef) return;
    const measurement = measure(nodeNoteContainerViewRef);
    if (measurement) nodeNodeContainerViewHeight.value = measurement.height;
  });

  const [viewportMeasurements, setViewportMeasurements] =
    useState<SizeDimensions | null>(null);
  const [bottomSheetHandleHeight, setBottomSheetHandleHeight] = useState(0);

  useEffect(() => {
    saveClimb();
    selectedNodePosition.value = null;
    selectedNodeIndex.value = null;
    isSelectingNode.value = false;
  }, [nodes]);

  useEffect(() => {
    if (!climb.fileName) {
      setIsEditingTitle(true);
    } else {
      setNewClimbName(climb.fileName);
    }
    setNodes(climb.nodes);
    isEditingTextSharedValue.value = null;
  }, []);

  useAnimatedReaction(
    () => transform.value[0],
    (currentVal) => {
      if (isAnimating.value) baseScale.value = currentVal;
    }
  );

  const getTransformPosition = (
    coordinate: number,
    scale: number,
    axis: "x" | "y"
  ) => {
    "worklet";
    if (!viewportMeasurements) return 0;
    const position =
      getCurrentNodePosition(coordinate, scale, NODE_SIZE_OFFSET) -
      (viewportMeasurements[axis === "x" ? "width" : "height"] * scale) / 2;
    const imageWidth =
      viewportMeasurements.height *
      (climb.imageProps.width / climb.imageProps.height);
    const mD =
      axis === "x"
        ? Math.abs(
            Math.min((viewportMeasurements.width - imageWidth * scale) / 2, 0)
          )
        : (viewportMeasurements.height * scale - viewportMeasurements.height) /
          2;
    return Math.max(-mD, Math.min(mD, -position)) - NODE_SIZE_OFFSET;
  };

  const animateToNodePosition = (
    nodeX: number,
    nodeY: number,
    scale: number
  ) => {
    "worklet";
    isAnimating.value = true;
    transform.value = withTiming(
      [
        scale,
        0,
        getTransformPosition(nodeX, scale, "x"),
        0,
        scale,
        getTransformPosition(nodeY, scale, "y"),
        0,
        0,
        1,
      ],
      {},
      () => {
        isAnimating.value = false;
        baseScale.value = transform.value[0];
      }
      //  prevents a ts error
    ) as unknown as Matrix3;
  };

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
      // this is to kick off the animation reaction in NodeNoteContainer
      // TODO: can this just be a state change instead of an animation?
      isHandlePressOpening.value = true;
    } else {
      runOnJS(handleCloseBottomSheet)();
    }
  });

  return (
    <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
      {isEditingTitle && (
        // show grey transparent overlay if the title is being edited
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
              viewportMeasurements,
              imageProps: climb.imageProps,
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
              viewportMeasurements,
              setViewportMeasurements,
              isAnimating,
            }}
          />
          <View style={{ flex: 1, zIndex: 10 }}>
            <BottomSheet
              handleComponent={(props) => (
                <GestureDetector gesture={tapBottomSheetHandle}>
                  <View
                    onLayout={({ nativeEvent }) => {
                      setBottomSheetHandleHeight(nativeEvent.layout.height);
                    }}
                  >
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
                          marginBottom: 20,
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
              onChange={(currentIndex) => {
                if (!currentIndex) isEditingTextSharedValue.value = null;
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  width: "100%",
                  height: 1000,
                  backgroundColor: "white",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 30,
                }}
              >
                <Animated.View
                  ref={nodeNoteContainerViewRef}
                  style={[
                    { width: "100%" },
                    useAnimatedStyle(() => {
                      if (!viewportMeasurements) return {};
                      let height: string | number = "100%";
                      if (bottomSheetIndex.value <= 1)
                        height =
                          BOTTOMSHEET_MID_HEIGHT - bottomSheetHandleHeight - 30;
                      if (
                        bottomSheetIndex.value === 1 &&
                        isEditingTextSharedValue.value !== null
                      ) {
                        height = 106;
                      }
                      return {
                        // this ensures the bottom of the FlatList in the NodeContainer will always have its height set to the bottom of the drawer
                        height,
                      };
                    }),
                  ]}
                  collapsable={false}
                >
                  <NodeNoteContainer
                    {...{
                      nodes,
                      setNodes,
                      bottomSheetIndex,
                      isHandlePressOpening,
                      handleOpenBottomSheet,
                      animateToNodePosition,
                      isEditingTextSharedValue,
                      nodeNodeContainerViewHeight,
                    }}
                  />
                </Animated.View>
              </View>
            </BottomSheet>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Pressable>
  );
};

export default ImageViewer;
