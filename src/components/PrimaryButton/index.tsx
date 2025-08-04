import { GestureResponderEvent, Text, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { PRIMARY_BUTTON_COLOUR } from "./index.constants";

interface BasePrimaryButtonProps {
  onPress?: ((event: GestureResponderEvent) => void) & (() => void);
  disabled?: boolean;
  fontSize?: number;
}

interface PrimaryButtonWithTitle extends BasePrimaryButtonProps {
  title: string;
  children?: never;
}

interface PrimaryButtonWithChildren extends BasePrimaryButtonProps {
  title?: never;
  children: JSX.Element;
}

type PrimaryButtonProps = PrimaryButtonWithTitle | PrimaryButtonWithChildren;

const PrimaryButton = ({
  onPress,
  disabled = false,
  title,
  fontSize = 19,
  children,
}: PrimaryButtonProps) => (
  <View>
    <Pressable
      style={{
        backgroundColor: PRIMARY_BUTTON_COLOUR,
        borderRadius: 15,
        padding: 9,
      }}
      onPress={onPress}
      disabled={disabled}
    >
      {children || (
        <Text
          style={{
            fontSize,
            fontFamily: "InriaSans_700Bold",
            color: "#14281D",
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  </View>
);

export default PrimaryButton;
