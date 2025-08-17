import { Stack, useRouter } from "expo-router";
import ClimbProvider, { useClimb } from "../src/providers/ClimbProvider";
import {
  GestureHandlerRootView,
  TextInput,
} from "react-native-gesture-handler";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
import { useRouteInfo } from "expo-router/build/hooks";
import { PRIMARY_BUTTON_COLOUR } from "../src/components/PrimaryButton/index.constants";

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    InriaSerif_400Regular,
    InriaSans_400Regular,
    InriaSans_700Bold,
  });

  const router = useRouter();
  const isViewingHelp = useRouteInfo().pathname === "/help";

  // TODO: replace with splash screen
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <IsEditingTitleProvider>
        <ClimbProvider>
          <AnimationProvider>
            <Stack
              screenOptions={{
                headerTintColor: "white",
                headerStyle: { backgroundColor: "#F55536" },
                ...(Platform.OS === "android" && { statusBarStyle: "light" }), // prevents iOS error when changing statusBarStyle
                headerRight: () => {
                  const { isEditingTitle, setIsEditingTitle } =
                    useIsEditingTitle();
                  const { saveClimb, newName } = useClimb();

                  if (!isEditingTitle) {
                    return (
                      <TouchableOpacity
                        style={{
                          padding: 9,
                          backgroundColor: PRIMARY_BUTTON_COLOUR,
                          borderRadius: 15,
                        }}
                        onPress={() =>
                          isViewingHelp
                            ? router.back()
                            : router.navigate("help")
                        }
                      >
                        <Text
                          style={{
                            fontFamily: "InriaSans_700Bold",
                            color: "#14281D",
                          }}
                        >
                          {isViewingHelp ? "Back" : "Help"}
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      style={{
                        padding: 9,
                        backgroundColor: PRIMARY_BUTTON_COLOUR,
                        borderRadius: 15,
                        opacity: !newName.length ? 0.3 : 1,
                      }}
                      disabled={!newName.length}
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
                  const { climb, newName, setNewName, saveClimb } = useClimb();

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
                            paddingVertical: 5,
                            borderRadius: 15,
                            paddingHorizontal: 9,
                            backgroundColor: "white",
                            fontFamily: "InriaSans_400Regular",
                            color: "#14281D",
                            fontSize: 22,
                            width: "70%",
                          }}
                          placeholder={"Enter climb name..."}
                          defaultValue={climb?.name || ""}
                          onChangeText={setNewName}
                          onLayout={(e) => e.target.focus()}
                          onBlur={(e) => {
                            if (!newName.length) {
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
                      style={{
                        flex: 1,
                        ...(Platform.OS === "android" && { top: 3 }),
                      }}
                      onPress={() => setIsEditingTitle(true)}
                      disabled={isViewingHelp}
                    >
                      <Text
                        style={{
                          fontFamily: "InriaSans_400Regular",
                          color: "white",
                          fontSize: 22,
                        }}
                      >
                        {isViewingHelp
                          ? "Help & Instructions"
                          : climb?.name || ""}
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
