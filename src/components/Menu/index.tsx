import { Button, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { File, SetCurrentFileState } from "../../../App";
import { IMAGE_DIR } from "./index.constants";

interface MenuProps {
  setCurrentFile: SetCurrentFileState;
}

const Menu = ({ setCurrentFile }: MenuProps) => {
  const [savedFiles, setSavedFiles] = useState<File[]>([]);
  const [isRequestingDeletingFiles, setIsRequestingDeletingFiles] =
    useState(false);

  const loadFiles = async () => {
    const files = [];
    for (const fileId of await AsyncStorage.getAllKeys()) {
      const file = await AsyncStorage.getItem(fileId);
      if (file) files.push(JSON.parse(file));
    }
    await setSavedFiles(files);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFile = async (file: File) => {
    // await setImageProps(file.imageProps);
    await setCurrentFile(file);
    // await setNodes(file.nodes);
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });
    if (result.canceled) return;
    const { uri, height, width } = result.assets[0];
    // await setImageProps({ uri, height, width });
    await setCurrentFile({
      fileId: Crypto.randomUUID(),
      fileName: null,
      imageProps: { uri, height, width },
      nodes: [],
    });
  };

  const deleteAllFiles = async () => {
    await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
    await FileSystem.deleteAsync(IMAGE_DIR);
    await setSavedFiles([]);
    await setIsRequestingDeletingFiles(false);
  };

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
              title={savedFile.fileName || ""}
            />
          ))}
        </>
      ) : null}
    </View>
  );
};

export default Menu;
