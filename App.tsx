import { ImageProps, SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ImageViewer from "./src/components/ImageViewer";
import { useState } from "react";
import { Nodes } from "./src/components/ImageViewer/index.types";
import Menu from "./src/components/Menu";
interface File {
  fileId: string;
  fileName: string | null;
  imageProps: ImageProps;
  nodes: Nodes;
}
const App = () => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);

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
