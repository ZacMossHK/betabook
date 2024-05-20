import { PropsWithChildren, createContext, useContext, useState } from "react";

interface isEditingTitleDataType {
  isEditingTitle: boolean;
  setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>;
}

const IsEditingTitleContext = createContext<isEditingTitleDataType>({
  isEditingTitle: false,
  setIsEditingTitle: () => {},
});

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
