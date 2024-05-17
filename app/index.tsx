import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState } from "react";
import devCurrentFile from "../devData/devCurrentfile";
import { ImageProps, Nodes } from "../src/components/ImageViewer/index.types";
import Menu from "../src/components/Menu";
import { Stack } from "expo-router";

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
  const [currentFile, setCurrentFile] = useState<File | null>(
    process.env.EXPO_PUBLIC_NODES_NUM || process.env.EXPO_PUBLIC_DEV_IMG
      ? devCurrentFile()
      : null
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <Menu />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
