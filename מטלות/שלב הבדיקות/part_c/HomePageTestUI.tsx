// This file test the HomePage component.
//  It tests that the component navigates to the "LogIn" screen when the "Login" button is pressed.



import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomePage from '../View/HomePage';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

describe('HomePage', () => {
  const mockNavigate = jest.fn();
  const mockNavigation: any = {
    navigate: mockNavigate,
    // Add any other required navigation properties as needed
    dispatch: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
    reset: jest.fn(),
    addListener: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to "LogIn" when the Login button is pressed', () => {
    const { getByText } = render(<HomePage navigation={mockNavigation} />);
    
    // Find the Login button (its text is "Login")
    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    // Assert that navigation.navigate was called with "LogIn"
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('LogIn');
  });
});