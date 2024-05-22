import { StyleSheet } from "react-native";

const imageContainerStyles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    width: "100%",
    resizeMode: "contain",
  },
});

export default imageContainerStyles;
