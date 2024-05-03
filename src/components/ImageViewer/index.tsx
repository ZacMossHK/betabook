import Animated, {
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { Coordinates, ImageProps, Nodes } from "./index.types";
import { identity3 } from "react-native-redash";
import populateNodes from "../../../devData/populateNodes";
import { useEffect, useState } from "react";
import { getMatrix } from "../../helpers/matrixTransformers/utils";
import MovementNodeContainer from "../MovementNodeContainer";
import ImageContainer from "../ImageContainer";
import { Alert, Button, TextInput, View } from "react-native";
import getDevImageProps from "../../../devData/getDevImageProps";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const imageDir = FileSystem.documentDirectory + "images/";

interface File {
  fileId: string;
  fileName: string | null;
  imageProps: ImageProps;
  nodes: Nodes;
}

const ImageViewer = ({ currentFile, setCurrentFile }) => {
  const ref = useAnimatedRef();

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
    if (!currentFile) return;
    // creates the image directory if it doesn't exist
    if (!(await FileSystem.getInfoAsync(imageDir)).exists)
      await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
    // if image doesn't exist on local storage, copy it over
    const newFile = {
      fileId: currentFile.fileId,
      imageProps: currentFile.imageProps,
      nodes,
      fileName: currentFileName || currentFile.fileName,
    };
    const imageFileUri = `${imageDir}${currentFile.fileId}${getImageExtension(
      currentFile.imageProps.uri
    )}`;
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

  if (!imageProps) return;

  return (
    <Animated.View collapsable={false} style={{ flex: 1 }}>
      <MovementNodeContainer
        {...{
          selectedNodeIndex,
          selectedNodePosition,
          nodes,
          setNodes,
          imageMatrix,
          isViewRendered,
          innerRef: ref,
          maxDistance,
          isSelectingNode,
          isTranslatingNode,
          baseScale,
          pinchScale,
          imageProps,
        }}
      />
      <ImageContainer
        {...{
          innerRef: ref,
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
        <Button
          title="menu"
          onPress={() => {
            setImageProps(null);
            setNodes([]);
            setCurrentFileName("");
            setCurrentFile(null);
          }}
        />
      </View>
    </Animated.View>
  );
};

export default ImageViewer;
