import { Stack } from "expo-router";
import ClimbProvider from "../src/providers/ClimbProvider";
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

const RootLayout = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <IsEditingTitleProvider>
      <ClimbProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#F55536" },
            headerRight: (props) => {
              const { isEditingTitle, setIsEditingTitle } = useIsEditingTitle();

              if (!isEditingTitle) return;
              return (
                <TouchableOpacity
                  style={{
                    padding: 9,
                    backgroundColor: "#D6EFFF",
                    borderRadius: 15,
                  }}
                  onPress={() => setIsEditingTitle(false)}
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
              const { isEditingTitle, setIsEditingTitle } = useIsEditingTitle();

              const [newRouteName, setNewRouteName] = useState(props.children);

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
                      placeholder={props.children || "enter route name here"}
                      defaultValue={props.children || ""}
                      onChangeText={setNewRouteName}
                      onLayout={(e) => e.target.focus()}
                      onBlur={() => {
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
                    {props.children}
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

export default RootLayout;
