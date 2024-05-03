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
import * as ImagePicker from "expo-image-picker";
import getDevImageProps from "../../../devData/getDevImageProps";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const imageDir = FileSystem.documentDirectory + "images/";

interface File {
  fileId: string;
  fileName: string | null;
  imageProps: ImageProps;
  nodes: Nodes;
}

const ImageViewer = () => {
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
  const [savedFiles, setSavedFiles] = useState<File[]>([]);
  const [currentFileName, setCurrentFileName] = useState("");
  const [isRequestingDeletingFiles, setIsRequestingDeletingFiles] =
    useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const loadFiles = async () => {
    const files = [];
    for (const fileId of await AsyncStorage.getAllKeys()) {
      const file = await AsyncStorage.getItem(fileId);
      if (file) files.push(JSON.parse(file));
    }
    await setSavedFiles(files);
  };

  useEffect(() => {
    if (imageProps) return;
    loadFiles();
  }, [imageProps]);

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

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });
    if (result.canceled) return;
    const { uri, height, width } = result.assets[0];
    await setImageProps({ uri, height, width });
    await setCurrentFile({
      fileId: Crypto.randomUUID(),
      fileName: null,
      imageProps: { uri, height, width },
      nodes: [],
    });
  };

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

  const loadFile = async (file: File) => {
    await setImageProps(file.imageProps);
    await setCurrentFile(file);
    await setNodes(file.nodes);
  };

  const deleteAllFiles = async () => {
    await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
    await FileSystem.deleteAsync(imageDir);
    await setSavedFiles([]);
    await setIsRequestingDeletingFiles(false);
  };

  if (!currentFile)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button onPress={pickImage} title="choose your image" color="green" />
        {savedFiles.length ? (
          <>
            {isRequestingDeletingFiles ? (
              <>
                <Button
                  onPress={deleteAllFiles}
                  title="Confirm file Deletion - cannot be undone!"
                  color="red"
                />
                <Button
                  title="Cancel"
                  onPress={() => setIsRequestingDeletingFiles(false)}
                />
              </>
            ) : (
              <Button
                onPress={() => setIsRequestingDeletingFiles(true)}
                title="Delete all files"
                color="red"
              />
            )}
            {savedFiles.map((savedFile, index) => (
              <Button
                onPress={() => loadFile(savedFile)}
                key={index}
                title={savedFile.fileName}
              />
            ))}
          </>
        ) : null}
      </View>
    );

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
