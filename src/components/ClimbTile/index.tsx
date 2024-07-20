import { Image, Text, View } from "react-native";
import { CLIMB_TILE_WIDTH } from "./index.constants";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

interface ClimbTileProps {
  uri: string;
  id: string;
  name: string | null;
  isLoading: boolean;
  loadClimb: (id: string) => Promise<void>;
  deleteClimb: (id: string, imagePath: string) => Promise<void>;
}

const ClimbTile = ({
  uri,
  id,
  isLoading,
  name,
  loadClimb,
  deleteClimb,
}: ClimbTileProps) => {
  const [isDeletePressed, setIsDeletePressed] = useState(false);

  const tileBodyOpacity = isDeletePressed ? 0.8 : 1;

  if (!uri.length)
    return (
      <View
        style={{
          backgroundColor: "grey",
          opacity: 0.3,
          height: CLIMB_TILE_WIDTH,
          width: CLIMB_TILE_WIDTH,
        }}
      />
    );

  return (
    <TouchableOpacity
      style={{
        height: CLIMB_TILE_WIDTH,
        width: CLIMB_TILE_WIDTH,
      }}
      activeOpacity={0.8}
      onPress={() => loadClimb(id)}
      disabled={isLoading || isDeletePressed}
    >
      <>
        <View style={{ zIndex: 2, top: 4 }}>
          {isDeletePressed && (
            <View
              style={{
                backgroundColor: "#F55536",
                borderRadius: 15,
                paddingHorizontal: 7,
                paddingVertical: 3,
                left: 4,
                position: "absolute",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "white",
                  fontFamily: "InriaSans_700Bold",
                }}
              >
                Hold X for 5 secs to delete
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPressIn={() => setIsDeletePressed(true)}
            onPressOut={() => setIsDeletePressed(false)}
            onLongPress={() => deleteClimb(id, uri)}
            delayLongPress={5000}
            style={{
              backgroundColor: "#F55536",
              borderRadius: 15,
              paddingHorizontal: 7,
              paddingVertical: 3,
              right: 4,
              position: "absolute",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "white",
                fontFamily: "InriaSans_700Bold",
              }}
            >
              X
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            opacity: tileBodyOpacity,
            zIndex: 2,
            bottom: 4,
            position: "absolute",
            width: "100%",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 19,
              color: "white",
              fontFamily: "InriaSans_400Regular",
            }}
          >
            {name}
          </Text>
        </View>
        <LinearGradient
          style={{
            opacity: tileBodyOpacity,
            zIndex: 1,
            height: 43,
            position: "absolute",
            bottom: 0,
            width: "100%",
          }}
          colors={["transparent", "black"]}
        />

        <Image
          style={{
            opacity: tileBodyOpacity,
            flex: 1,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          source={{ uri: uri }}
        />
      </>
    </TouchableOpacity>
  );
};

export default ClimbTile;
