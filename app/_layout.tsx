import { Stack } from "expo-router";
import ClimbProvider from "../src/providers/ClimbProvider";

const RootLayout = () => (
  <ClimbProvider>
    <Stack />
  </ClimbProvider>
);

export default RootLayout;
