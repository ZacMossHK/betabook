import Animated, {
  interpolate,
  measure,
  runOnJS,
  runOnUI,
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
  Nodes,
  SizeDimensions,
  TransformableMatrix3,
} from "../src/components/ImageViewer/index.types";
import { Matrix3, identity3 } from "react-native-redash";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMatrix } from "../src/helpers/matrixTransformers/utils";
import ImageContainer from "../src/components/ImageContainer";
import {
  Keyboard,
  KeyboardMetrics,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
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
import MovementNodeContainer from "../src/components/MovementNodeContainer";

const BOTTOMSHEET_LOW_HEIGHT = 60;
const BOTTOMSHEET_MID_HEIGHT = 369;
const BOTTOMSHEET_MID_EDIT_HEIGHT = 200;

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
  const editedNodeIndex = useSharedValue<number | null>(null);
  const isNodeNoteContainerHeightChangeComplete = useSharedValue(false);
  const openBottomSheetHeight = useSharedValue(0);
  const openBottomSheetScaleDownPositionAdjustmentY = useSharedValue(0);
  const bottomSheetPosition = useSharedValue(0);
  const preAnimationYPostion = useSharedValue<number | null>(null);
  const hasHitTopEdge = useSharedValue(false);

  const imageMatrix = useDerivedValue(() =>
    getMatrix(
      {
        x: translation.value.x,
        y:
          translation.value.y -
          openBottomSheetScaleDownPositionAdjustmentY.value,
      },
      origin.value,
      pinchScale.value,
      transform.value
    )
  );

  const [viewportMeasurements, setViewportMeasurements] =
    useState<SizeDimensions | null>(null);
  const [bottomSheetHandleHeight, setBottomSheetHandleHeight] = useState(0);
  const [keyboardMetrics, setKeyboardMetrics] =
    useState<KeyboardMetrics | null>(null);

  const imageHeight = viewportMeasurements
    ? viewportMeasurements.width *
      (climb.imageProps.height / climb.imageProps.width)
    : 0;
  const imageWidth = viewportMeasurements
    ? viewportMeasurements.height *
      (climb.imageProps.width / climb.imageProps.height)
    : 0;

  // this animates the image to translate down if, when the bottom drawer closes, it would be higher than the low edge max distance
  useAnimatedReaction(
    () => bottomSheetIndex.value,
    (currentVal, prevVal) => {
      if (!viewportMeasurements) return;
      const maxDistanceYLowEdge = Math.min(
        (viewportMeasurements.height - imageHeight * imageMatrix.value[0]) / 2,
        0
      );
      if (
        (preAnimationYPostion.value === null
          ? transform.value[5]
          : preAnimationYPostion.value) > maxDistanceYLowEdge ||
        transform.value[5] >= 0 ||
        prevVal === null ||
        currentVal > 1 ||
        currentVal > prevVal
      )
        return;
      if (!isAnimating.value) isAnimating.value = true;
      if (hasHitTopEdge.value) hasHitTopEdge.value = false;
      if (preAnimationYPostion.value === null)
        preAnimationYPostion.value = transform.value[5];
      const newMatrix = [...transform.value] as TransformableMatrix3;
      newMatrix[5] = interpolate(
        currentVal,
        [1, 0],
        [preAnimationYPostion.value, maxDistanceYLowEdge]
      );
      transform.value = newMatrix as Matrix3;
    }
  );

  const snapPoints = useDerivedValue(() => [
    BOTTOMSHEET_LOW_HEIGHT,
    editedNodeIndex.value !== null
      ? BOTTOMSHEET_MID_EDIT_HEIGHT
      : BOTTOMSHEET_MID_HEIGHT,
    "100%",
  ]);

  useFrameCallback(() => {
    /* when the nodeNoteContainer's view changes animated height that new value is passed to the NodeNote
    so it can respond to it once the height change is completed */

    /* this guard block means measurements only check the height when necessary 
    the main reason for this is to stop reanimated's view flattening warnings when measuring as the imageViewer screen unmounts*/

    if (
      (editedNodeIndex.value !== null &&
        isNodeNoteContainerHeightChangeComplete.value) ||
      editedNodeIndex.value === null ||
      !nodeNoteContainerViewRef
    ) {
      return;
    }
    const measurement = measure(nodeNoteContainerViewRef);
    if (measurement && Math.floor(measurement.height) === 105)
      isNodeNoteContainerHeightChangeComplete.value = true;
  });

  useEffect(() => {
    saveClimb();
    selectedNodePosition.value = null;
    selectedNodeIndex.value = null;
    isSelectingNode.value = false;
  }, [nodes]);

  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", () => {
      const newKeyboardMetrics = Keyboard.metrics();
      if (
        !newKeyboardMetrics ||
        (keyboardMetrics &&
          keyboardMetrics.height === newKeyboardMetrics.height)
      )
        return;
      setKeyboardMetrics(newKeyboardMetrics);
    });

    if (!climb.fileName) {
      setIsEditingTitle(true);
    } else {
      setNewClimbName(climb.fileName);
    }
    setNodes(climb.nodes);
    editedNodeIndex.value = null;
  }, []);

  const getTransformPosition = (
    coordinate: number,
    scale: number,
    axis: "x" | "y"
  ) => {
    "worklet";
    if (!viewportMeasurements) return 0;
    const viewportMeasurementsDimension =
      viewportMeasurements[axis === "x" ? "width" : "height"];
    const position =
      getCurrentNodePosition(coordinate, scale, NODE_SIZE_OFFSET) -
      (viewportMeasurementsDimension * scale) / 2;
    const newMaxDistanceAfterScaling = Math.abs(
      Math.min(
        (viewportMeasurementsDimension -
          (axis === "x" ? imageWidth : imageHeight) * scale) /
          2,
        0
      )
    );
    return axis === "x"
      ? Math.max(
          -newMaxDistanceAfterScaling,
          Math.min(newMaxDistanceAfterScaling, -position)
        ) - NODE_SIZE_OFFSET
      : Math.max(
          -(newMaxDistanceAfterScaling + openBottomSheetHeight.value),
          Math.min(
            newMaxDistanceAfterScaling,
            -position - openBottomSheetHeight.value / 2
          )
        );
  };

  const animateToNodePosition = (index: number, scale: number) => {
    "worklet";
    isAnimating.value = true;
    const transformResult = [
      scale,
      0,
      getTransformPosition(nodes[index].x, scale, "x"),
      0,
      scale,
      getTransformPosition(nodes[index].y, scale, "y"),
      0,
      0,
      1,
    ];
    transform.value = withTiming(
      transformResult,
      {},
      () => {
        isAnimating.value = false;
        baseScale.value = transform.value[0];
      }
      //  prevents a ts error
    ) as unknown as Matrix3;
  };

  useAnimatedReaction(
    () =>
      editedNodeIndex.value !== null &&
      keyboardMetrics !== null &&
      bottomSheetIndex.value === 1,
    (currentVal, prevVal) => {
      if (
        currentVal &&
        !prevVal &&
        // prevents ts errors
        editedNodeIndex.value !== null &&
        keyboardMetrics
      ) {
        openBottomSheetHeight.value =
          BOTTOMSHEET_MID_EDIT_HEIGHT -
          BOTTOMSHEET_LOW_HEIGHT +
          keyboardMetrics.height;
        animateToNodePosition(editedNodeIndex.value, 4);
      }
    }
  );

  useAnimatedReaction(
    () => editedNodeIndex.value === null && bottomSheetIndex.value === 1,
    (currentVal) => {
      if (currentVal) {
        openBottomSheetHeight.value =
          BOTTOMSHEET_MID_HEIGHT - BOTTOMSHEET_LOW_HEIGHT;
      }
    }
  );

  const handleOpenBottomSheet = () => bottomSheetRef.current?.snapToIndex(1);
  const handleCloseBottomSheet = () => bottomSheetRef.current?.snapToIndex(0);

  const handleSettingNodes = useCallback(
    async (setNodesCallback: (prevNodes: Nodes) => Nodes) => {
      await setNodes(setNodesCallback);
    },
    []
  );

  const tapBottomSheetHandle = Gesture.Tap().onStart(() => {
    if (!bottomSheetIndex.value) {
      runOnJS(handleOpenBottomSheet)();
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
              openBottomSheetHeight,
              isAnimating,
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
              openBottomSheetHeight,
              editedNodeIndex,
              openBottomSheetScaleDownPositionAdjustmentY,
              bottomSheetPosition,
              hasHitTopEdge,
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
                        Edit moves
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
              animatedPosition={bottomSheetPosition}
              onChange={(currentIndex) => {
                if (!currentIndex) {
                  editedNodeIndex.value = null;
                  preAnimationYPostion.value = null;
                  openBottomSheetHeight.value = 0;
                  isAnimating.value = false;
                }
                if (currentIndex === 1)
                  openBottomSheetHeight.value =
                    BOTTOMSHEET_MID_HEIGHT - BOTTOMSHEET_LOW_HEIGHT;
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
                        editedNodeIndex.value !== null
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
                      editedNodeIndex,
                      isNodeNoteContainerHeightChangeComplete,
                      handleSettingNodes,
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
