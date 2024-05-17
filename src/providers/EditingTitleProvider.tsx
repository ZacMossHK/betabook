import { PropsWithChildren, createContext, useContext, useState } from "react";

const IsEditingTitleContext = createContext({});

const IsEditingTitleProvider = ({ children }: PropsWithChildren) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <IsEditingTitleContext.Provider
      value={{ isEditingTitle, setIsEditingTitle }}
    >
      {children}
    </IsEditingTitleContext.Provider>
  );
};

export default IsEditingTitleProvider;

export const useIsEditingTitle = () => useContext(IsEditingTitleContext);
