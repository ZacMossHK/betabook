import { SafeAreaView, Text } from "react-native";
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

const App = () => (
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

export default App;
