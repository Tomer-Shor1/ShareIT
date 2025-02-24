// Increase Jest timeout to accommodate network delays if needed.
jest.setTimeout(30000);

// --- Mock expo-image-picker so that it returns a test image ---
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ base64: 'new_base64_photo' }],
    })
  ),
}));

// --- We do NOT mock firebase/auth so that real auth is used. ---


// --- Mock Alert to verify success message ---
import { Alert } from 'react-native';
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MainPage from '../View/MainPage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

describe('Test scenario 3 - Upload image', () => {
  beforeAll(async () => {
    // Sign in with a test user using real Firebase Auth.
    // the test user is created in the Firebase Console.
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, 'test@test.com', 'Tomer11!');
  });

  it('uploads an image and shows the new profile picture', async () => {
    // Render the MainPage.
    const { getByTestId, getByText } = render(<MainPage />);
    
    // Wait for the ProfilePicture container to be rendered.
    const profileTouchable = await waitFor(() => getByTestId('profilePicture'));
    expect(profileTouchable).toBeTruthy();
    
    // Simulate the user clicking on their profile picture.
    fireEvent.press(profileTouchable);
    
    // Simulate selecting "Change Picture" from the dropdown.
    // We assume that the dropdown renders a Menu.Item with text "Change Picture".
    const changeOption = await waitFor(() => getByText("Change Picture"));
    fireEvent.press(changeOption);
    
    // At this point, your MainPage should call the function that triggers the image picker.
    // Our expo-image-picker mock returns { base64: 'new_base64_photo' }.
    // Wait for the Alert to be called with a success message.
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success', 'Profile image uploaded to Firestore!'
      );
    });
    
    // Verify that the ProfilePicture now shows the new image.
    // The ProfilePicture should render an <Image> with testID "profileImage".
    const profileImage = getByTestId('profileImage');
    expect(profileImage).toBeTruthy();
    expect(profileImage.props.source.uri).toContain('new_base64_photo');
  });
});