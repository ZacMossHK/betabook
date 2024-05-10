import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ImageViewer from "./src/components/ImageViewer";
import { useState } from "react";
import { ImageProps, Nodes } from "./src/components/ImageViewer/index.types";
import Menu from "./src/components/Menu";
import devCurrentFile from "./devData/devCurrentfile";

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
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        {currentFile ? (
          <ImageViewer {...{ currentFile, setCurrentFile }} />
        ) : (
          <Menu {...{ setCurrentFile }} />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
