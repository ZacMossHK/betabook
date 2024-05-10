import Animated, {
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { Coordinates, ImageProps, Nodes, SizeDimensions } from "./index.types";
import { identity3 } from "react-native-redash";
import populateNodes from "../../../devData/populateNodes";
import { useEffect, useState } from "react";
import { getMatrix } from "../../helpers/matrixTransformers/utils";
import MovementNodeContainer from "../MovementNodeContainer";
import ImageContainer from "../ImageContainer";
import { Alert, Button, Text, TextInput, View } from "react-native";
import getDevImageProps from "../../../devData/getDevImageProps";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, SetCurrentFileState } from "../../../App";
import { IMAGE_DIR } from "../Menu/index.constants";
import { FlatList, TouchableOpacity } from "react-native-gesture-handler";

interface ImageViewerProps {
  currentFile: File;
  setCurrentFile: SetCurrentFileState;
}

const ImageViewer = ({ currentFile, setCurrentFile }: ImageViewerProps) => {
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

  const [nodes, setNodes] = useState<Nodes>(populateNodes());
  const [imageProps, setImageProps] = useState<ImageProps | null>(
    process.env.EXPO_PUBLIC_DEV_IMG ? getDevImageProps() : null
  );
  const [currentFileName, setCurrentFileName] = useState("");
  const [viewportMeasurements, setViewportMeasurements] =
    useState<SizeDimensions | null>(null);
  const [isDisplayingNodeNotes, setIsDisplayingNodeNotes] = useState(false);

  const initialiseImageViewer = async () => {
    await setNodes(currentFile.nodes);
    await setImageProps(currentFile.imageProps);
  };

  useEffect(() => {
    initialiseImageViewer();
  }, []);

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
      fileId: currentFile.fileId,
      imageProps: currentFile.imageProps,
      nodes,
      fileName: currentFileName || currentFile.fileName,
    };
    const imageFileUri = `${IMAGE_DIR}${currentFile.fileId}${getImageExtension(
      currentFile.imageProps.uri
    )}`;
    // if image doesn't exist on local storage, copy it over
    if (!(await FileSystem.getInfoAsync(imageFileUri)).exists) {
      await FileSystem.copyAsync({
        from: currentFile.imageProps.uri,
        to: imageFileUri,
      });
      newFile.imageProps = { ...newFile.imageProps, uri: imageFileUri };
    }
    await AsyncStorage.setItem(currentFile.fileId, JSON.stringify(newFile));
    Alert.alert("File saved!");
  };

  const NodeData = ({ node }) => {
    const [isEditingText, setIsEditingText] = useState(false);
    return isEditingText ? (
      <TouchableOpacity onPress={() => setIsEditingText(false)}>
        <TextInput
          style={{
            backgroundColor: "white",
            height: 40,
            textAlign: "center",
          }}
          placeholder={currentFile.fileName || "enter route name here"}
          onChangeText={setCurrentFileName}
        />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity onPress={() => setIsEditingText(true)}>
        <Text style={{ color: "white", padding: 20 }}>
          x={node.x} y={node.y}
        </Text>
      </TouchableOpacity>
    );
  };
  if (!imageProps) return;

  return (
    <Animated.View collapsable={false} style={{ flex: 1 }}>
      {isDisplayingNodeNotes && (
        <View style={{ height: "100%", zIndex: 10, backgroundColor: "black" }}>
          <FlatList
            style={
              {
                // height: "80%",
                // width: "100%",
              }
            }
            data={nodes}
            renderItem={({ item }) => <NodeData node={item} />}
          />
          <View style={{ bottom: "10%" }}>
            <Button
              title="back"
              onPress={() => {
                setIsDisplayingNodeNotes(false);
              }}
            />
          </View>
        </View>
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
        <TextInput
          style={{
            backgroundColor: "white",
            height: 40,
            textAlign: "center",
          }}
          placeholder={currentFile.fileName || "enter route name here"}
          onChangeText={setCurrentFileName}
        />
        <Button onPress={saveImage} color="red" title="save" />
        <Button title="menu" onPress={() => setCurrentFile(null)} />
        <Button
          title="nodes"
          color="orange"
          onPress={() => setIsDisplayingNodeNotes(true)}
        />
      </View>
    </Animated.View>
  );
};

export default ImageViewer;
