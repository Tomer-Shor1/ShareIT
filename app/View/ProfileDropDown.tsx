import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu, Divider } from 'react-native-paper';


const ProfilePicture = ({ base64Image, headers, onOptionSelect }) => {
    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);


    return (
        <View style={styles.container}>
            <Menu
                visible={visible}
                onDismiss={closeMenu}
                style={ {top: 110} }
                anchor={
                    <TouchableOpacity onPress={openMenu}>
                        <Image 
                            style={styles.profileImage}
                            source={{ uri: "data:image/jpeg;base64," + base64Image }}
                        />
                    </TouchableOpacity>
                }
            >
                <Menu.Item onPress={() => onOptionSelect(headers[0])} title={headers[0]} />
                <Divider />
                <Menu.Item onPress={() => onOptionSelect(headers[1])} title={headers[1]} />
                <Divider />
                <Menu.Item onPress={() => onOptionSelect(headers[2])} title={headers[2]} />
                <Divider />
                <Menu.Item onPress={() => onOptionSelect(headers[3])} title={headers[3]} />
                
            </Menu>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#ddd',
    },
});

export default ProfilePicture;
