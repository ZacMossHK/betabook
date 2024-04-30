import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ImageViewer from "./src/components/ImageViewer";

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <ImageViewer />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
