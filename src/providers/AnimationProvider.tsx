import { PropsWithChildren, createContext, useContext, useState } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

interface AnimationContextType {
  selectedLineIndex: SharedValue<number | null>;
}

const AnimationContext = createContext<AnimationContextType>({
  selectedLineIndex: useSharedValue<number | null>(null),
});

const AnimationProvider = ({ children }: PropsWithChildren) => {
  const selectedLineIndex = useSharedValue<number | null>(null);

  return (
    <AnimationContext.Provider value={{ selectedLineIndex }}>
      {children}
    </AnimationContext.Provider>
  );
};

export default AnimationProvider;

export const useAnimation = () => useContext(AnimationContext);
