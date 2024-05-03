import AsyncStorage from "@react-native-async-storage/async-storage";

export const getAsyncStorageFile = async (fileId: string) => {
  const file = await AsyncStorage.getItem(fileId);
  if (file) return JSON.parse(file);
};

export const setAsyncStorageFile = async (fileId, file) =>
  await AsyncStorage.setItem(fileId, JSON.stringify(file));
