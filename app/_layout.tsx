import { Stack } from "expo-router";
import ClimbProvider from "../src/providers/ClimbProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const RootLayout = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <ClimbProvider>
      <Stack />
    </ClimbProvider>
  </GestureHandlerRootView>
);

export default RootLayout;
