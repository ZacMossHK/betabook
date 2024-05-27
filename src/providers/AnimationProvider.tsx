import { PropsWithChildren, createContext, useContext, useState } from "react";
import { useSharedValue } from "react-native-reanimated";

const AnimationContext = createContext({});

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
