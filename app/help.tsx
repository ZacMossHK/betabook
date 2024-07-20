import { Image, StyleSheet, Text, View, Linking, Alert } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import PrimaryButton from "../src/components/PrimaryButton";
import { useRef } from "react";

const helpScreenStyle = StyleSheet.create({
  sectionContainer: {
    alignItems: "center",
    gap: 10,
    width: "85%",
  },
  sectionHeader: {
    fontSize: 17,
    fontFamily: "InriaSans_700Bold",
  },
  instructionBody: {
    fontFamily: "InriaSans_400Regular",
    flex: 1,
    fontSize: 15,
  },
  instructionContainer: {
    gap: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

const openURI = async (url: string) => {
  const supported = await Linking.canOpenURL(url); //To check if URL is supported or not.
  if (supported) {
    await Linking.openURL(url); // It will open the URL on browser.
  } else {
    Alert.alert(`There was an error loading the instructions!`);
  }
};

const HelpScreen = () => {
  const flatListRef = useRef<FlatList>(null);

  const sections = [
    "What is Betabook?",
    "Panning and zooming",
    "Creating move nodes",
    "Moving nodes",
    "Deleting nodes",
    "Foot nodes",
    "Move notes",
    "Changing the title",
    "About the developer",
  ];

  const helpMenu = (
    <View style={{ alignItems: "center", gap: 15 }}>
      {sections.map((sectionTitle, sectionIndex) => (
        <PrimaryButton
          key={`${sectionTitle}-${sectionIndex}`}
          title={sectionTitle}
          onPress={() =>
            flatListRef.current?.scrollToIndex({
              viewOffset: 10,
              index: sectionIndex + 1,
            })
          }
        />
      ))}
    </View>
  );

  const openBetabookInstagram = () =>
    openURI("https://www.instagram.com/betabookclimbing/");

  const whatIsBetaBookSection = (
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>What is Betabook?</Text>
      <Text style={[helpScreenStyle.instructionBody, { paddingBottom: 5 }]}>
        Betabook is an app designed to help you remember beta. Take a photo of
        your project and easily start remembering beta by marking your move
        sequence.{"\n\n"}Easily mark down your hand and foot movements using
        movement nodes and make notes for each move.{"\n\n"}Refine and rehearse
        your beta and send! 🧗
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 13,
        }}
      >
        <PrimaryButton
          onPress={openBetabookInstagram}
          children={
            <View
              style={{ flexDirection: "row", gap: 15, alignItems: "center" }}
            >
              <Image
                resizeMode="contain"
                source={require("../assets/Instagram_Glyph_Black.png")}
                style={{ height: 28, width: 28 }}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "InriaSans_700Bold",
                  color: "#14281D",
                  textAlign: "center",
                }}
              >
                Follow Betabook on Instagram! @betabookclimbing
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );

  const openZacMossHKGithub = () => openURI("https://github.com/ZacMossHK");

  const openZacMossHKInstagram = () =>
    openURI("https://www.instagram.com/zacmosshk/");

  const aboutTheDeveloperSection = (
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>About the developer</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          Betabook was developed by Zac Moss, a climber and software developer
          living in Sheffield, UK.{"\n\n"}That's me, hi!
        </Text>
        <Image
          source={require("../assets/zac.jpg")}
          style={{ width: 150, height: 200 }}
        />
      </View>
      <Text style={helpScreenStyle.instructionBody}>
        I'm a software developer specialising in React Native and Typescript.
        I'm also currently seeking employment! Are you interested in hiring me?
        Then get in touch!
      </Text>
      <PrimaryButton
        fontSize={15}
        onPress={() => openURI("mailto:zac@zacmoss.co.uk")}
        children={
          <View style={{ flexDirection: "row", gap: 9, alignItems: "center" }}>
            <Image
              resizeMode="contain"
              source={require("../assets/envelope-icon.png")}
              style={{ height: 28, width: 28 }}
            />
            <Text
              style={{
                fontSize: 15,
                fontFamily: "InriaSans_700Bold",
                color: "#14281D",
                textAlign: "center",
              }}
            >
              Email me: zac@zacmoss.co.uk
            </Text>
          </View>
        }
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
        <PrimaryButton
          onPress={openZacMossHKGithub}
          children={
            <View
              style={{ flexDirection: "row", gap: 9, alignItems: "center" }}
            >
              <Image
                resizeMode="contain"
                source={require("../assets/github-mark.png")}
                style={{ height: 28, width: 28 }}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "InriaSans_700Bold",
                  color: "#14281D",
                  textAlign: "center",
                }}
              >
                Find me on Github: github.com/ZacMossHK
              </Text>
            </View>
          }
        />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
        <PrimaryButton
          onPress={openZacMossHKInstagram}
          children={
            <View
              style={{ flexDirection: "row", gap: 9, alignItems: "center" }}
            >
              <Image
                resizeMode="contain"
                source={require("../assets/Instagram_Glyph_Black.png")}
                style={{ height: 28, width: 28 }}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "InriaSans_700Bold",
                  color: "#14281D",
                  textAlign: "center",
                }}
              >
                Follow me on Instagram: @zacmosshk
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );

  const data = [
    helpMenu,
    whatIsBetaBookSection,
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>Panning and zooming</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          You can pan the image by swiping in any direction.
        </Text>
      </View>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          You can also zoom in and out with a pinch gesture.
        </Text>
      </View>
    </View>,
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>Creating move nodes</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          Press and hold anywhere on the image to create a movement node.
        </Text>
      </View>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          Created nodes will always be added to the end of the movement flow
        </Text>
      </View>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          To insert a new move between two existing nodes, press and hold on a
          line.
        </Text>
      </View>
    </View>,
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>Moving nodes</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          Move a node by pressing on it and moving it around.
        </Text>
      </View>
    </View>,
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>Deleting nodes</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          Delete a node by pressing and holding it.
        </Text>
      </View>
    </View>,
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>Foot nodes</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          To add feet for a move, tap on a node to turn it red and hold anywhere
          on the image to create a subnode.
        </Text>
      </View>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          Foot nodes can be moved just like regular nodes
        </Text>
      </View>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          They can also be deleted in the same way!
        </Text>
      </View>
    </View>,
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>Move notes</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          To add notes for a move, open the Edit Moves menu and press on the
          node's note to edit. To save the changes, press OK.
        </Text>
      </View>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          You can change the order of moves by pressing the up or down arrows
          next to the note.
        </Text>
      </View>
    </View>,
    <View style={helpScreenStyle.sectionContainer}>
      <Text style={helpScreenStyle.sectionHeader}>Changing the title</Text>
      <View style={helpScreenStyle.instructionContainer}>
        <Text style={helpScreenStyle.instructionBody}>
          To change the title, tap on the title in the header. Enter your new
          title and press OK.
        </Text>
      </View>
    </View>,
    aboutTheDeveloperSection,
  ];

  return (
    <FlatList
      ref={flatListRef}
      overScrollMode="never"
      contentContainerStyle={{
        paddingVertical: 20,
        alignItems: "center",
        gap: 45,
      }}
      data={data}
      renderItem={({ item }) => item}
    />
  );
};

export default HelpScreen;
