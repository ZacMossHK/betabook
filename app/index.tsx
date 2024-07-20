import { Button, Dimensions, SafeAreaView, Text, View } from "react-native";
import { ImageProps, Nodes } from "../src/components/ImageViewer/index.types";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { FlatList, TouchableOpacity } from "react-native-gesture-handler";
import { useClimb } from "../src/providers/ClimbProvider";
import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { IMAGE_DIR } from "../src/components/Menu/index.constants";
import { CLIMB_TILE_WIDTH } from "../src/components/ClimbTile/index.constants";
import ClimbTile from "../src/components/ClimbTile";
import { isClimb } from "../src/helpers/typeGuards/typeGuards";
import { PRIMARY_BUTTON_COLOUR } from "../src/components/PrimaryButton/index.constants";
import devCurrentClimb from "../devData/devCurrentClimb";

export interface Climb {
  id: string;
  name: string | null;
  imageProps: ImageProps;
  nodes: Nodes;
}

export type SetCurrentFileState = React.Dispatch<
  React.SetStateAction<File | null>
>;

const Menu = () => {
  const router = useRouter();
  const { setClimb, clearClimb } = useClimb();

  const [savedClimbs, setSavedClimbs] = useState<Climb[]>([]);
  const [isRequestingDeletingFiles, setIsRequestingDeletingClimbs] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadClimbs = async () => {
    const climbs: Climb[] = [];
    // file for development only
    if (process.env.EXPO_PUBLIC_NODES_NUM || process.env.EXPO_PUBLIC_DEV_IMG)
      climbs.push(devCurrentClimb());

    for (const id of await AsyncStorage.getAllKeys()) {
      const item = await AsyncStorage.getItem(id);
      if (!item) continue;
      const parsedItem = JSON.parse(item) as Climb | unknown;
      if (!isClimb(parsedItem)) continue;
      climbs.push(parsedItem);
    }

    await setSavedClimbs(climbs);
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(false);
      clearClimb();
      loadClimbs();
    }, [])
  );

  const loadClimb = async (id: string) => {
    await setIsLoading(true);
    const climb = savedClimbs.find((savedClimb) => savedClimb.id === id);
    if (!climb) return;
    await setClimb(climb);
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
      id: randomUUID(),
      name: null,
      imageProps: { uri, height, width },
      nodes: [],
    });

    router.navigate("imageViewer");
  };

  const deleteAllClimbs = async () => {
    await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
    await FileSystem.deleteAsync(IMAGE_DIR);
    await setSavedClimbs([]);
    await setIsRequestingDeletingClimbs(false);
  };

  const deleteClimb = async (id: string, imagePath: string) => {
    await AsyncStorage.removeItem(id);
    await FileSystem.deleteAsync(imagePath);
    await setSavedClimbs((prevClimbs) => {
      const newClimbs = [...prevClimbs];
      return newClimbs.filter((climb) => climb.id !== id);
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
        {savedClimbs.length &&
        process.env.EXPO_PUBLIC_ENVIRONMENT === "testing" ? (
          isRequestingDeletingFiles ? (
            <>
              <Button
                onPress={deleteAllClimbs}
                title="Confirm file Deletion - cannot be undone!"
                color="red"
                disabled={isLoading}
              />
              <Button
                title="Cancel"
                onPress={() => setIsRequestingDeletingClimbs(false)}
                disabled={isLoading}
              />
            </>
          ) : (
            <Button
              onPress={() => setIsRequestingDeletingClimbs(true)}
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
            style={{
              backgroundColor: PRIMARY_BUTTON_COLOUR,
              borderRadius: 15,
              padding: 9,
            }}
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
              !(savedClimbs.length % 2)
                ? savedClimbs
                : [
                    ...savedClimbs,
                    {
                      id: randomUUID(),
                      name: "",
                      imageProps: { width: 0, height: 0, uri: "" },
                      nodes: [],
                    },
                  ]
            }
            numColumns={2}
            keyExtractor={(item) => item.id}
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
                deleteClimb={deleteClimb}
                name={item.name}
                id={item.id}
                uri={item.imageProps.uri}
                loadClimb={loadClimb}
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
