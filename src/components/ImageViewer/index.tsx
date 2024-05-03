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

const imageDir = FileSystem.documentDirectory + "images/";

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
  const [savedFiles, setSavedFiles] = useState([]);
  const [newFileName, setNewFileName] = useState("");
  const [isRequestingDeletingFiles, setIsRequestingDeletingFiles] =
    useState(false);

  const loadFiles = async () => {
    const files = [];
    for (const fileId of await AsyncStorage.getAllKeys()) {
      const file = await AsyncStorage.getItem(fileId);
      if (file)
        files.push({
          fileId,
          fileName: JSON.parse(file).fileName,
        });
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
    setImageProps({ uri, height, width });
  };

  const getImageId = (uri: string) => {
    const splitUri = uri.split("/");
    return splitUri[splitUri.length - 1];
  };

  const saveImage = async (uri: string) => {
    // creates the image directory if it doesn't exist
    if (!(await FileSystem.getInfoAsync(imageDir)).exists)
      await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
    const imageId = getImageId(uri);
    const imageFileUri = `${imageDir}${imageId}`;
    if (!(await FileSystem.getInfoAsync(imageFileUri)).exists)
      await FileSystem.copyAsync({ from: uri, to: imageFileUri });
    const fileInfo = {
      imageProps,
      nodes,
      fileName: newFileName,
    };
    await AsyncStorage.setItem(imageId, JSON.stringify(fileInfo));
    // TODO: add node saving here
    Alert.alert("File saved!");
  };

  const loadFile = async (fileName: string) => {
    const fileInfo = await FileSystem.getInfoAsync(imageDir + fileName);
    const file = JSON.parse(await AsyncStorage.getItem(fileName));
    // TODO: replace this with saved height and width from expo image picker
    console.log(file);
    await setImageProps({
      uri: fileInfo.uri,
      height: 564.7058905153186,
      width: 423.5294189453125,
    });
    await setNodes(file.nodes);
  };

  const deleteAllFiles = async () => {
    await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
    await FileSystem.deleteAsync(imageDir);
    await setSavedFiles([]);
    await setIsRequestingDeletingFiles(false);
  };

  if (!imageProps)
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
                onPress={() => loadFile(savedFile.fileId)}
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
          placeholder="Enter file name"
          onChangeText={setNewFileName}
        />
        <Button
          onPress={() => saveImage(imageProps.uri)}
          color="red"
          title="save"
        />
        <Button
          title="menu"
          onPress={() => {
            setImageProps(null);
            setNodes([]);
          }}
        />
      </View>
    </Animated.View>
  );
};

export default ImageViewer;
