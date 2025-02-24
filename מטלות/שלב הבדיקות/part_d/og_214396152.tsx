import React, { useEffect, useState } from "react";
import { View, Text, Button, SafeAreaView, FlatList } from "react-native";
import ListComponent from "../components/ListComponent";
import { AbstractList, AbstractListItem } from "../utils/types";
import { useAuth } from "../context/AuthContext";
import {
  fetchAllLists,
  addNewList,
  updateExistingList,
} from "@/services/api";
import { ScrollView } from "react-native-gesture-handler";
import { create } from "axios";
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface HomeScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const { userToken, clearUserToken } = useAuth();
  const [lists, setLists] = useState<AbstractList[]>([]);

  const fetchUserLists = async () => {
    fetchAllLists(userToken)
      .then((lists) => {
        const plainLists = lists.map((list) =>
          AbstractList.parseMongoDBObject(list)
        );
        setLists(plainLists);
        console.log("FETCHING LISTS");
        console.log(plainLists);
      })
      .catch((error) => {
        console.error(error);
      });
  };


  const updateAndSyncList = (updatedList: AbstractList, index: number) => {
    if (index >= lists.length || index < 0) return;
    setLists((prevLists) => {
      const newLists = [...prevLists];
      newLists[index] = updatedList;
      if (newLists[index].id) { 
        // If the list has a MongoDB ID, we send an API request to update the list
        // and then update the state to represent the updated list
        updateExistingList(
          userToken,
          newLists[index].id,
          newLists[index].title,
          newLists[index].items
        );
        return newLists;
      }
      return prevLists;
    });
  };

  const createNewList = () => {
    addNewList(userToken, "New List", []).then(() => fetchUserLists())
  }

  const handleLogOut = () => {
    clearUserToken();
    navigation.navigate("Login");
  }
  
  useEffect(() => {
    if(userToken){
      fetchUserLists();
    }else{
      navigation.navigate("Login");
    }
  }, [userToken]);

  return (
    <SafeAreaView
      style={{
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
        margin: 20,
      }}
    >
      <Button title="Logout" onPress={handleLogOut} />
      <Button
        title="Add List"
        onPress={() =>
          createNewList()
        }
      />
      {/* <Button title="Save Lists" onPress={() => sync()}></Button> */}
      <FlatList
        data={lists}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <ListComponent
            listIndex={index}
            sourceList={item}
            updateAndSyncList={updateAndSyncList}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
