// MainPage.integration.test.tsx


// This test uploads a file and makes sure it appears in the UI.
// It uses a real Firebase Auth user to sign in before running the test.


import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MainPage from '../View/MainPage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

describe('MainPage Integration Test', () => {
  // Increase the timeout since network calls may take time
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Sign in with a real test user.
    // Ensure that 'testuser@example.com' with password 'password123' exists in your Firebase Auth.
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, 'tets@test.com', 'Test11!');
  });

  it('displays the actual user photo on the main page after login', async () => {
    // Render the MainPage component.
    const { getByTestId } = render(<MainPage />);

    // Wait for the profile image element to appear.
    // (Make sure your ProfilePicture component in MainPage renders an <Image> with testID="profileImage")
    const profileImage = await waitFor(() => getByTestId('profileImage'), { timeout: 15000 });

    expect(profileImage).toBeTruthy();

    // Check that the image's source URI is what we expect.
    // Replace the expected URI with the one that is stored in Firestore for your test user.
    expect(profileImage.props.source.uri).toBe("https://example.com/testphoto.jpg");
  });
});