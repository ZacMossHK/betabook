import { PropsWithChildren, createContext, useContext, useState } from "react";

const ClimbContext = createContext({});

const ClimbProvider = ({ children }: PropsWithChildren) => {
  const [climb, setClimb] = useState(null);
  return (
    <ClimbContext.Provider value={{ climb, setClimb }}>
      {children}
    </ClimbContext.Provider>
  );
};

export default ClimbProvider;

export const useClimb = () => useContext(ClimbContext);
