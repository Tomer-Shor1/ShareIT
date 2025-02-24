import { Logic } from '../ViewModel/Logic'; 
import { DatabaseManager } from '../Model/databaseManager';

jest.mock('../Model/databaseManager', () => {
  return {
    DatabaseManager: {
      queryCollection: jest.fn(),
    },
  };
});

describe('validateSignUpInput', () => {
  let logic: Logic;

  beforeEach(() => {
    logic = new Logic();
    jest.clearAllMocks();
  });

  it('should return success when all inputs are valid', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([]);

    const result = await logic.validateSignUpInput(
      'validUser',
      'valid@example.com',
      'ValidPass1!',
      'ValidPass1!',
      true
    );

    expect(result.success).toBe(true);
    expect(result.messages).toEqual(['Sign-up input is valid']);
  });

  it('should return error for short username', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([]);

    const result = await logic.validateSignUpInput(
      'ab', // Invalid username
      'valid@example.com',
      'ValidPass1!',
      'ValidPass1!',
      true
    );

    expect(result.success).toBe(false);
    expect(result.messages).toContain('Username must be at least 3 characters long');
  });

  it('should return error for invalid email format', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([]);

    const result = await logic.validateSignUpInput(
      'validUser',
      'invalid-email', // Invalid email
      'ValidPass1!',
      'ValidPass1!',
      true
    );

    expect(result.success).toBe(false);
    expect(result.messages).toContain('Please enter a valid email address');
  });

  it('should return error for weak password', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([]);

    const result = await logic.validateSignUpInput(
      'validUser',
      'valid@example.com',
      'weakpass', // Invalid password
      'weakpass',
      true
    );

    expect(result.success).toBe(false);
    expect(result.messages).toContain('Password must contain at least one uppercase letter');
  });

  it('should return error for mismatched passwords', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([]);

    const result = await logic.validateSignUpInput(
      'validUser',
      'valid@example.com',
      'ValidPass1!',
      'DifferentPass!',
      true
    );

    expect(result.success).toBe(false);
    expect(result.messages).toContain('Passwords do not match');
  });

  it('should return error if username is already taken', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([{ username: 'validUser' }]);

    const result = await logic.validateSignUpInput(
      'validUser',
      'valid@example.com',
      'ValidPass1!',
      'ValidPass1!',
      true
    );

    expect(result.success).toBe(false);
    expect(result.messages).toContain('Username already taken');
  });

  it('should return error if email is already registered', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([{ email: 'valid@example.com' }]);

    const result = await logic.validateSignUpInput(
      'validUser',
      'valid@example.com',
      'ValidPass1!',
      'ValidPass1!',
      true
    );

    expect(result.success).toBe(false);
    expect(result.messages).toContain('Email already registered');
  });

  it('should return error if user does not agree to terms', async () => {
    (DatabaseManager.queryCollection as jest.Mock).mockResolvedValue([]);

    const result = await logic.validateSignUpInput(
      'validUser',
      'valid@example.com',
      'ValidPass1!',
      'ValidPass1!',
      false // Did not agree
    );

    expect(result.success).toBe(false);
    expect(result.messages).toContain('You must agree to the terms and conditions');
  });
});