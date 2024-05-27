import { Stack } from "expo-router";
import ClimbProvider, { useClimb } from "../src/providers/ClimbProvider";
import {
  GestureHandlerRootView,
  TextInput,
} from "react-native-gesture-handler";
import { Alert, Pressable, Text, TouchableOpacity, View } from "react-native";

import IsEditingTitleProvider, {
  useIsEditingTitle,
} from "../src/providers/EditingTitleProvider";
import { InriaSerif_400Regular } from "@expo-google-fonts/inria-serif";
import {
  InriaSans_400Regular,
  InriaSans_700Bold,
} from "@expo-google-fonts/inria-sans";
import { useFonts } from "expo-font";
import AnimationProvider from "../src/providers/AnimationProvider";

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
          <AnimationProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: "#F55536" },

                headerRight: () => {
                  const { isEditingTitle, setIsEditingTitle } =
                    useIsEditingTitle();
                  const { saveClimb, newClimbName } = useClimb();

                  if (!isEditingTitle) return;

                  return (
                    <TouchableOpacity
                      style={{
                        padding: 9,
                        backgroundColor: "#D6EFFF",
                        borderRadius: 15,
                        opacity: !newClimbName.length ? 0.3 : 1,
                      }}
                      disabled={!newClimbName.length}
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
                headerTitle: () => {
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
                          onBlur={(e) => {
                            if (!newClimbName.length) {
                              Alert.alert("Climb name cannot be blank");
                              e.target.focus();
                              return;
                            }
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
                      onPress={() => setIsEditingTitle(true)}
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
          </AnimationProvider>
        </ClimbProvider>
      </IsEditingTitleProvider>
    </GestureHandlerRootView>
  );
};
export default RootLayout;
