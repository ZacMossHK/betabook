import { PropsWithChildren, createContext, useContext, useState } from "react";
import * as FileSystem from "expo-file-system";
import { IMAGE_DIR } from "../components/Menu/index.constants";
import { Nodes } from "../components/ImageViewer/index.types";
import { File } from "../../app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const ClimbContext = createContext({});

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
    Alert.alert("File saved!");
    await setClimb(newFile);
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
      }}
    >
      {children}
    </ClimbContext.Provider>
  );
};

export default ClimbProvider;

export const useClimb = () => useContext(ClimbContext);
