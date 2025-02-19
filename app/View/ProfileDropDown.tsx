// import React, { useState } from 'react';
// import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
// import { Menu, Divider, Button } from 'react-native-paper';

// const ProfilePicture = ({ imagePath, onOptionSelect }) => {
//     const [visible, setVisible] = useState(false);

//     const openMenu = () => setVisible(true);
//     const closeMenu = () => setVisible(false);

//     return (
//         <View style={styles.container}>
//             <Menu
//                 visible={visible}
//                 onDismiss={closeMenu}
//                 anchor={
//                     <TouchableOpacity onPress={openMenu}>
//                         <Image source={{ uri: imagePath }} style={styles.profileImage} />
//                     </TouchableOpacity>
//                 }
//             >
//                 <Menu.Item onPress={() => onOptionSelect('View Profile')} title="View Profile" />
//                 <Divider />
//                 <Menu.Item onPress={() => onOptionSelect('Change Picture')} title="Change Picture" />
//                 <Divider />
//                 <Menu.Item onPress={() => onOptionSelect('Remove Picture')} title="Remove Picture" />
//             </Menu>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     profileImage: {
//         width: 100,
//         height: 100,
//         borderRadius: 50,
//         borderWidth: 2,
//         borderColor: '#ddd',
//     },
// });

// export default ProfilePicture;

import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu, Divider } from 'react-native-paper';

const ProfilePicture = ({ base64Image, onOptionSelect }) => {
    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    console.log("ProfilePicture: data:image/jpeg;base64, " + base64Image);

    return (
        <View style={styles.container}>
            <Menu
                visible={visible}
                onDismiss={closeMenu}
                anchor={
                    <TouchableOpacity onPress={openMenu}>
                        <Image 
                            style={styles.profileImage}
                            source={{ uri: "data:image/jpeg;base64," + base64Image }}
                        />
                    </TouchableOpacity>
                }
            >
                <Menu.Item onPress={() => onOptionSelect('View Profile')} title="View Profile" />
                <Divider />
                <Menu.Item onPress={() => onOptionSelect('Change Picture')} title="Change Picture" />
                <Divider />
                <Menu.Item onPress={() => onOptionSelect('Remove Picture')} title="Remove Picture" />
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
