import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import * as FileSystem from "expo-file-system";
import { IMAGE_DIR } from "../components/Menu/index.constants";
import { Nodes } from "../components/ImageViewer/index.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Climb } from "../../app";

interface ClimbDataType {
  climb: Climb | null;
  setClimb: React.Dispatch<React.SetStateAction<Climb | null>>;
  nodes: Nodes;
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>;
  newName: string;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  saveClimb: () => Promise<void>;
  clearClimb: () => void;
}

const ClimbContext = createContext<ClimbDataType>({
  climb: null,
  setClimb: () => {},
  nodes: [],
  setNodes: () => {},
  newName: "",
  setNewName: () => {},
  saveClimb: async () => {},
  clearClimb: () => {},
});

const ClimbProvider = ({ children }: PropsWithChildren) => {
  const [climb, setClimb] = useState<Climb | null>(null);
  const [nodes, setNodes] = useState<Nodes>(climb?.nodes || []);
  const [newName, setNewName] = useState("");

  const getImageExtension = (uri: string) => {
    const splitUri = uri.split(".");
    return splitUri[splitUri.length - 1];
  };

  useEffect(() => {
    if (!climb?.name) return;
    setNewName(climb.name);
  }, []);

  const saveClimb = async () => {
    if (!climb) return;
    // creates the image directory if it doesn't exist
    if (!(await FileSystem.getInfoAsync(IMAGE_DIR)).exists)
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    const newClimb = {
      ...climb,
      nodes,
      name: newName || climb.name,
    };
    const imageFileUri = `${IMAGE_DIR}${climb.id}.${getImageExtension(
      climb.imageProps.uri
    )}`;
    // if image doesn't exist on local storage, copy it over
    if (!(await FileSystem.getInfoAsync(imageFileUri)).exists) {
      await FileSystem.copyAsync({
        from: climb.imageProps.uri,
        to: imageFileUri,
      });
      newClimb.imageProps = { ...newClimb.imageProps, uri: imageFileUri };
    }
    await AsyncStorage.setItem(climb.id, JSON.stringify(newClimb));
    await setClimb(newClimb);
  };

  const clearClimb = () => {
    setClimb(null);
    setNodes([]);
    setNewName("");
  };

  return (
    <ClimbContext.Provider
      value={{
        climb,
        setClimb,
        nodes,
        setNodes,
        newName,
        setNewName,
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
