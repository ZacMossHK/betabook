import Animated, {
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import {
  Coordinates,
  ImageProps,
  Nodes,
  SizeDimensions,
} from "../src/components/ImageViewer/index.types";
import { identity3 } from "react-native-redash";
import { useEffect, useState } from "react";
import { getMatrix } from "../src/helpers/matrixTransformers/utils";
import MovementNodeContainer from "../src/components/MovementNodeContainer";
import ImageContainer from "../src/components/ImageContainer";
import {
  Alert,
  Button,
  Keyboard,
  Pressable,
  SafeAreaView,
  TextInput,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IMAGE_DIR } from "../src/components/Menu/index.constants";
import NodeNoteContainer from "../src/components/NodeNoteContainer";
import {
  GestureHandlerRootView,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { useClimb } from "../src/providers/ClimbProvider";
import { Stack, useRouter } from "expo-router";
import { useIsEditingTitle } from "../src/providers/EditingTitleProvider";

const ImageViewer = () => {
  const { climb, setClimb } = useClimb();
  const { isEditingTitle } = useIsEditingTitle();
  const router = useRouter();

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

  const [nodes, setNodes] = useState<Nodes>(climb.nodes);
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
  }, [nodes]);

  const imageMatrix = useDerivedValue(() =>
    getMatrix(
      translation.value,
      origin.value,
      pinchScale.value,
      transform.value
    )
  );

  const getImageExtension = (uri: string) => {
    const splitUri = uri.split(".");
    return splitUri[splitUri.length - 1];
  };

  const saveImage = async () => {
    // creates the image directory if it doesn't exist
    if (!(await FileSystem.getInfoAsync(IMAGE_DIR)).exists)
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    const newFile = {
      ...climb,
      nodes,
      fileName: currentFileName || climb.fileName,
    };
    const imageFileUri = `${IMAGE_DIR}${climb.fileId}${getImageExtension(
      climb.imageProps.uri
    )}`;
    // if image doesn't exist on local storage, copy it over
    if (!(await FileSystem.getInfoAsync(imageFileUri)).exists) {
      await FileSystem.copyAsync({
        from: climb.imageProps.uri,
        to: imageFileUri,
      });
      newFile.imageProps = { ...newFile.imageProps, uri: imageFileUri };
    }
    await AsyncStorage.setItem(climb.fileId, JSON.stringify(newFile));
    Alert.alert("File saved!");
  };

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
        <Stack.Screen options={{ title: climb.name }} />
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
            <Button onPress={saveImage} color="red" title="save" />
            <Button
              title="menu"
              onPress={() => {
                setClimb(null);
                router.back();
              }}
            />
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
