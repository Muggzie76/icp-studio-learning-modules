import React from 'react';
import { render, screen, waitFor } from './test-utils';
import UserProfile from '../components/profile/UserProfile';
import apiService from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  getMyProfile: jest.fn(),
  getAvailableModules: jest.fn(),
  getUserAchievements: jest.fn(),
}));

describe('UserProfile Component', () => {
  beforeEach(() => {
    // Reset mock implementation before each test
    apiService.getMyProfile.mockResolvedValue({
      success: true,
      data: {
        username: 'Test User',
        registrationDate: Date.now() * 1000000,
        completedModules: [1, 2],
        totalTokens: 200,
      },
      error: null,
    });
    
    apiService.getAvailableModules.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          title: 'Module 1',
        },
        {
          id: 2,
          title: 'Module 2',
        },
        {
          id: 3,
          title: 'Module 3',
        },
      ],
      error: null,
    });
    
    apiService.getUserAchievements.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          title: 'First Module',
          description: 'Completed your first module',
          icon: '🏆',
          dateEarned: Date.now() * 1000000,
        },
      ],
      error: null,
    });
  });

  test('renders loading state initially', () => {
    render(<UserProfile />);
    expect(screen.getByText(/loading profile data/i)).toBeInTheDocument();
  });

  test('renders user profile data after loading', async () => {
    render(<UserProfile />);
    
    // Wait for the profile to load
    await waitFor(() => {
      expect(screen.queryByText(/loading profile data/i)).not.toBeInTheDocument();
    });
    
    // Check for profile elements
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/Principal ID:/i)).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument(); // Token amount
    expect(screen.getByText('2')).toBeInTheDocument(); // Modules completed
    expect(screen.getByText('67%')).toBeInTheDocument(); // Progress percentage (2/3 * 100)
    
    // Check for completed modules
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Module 2')).toBeInTheDocument();
    
    // Check for achievements
    expect(screen.getByText('First Module')).toBeInTheDocument();
    expect(screen.getByText('Completed your first module')).toBeInTheDocument();
  });

  test('displays error message when profile loading fails', async () => {
    // Mock API failure
    apiService.getMyProfile.mockResolvedValue({
      success: false,
      data: null,
      error: 'Failed to load profile',
    });
    
    render(<UserProfile />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to load profile/i)).toBeInTheDocument();
    });
  });

  test('calculates progress percentage correctly', async () => {
    // Set up with different number of modules
    apiService.getAvailableModules.mockResolvedValue({
      success: true,
      data: [
        { id: 1, title: 'Module 1' },
        { id: 2, title: 'Module 2' },
        { id: 3, title: 'Module 3' },
        { id: 4, title: 'Module 4' },
      ],
      error: null,
    });
    
    // User completed 3 out of 4 modules
    apiService.getMyProfile.mockResolvedValue({
      success: true,
      data: {
        username: 'Test User',
        registrationDate: Date.now() * 1000000,
        completedModules: [1, 2, 3],
        totalTokens: 300,
      },
      error: null,
    });
    
    render(<UserProfile />);
    
    // Wait for the profile to load
    await waitFor(() => {
      expect(screen.queryByText(/loading profile data/i)).not.toBeInTheDocument();
    });
    
    // Check progress percentage (3/4 * 100 = 75%)
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  test('shows empty state when no achievements or completed modules', async () => {
    apiService.getMyProfile.mockResolvedValue({
      success: true,
      data: {
        username: 'Test User',
        registrationDate: Date.now() * 1000000,
        completedModules: [],
        totalTokens: 0,
      },
      error: null,
    });
    
    apiService.getUserAchievements.mockResolvedValue({
      success: true,
      data: [],
      error: null,
    });
    
    render(<UserProfile />);
    
    // Wait for the profile to load
    await waitFor(() => {
      expect(screen.queryByText(/loading profile data/i)).not.toBeInTheDocument();
    });
    
    // Check for empty states
    expect(screen.getByText(/You haven't completed any modules yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete modules and quizzes to earn achievements/i)).toBeInTheDocument();
  });
}); 