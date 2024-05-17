import { SafeAreaView, Text, View } from "react-native";
import { useState } from "react";
import devCurrentFile from "../devData/devCurrentfile";
import { ImageProps, Nodes } from "../src/components/ImageViewer/index.types";
import Menu from "../src/components/Menu";
import { Stack } from "expo-router";
import {
  useFonts,
  InriaSerif_400Regular,
} from "@expo-google-fonts/inria-serif";
import { InriaSans_700Bold } from "@expo-google-fonts/inria-sans";

export interface File {
  fileId: string;
  fileName: string | null;
  imageProps: ImageProps;
  nodes: Nodes;
}

export type SetCurrentFileState = React.Dispatch<
  React.SetStateAction<File | null>
>;

const App = () => {
  const [fontsLoaded] = useFonts({
    InriaSerif_400Regular,
    InriaSans_700Bold,
  });

  const [currentFile, setCurrentFile] = useState<File | null>(
    process.env.EXPO_PUBLIC_NODES_NUM || process.env.EXPO_PUBLIC_DEV_IMG
      ? devCurrentFile()
      : null
  );
  if (!fontsLoaded) return <View />;

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
      <Menu />
    </SafeAreaView>
  );
};

export default App;
