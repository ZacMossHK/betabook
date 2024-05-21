import { Button, SafeAreaView, Text, View } from "react-native";
import { ImageProps, Nodes } from "../src/components/ImageViewer/index.types";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useClimb } from "../src/providers/ClimbProvider";
import { useCallback, useState } from "react";
import devCurrentFile from "../devData/devCurrentfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { IMAGE_DIR } from "../src/components/Menu/index.constants";

export interface File {
  fileId: string;
  fileName: string | null;
  imageProps: ImageProps;
  nodes: Nodes;
}

export type SetCurrentFileState = React.Dispatch<
  React.SetStateAction<File | null>
>;

const Menu = () => {
  const router = useRouter();
  const { climb, setClimb, clearClimb } = useClimb();

  const [savedFiles, setSavedFiles] = useState<File[]>([]);
  const [isRequestingDeletingFiles, setIsRequestingDeletingFiles] =
    useState(false);

  const loadFiles = async () => {
    const files = [];
    // file for development only
    if (process.env.EXPO_PUBLIC_NODES_NUM || process.env.EXPO_PUBLIC_DEV_IMG)
      files.push(devCurrentFile());
    for (const fileId of await AsyncStorage.getAllKeys()) {
      const file = await AsyncStorage.getItem(fileId);
      if (file) files.push(JSON.parse(file));
    }
    await setSavedFiles(files);
  };

  useFocusEffect(
    useCallback(() => {
      if (climb) clearClimb();
      loadFiles();
    }, [])
  );

  const loadFile = async (file: File) => {
    await setClimb(file);
    router.navigate("imageViewer");
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });
    if (result.canceled) return;
    const { uri, height, width } = result.assets[0];
    await setClimb({
      fileId: randomUUID(),
      fileName: null,
      imageProps: { uri, height, width },
      nodes: [],
    });

    router.navigate("imageViewer");
  };

  const deleteAllFiles = async () => {
    await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
    await FileSystem.deleteAsync(IMAGE_DIR);
    await setSavedFiles([]);
    await setIsRequestingDeletingFiles(false);
  };
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F55536",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Text
        style={{
          color: "white",
          fontSize: 69,
          marginBottom: 29,
          fontFamily: "InriaSerif_400Regular",
        }}
      >
        Betabook
      </Text>
      <View>
        <TouchableOpacity
          style={{ backgroundColor: "#D6EFFF", borderRadius: 15, padding: 9 }}
          onPress={pickImage}
        >
          <Text
            style={{
              fontSize: 19,
              fontFamily: "InriaSans_700Bold",
              color: "#14281D",
            }}
          >
            Create new
          </Text>
        </TouchableOpacity>
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
    </SafeAreaView>
  );
};

export default Menu;
