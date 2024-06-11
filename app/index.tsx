import { Button, Dimensions, SafeAreaView, Text, View } from "react-native";
import { ImageProps, Nodes } from "../src/components/ImageViewer/index.types";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { FlatList, TouchableOpacity } from "react-native-gesture-handler";
import { useClimb } from "../src/providers/ClimbProvider";
import { useCallback, useState } from "react";
import devCurrentFile from "../devData/devCurrentfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { IMAGE_DIR } from "../src/components/Menu/index.constants";
import { CLIMB_TILE_WIDTH } from "../src/components/ClimbTile/index.constants";
import ClimbTile from "../src/components/ClimbTile";

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
  const { setClimb, clearClimb } = useClimb();

  const [savedFiles, setSavedFiles] = useState<File[]>([]);
  const [isRequestingDeletingFiles, setIsRequestingDeletingFiles] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = async () => {
    const files: File[] = [];
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
      setIsLoading(false);
      clearClimb();
      loadFiles();
    }, [])
  );

  const loadFile = async (fileId: string) => {
    await setIsLoading(true);
    const file = savedFiles.find((savedFile) => savedFile.fileId === fileId);
    if (!file) return;
    await setClimb(file);
    router.navigate("imageViewer");
  };

  const pickImage = async () => {
    await setIsLoading(true);
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });
    if (result.canceled) {
      await setIsLoading(false);
      return;
    }
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

  const deleteFile = async (fileId: string, imagePath: string) => {
    await AsyncStorage.removeItem(fileId);
    await FileSystem.deleteAsync(imagePath);
    await setSavedFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      return newFiles.filter((file) => file.fileId !== fileId);
    });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F55536",
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          alignContent: "center",
          justifyContent: "center",
          alignItems: "center",
          bottom: 0,
          position: "absolute",
          width: "100%",
        }}
      >
        {/* delete all files button for development only */}
        {savedFiles.length ? (
          isRequestingDeletingFiles ? (
            <>
              <Button
                onPress={deleteAllFiles}
                title="Confirm file Deletion - cannot be undone!"
                color="red"
                disabled={isLoading}
              />
              <Button
                title="Cancel"
                onPress={() => setIsRequestingDeletingFiles(false)}
                disabled={isLoading}
              />
            </>
          ) : (
            <Button
              onPress={() => setIsRequestingDeletingFiles(true)}
              title="Delete all files - DEBUG!"
              color="red"
              disabled={isLoading}
            />
          )
        ) : null}
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
            disabled={isLoading}
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
        </View>
        <View
          style={{
            marginTop: 29,
            backgroundColor: "white",
            height: 572,
            width: "100%",
            bottom: 0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <Text
            style={{
              width: "100%",
              height: 52,
              fontSize: 19,
              fontFamily: "InriaSans_700Bold",
              textAlignVertical: "center",
              textAlign: "center",
            }}
          >
            Your climbs
          </Text>
          <FlatList
            contentContainerStyle={{}}
            columnWrapperStyle={{
              justifyContent: "space-evenly",
              paddingBottom:
                (Dimensions.get("screen").width - CLIMB_TILE_WIDTH * 2) / 3,
            }}
            style={{
              opacity: isLoading ? 0.5 : 1,
            }}
            scrollEnabled={!isLoading}
            data={
              !(savedFiles.length % 2)
                ? savedFiles
                : [
                    ...savedFiles,
                    {
                      fileId: randomUUID(),
                      fileName: "",
                      imageProps: { width: 0, height: 0, uri: "" },
                      nodes: [],
                    },
                  ]
            }
            numColumns={2}
            keyExtractor={(item) => item.fileId}
            ListEmptyComponent={() => (
              <Text
                style={{
                  width: "100%",
                  textAlign: "center",
                  fontFamily: "InriaSans_400Regular",
                  fontSize: 19,
                }}
              >
                No climbs!
              </Text>
            )}
            renderItem={({ item }) => (
              <ClimbTile
                deleteFile={deleteFile}
                fileName={item.fileName}
                fileId={item.fileId}
                uri={item.imageProps.uri}
                loadFile={loadFile}
                isLoading={isLoading}
              />
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Menu;
