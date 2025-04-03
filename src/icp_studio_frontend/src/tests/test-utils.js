import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';

// Mock AuthContext values
const defaultAuthContextValues = {
  isAuthenticated: true,
  identity: {},
  principal: { toString: () => 'aaaaa-bbbbb-ccccc-ddddd-eeeee' },
  isAdmin: false,
  isLoading: false,
  actor: {},
  login: jest.fn(),
  logout: jest.fn(),
};

// Mock API service
const mockApiService = {
  initialize: jest.fn(),
  isInitialized: jest.fn().mockReturnValue(true),
  executeCall: jest.fn(),
  getMyProfile: jest.fn().mockResolvedValue({
    success: true,
    data: {
      username: 'Test User',
      registrationDate: Date.now() * 1000000, // Convert to nanoseconds
      completedModules: [1, 2],
      totalTokens: 200,
    },
    error: null,
  }),
  getAvailableModules: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        title: 'Module 1',
        description: 'Test module 1 description',
        tokenReward: 100,
        prerequisiteModules: [],
        questions: [{ id: 1 }, { id: 2 }],
        content: [{ id: 1 }, { id: 2 }, { id: 3 }],
      },
      {
        id: 2,
        title: 'Module 2',
        description: 'Test module 2 description',
        tokenReward: 100,
        prerequisiteModules: [1],
        questions: [{ id: 3 }, { id: 4 }],
        content: [{ id: 4 }, { id: 5 }, { id: 6 }],
      },
      {
        id: 3,
        title: 'Module 3',
        description: 'Test module 3 description',
        tokenReward: 100,
        prerequisiteModules: [1, 2],
        questions: [{ id: 5 }, { id: 6 }],
        content: [{ id: 7 }, { id: 8 }, { id: 9 }],
      },
    ],
    error: null,
  }),
  getUserAchievements: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        title: 'First Module',
        description: 'Completed your first module',
        icon: '🏆',
        dateEarned: Date.now() * 1000000,
      },
      {
        id: 2,
        title: 'Quiz Master',
        description: 'Answered all questions correctly',
        icon: '🎓',
        dateEarned: Date.now() * 1000000,
      },
    ],
    error: null,
  }),
  getModule: jest.fn().mockImplementation((moduleId) => Promise.resolve({
    success: true,
    data: {
      id: moduleId,
      title: `Module ${moduleId}`,
      description: `Test module ${moduleId} description`,
      tokenReward: 100,
      prerequisiteModules: moduleId > 1 ? [moduleId - 1] : [],
      questions: [{ id: moduleId * 2 - 1 }, { id: moduleId * 2 }],
      content: [
        { id: moduleId * 3 - 2 },
        { id: moduleId * 3 - 1 },
        { id: moduleId * 3 },
      ],
    },
    error: null,
  })),
  getModuleContent: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        contentType: ['Text', 'This is a test text content.'],
        order: 1,
      },
      {
        id: 2,
        contentType: ['Image', 'https://example.com/test-image.jpg'],
        order: 2,
      },
      {
        id: 3,
        contentType: ['Code', 'function test() { return true; }'],
        order: 3,
      },
    ],
    error: null,
  }),
  getModuleQuestions: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        text: 'Test question 1?',
        options: [
          { id: 1, text: 'Option 1' },
          { id: 2, text: 'Option 2' },
          { id: 3, text: 'Option 3' },
          { id: 4, text: 'Option 4' },
        ],
        correctOption: 2,
      },
      {
        id: 2,
        text: 'Test question 2?',
        options: [
          { id: 1, text: 'Option 1' },
          { id: 2, text: 'Option 2' },
          { id: 3, text: 'Option 3' },
          { id: 4, text: 'Option 4' },
        ],
        correctOption: 3,
      },
    ],
    error: null,
  }),
  submitQuizAnswers: jest.fn().mockResolvedValue({
    success: true,
    data: 100, // Tokens earned
    error: null,
  }),
  // Add other API methods as needed
};

// Custom render with wrapped providers
function renderWithProviders(
  ui,
  {
    authContextValues = {},
    ...renderOptions
  } = {}
) {
  const allAuthContextValues = {
    ...defaultAuthContextValues,
    ...authContextValues,
  };

  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={allAuthContextValues}>
        <Router>{children}</Router>
      </AuthContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { renderWithProviders as render, mockApiService }; 