import { Stack } from "expo-router";
import ClimbProvider, { useClimb } from "../src/providers/ClimbProvider";
import {
  GestureHandlerRootView,
  TextInput,
} from "react-native-gesture-handler";
import {
  Keyboard,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import IsEditingTitleProvider, {
  useIsEditingTitle,
} from "../src/providers/EditingTitleProvider";
import { InriaSerif_400Regular } from "@expo-google-fonts/inria-serif";
import {
  InriaSans_400Regular,
  InriaSans_700Bold,
} from "@expo-google-fonts/inria-sans";
import { useFonts } from "expo-font";

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    InriaSerif_400Regular,
    InriaSans_400Regular,
    InriaSans_700Bold,
  });

  // TODO: replace with splash screen
  if (!fontsLoaded) return null;
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <IsEditingTitleProvider>
        <ClimbProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#F55536" },

              headerRight: (props) => {
                const { isEditingTitle, setIsEditingTitle } =
                  useIsEditingTitle();
                const { saveClimb } = useClimb();
                if (!isEditingTitle) return;
                return (
                  <TouchableOpacity
                    style={{
                      padding: 9,
                      backgroundColor: "#D6EFFF",
                      borderRadius: 15,
                    }}
                    onPress={() => {
                      saveClimb();
                      setIsEditingTitle(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "InriaSans_700Bold",
                        color: "#14281D",
                      }}
                    >
                      OK
                    </Text>
                  </TouchableOpacity>
                );
              },
              headerTitle: (props) => {
                const { isEditingTitle, setIsEditingTitle } =
                  useIsEditingTitle();
                const { climb, newClimbName, setNewClimbName, saveClimb } =
                  useClimb();

                if (isEditingTitle) {
                  return (
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                      }}
                    >
                      <TextInput
                        style={{
                          borderRadius: 15,
                          paddingHorizontal: 9,
                          backgroundColor: "white",
                          height: 40,
                          textAlign: "center",
                          fontFamily: "InriaSans_400Regular",
                          color: "#14281D",
                          fontSize: 22,
                        }}
                        placeholder={"Enter climb name..."}
                        defaultValue={climb?.fileName || ""}
                        onChangeText={setNewClimbName}
                        onLayout={(e) => e.target.focus()}
                        onBlur={() => {
                          saveClimb();
                          setIsEditingTitle(false);
                        }}
                      />
                    </View>
                  );
                }

                return (
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      setIsEditingTitle(true);
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "InriaSans_400Regular",
                        color: "white",
                        fontSize: 22,
                      }}
                    >
                      {climb?.fileName || ""}
                    </Text>
                  </Pressable>
                );
              },
            }}
          />
        </ClimbProvider>
      </IsEditingTitleProvider>
    </GestureHandlerRootView>
  );
};
export default RootLayout;
