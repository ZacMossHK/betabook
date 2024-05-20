import { PropsWithChildren, createContext, useContext, useState } from "react";
import * as FileSystem from "expo-file-system";
import { IMAGE_DIR } from "../components/Menu/index.constants";
import { Nodes } from "../components/ImageViewer/index.types";
import { File } from "../../app";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ClimbDataType {
  climb: File | null;
  setClimb: React.Dispatch<React.SetStateAction<File | null>>;
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  newClimbName: string;
  setNewClimbName: React.Dispatch<React.SetStateAction<string>>;
  saveClimb: () => Promise<void>;
  clearClimb: () => void;
}

const ClimbContext = createContext<ClimbDataType>({
  climb: null,
  setClimb: () => {},
  nodes: [],
  setNodes: () => {},
  newClimbName: "",
  setNewClimbName: () => {},
  saveClimb: async () => {},
  clearClimb: () => {},
});

const ClimbProvider = ({ children }: PropsWithChildren) => {
  const [climb, setClimb] = useState<File | null>(null);
  const [nodes, setNodes] = useState<Nodes>(climb?.nodes || []);
  const [newClimbName, setNewClimbName] = useState("");

  const getImageExtension = (uri: string) => {
    const splitUri = uri.split(".");
    return splitUri[splitUri.length - 1];
  };

  const saveClimb = async () => {
    if (!climb) return;
    // creates the image directory if it doesn't exist
    if (!(await FileSystem.getInfoAsync(IMAGE_DIR)).exists)
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    const newFile = {
      ...climb,
      nodes,
      fileName: newClimbName || climb.fileName,
    };
    const imageFileUri = `${IMAGE_DIR}${climb.fileId}${getImageExtension(
      climb.imageProps.uri
    )}`;
    // if image doesn't exist on local storage, copy it over
    if (!(await FileSystem.getInfoAsync(imageFileUri)).exists) {
      await FileSystem.copyAsync({
        from: climb.imageProps.uri,
        to: imageFileUri,
      });
      newFile.imageProps = { ...newFile.imageProps, uri: imageFileUri };
    }
    await AsyncStorage.setItem(climb.fileId, JSON.stringify(newFile));
    await setClimb(newFile);
  };

  const clearClimb = () => {
    setClimb(null);
    setNodes([]);
    setNewClimbName("");
  };

  return (
    <ClimbContext.Provider
      value={{
        climb,
        setClimb,
        nodes,
        setNodes,
        newClimbName,
        setNewClimbName,
        saveClimb,
        clearClimb,
      }}
    >
      {children}
    </ClimbContext.Provider>
  );
};

export default ClimbProvider;

export const useClimb = () => useContext(ClimbContext);
