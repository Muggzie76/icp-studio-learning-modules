import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { mockApiService } from './test-utils';
import App from '../App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import ModuleContent from '../components/learning/ModuleContent';
import AdminDashboard from '../components/admin/AdminDashboard';

// Mock the API service
jest.mock('../services/api', () => mockApiService);

// Mock the auth client
jest.mock('@dfinity/auth-client', () => ({
  AuthClient: {
    create: jest.fn().mockResolvedValue({
      isAuthenticated: jest.fn().mockResolvedValue(false),
      login: jest.fn().mockImplementation(({ onSuccess }) => {
        onSuccess && onSuccess();
        return Promise.resolve();
      }),
      logout: jest.fn().mockResolvedValue(true),
      getIdentity: jest.fn().mockReturnValue({
        getPrincipal: jest.fn().mockReturnValue({
          toString: () => 'aaaaa-bbbbb-ccccc-ddddd-eeeee',
        }),
      }),
    }),
  },
}));

// Mock window location
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('End-to-End User Journeys', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
    
    // Set up all API mock implementations with successful responses
    mockApiService.getMyProfile.mockResolvedValue({
      success: true,
      data: {
        username: 'Test User',
        registrationDate: Date.now() * 1000000,
        completedModules: [1],
        totalTokens: 100,
      },
    });
    
    mockApiService.getAvailableModules.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          title: 'Introduction to ICP',
          description: 'Learn the basics of Internet Computer Protocol',
          tokenReward: 100,
          prerequisiteModules: [],
          questions: [{id: 1}, {id: 2}],
          content: [{id: 1}, {id: 2}, {id: 3}],
        },
        {
          id: 2,
          title: 'Smart Contracts on ICP',
          description: 'Build your first smart contract',
          tokenReward: 150,
          prerequisiteModules: [1],
          questions: [{id: 3}, {id: 4}],
          content: [{id: 4}, {id: 5}, {id: 6}],
        },
      ],
    });
    
    mockApiService.isAdmin.mockResolvedValue({
      success: true,
      data: false,
    });
  });

  describe('User Authentication Journey', () => {
    test('user can login and access learning content', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Find and click the login button
      const loginButton = await screen.findByText(/login/i);
      fireEvent.click(loginButton);
      
      // After successful login, user should be redirected to dashboard
      await waitFor(() => {
        expect(mockApiService.getMyProfile).toHaveBeenCalled();
      });
      
      // Navigate to learning page
      const startLearningButton = await screen.findByText(/start learning/i);
      fireEvent.click(startLearningButton);
      
      // Verify navigation to learning page
      expect(mockNavigate).toHaveBeenCalledWith('/learn');
    });
    
    test('user can logout successfully', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Login first
      const loginButton = await screen.findByText(/login/i);
      fireEvent.click(loginButton);
      
      // After successful login, find and click logout
      const logoutButton = await screen.findByText(/logout/i);
      fireEvent.click(logoutButton);
      
      // Verify logout called and user returned to login state
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
      });
    });
  });

  describe('Learning Module Journey', () => {
    test('user can view and start a module', async () => {
      // Mock as authenticated user
      mockApiService.isInitialized.mockReturnValue(true);
      
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );
      
      // Navigate to learning page
      const startLearningButton = await screen.findByText(/start learning/i);
      fireEvent.click(startLearningButton);
      
      // Check that modules are loaded
      await waitFor(() => {
        expect(mockApiService.getAvailableModules).toHaveBeenCalled();
      });
      
      // Select a module
      const moduleTitle = await screen.findByText('Introduction to ICP');
      fireEvent.click(moduleTitle);
      
      // Find and click start module button
      const startButton = await screen.findByText(/start module/i);
      fireEvent.click(startButton);
      
      // Verify navigation to module page
      expect(mockNavigate).toHaveBeenCalledWith('/module/1');
    });
    
    test('completed modules show as completed', async () => {
      // Mock as authenticated user with completed first module
      mockApiService.isInitialized.mockReturnValue(true);
      
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );
      
      // Navigate to learning page
      const startLearningButton = await screen.findByText(/start learning/i);
      fireEvent.click(startLearningButton);
      
      // Verify completed modules are marked
      await waitFor(() => {
        const completedModule = screen.getByText('Introduction to ICP');
        expect(completedModule.closest('div')).toHaveAttribute('completed', 'true');
      });
    });
  });

  describe('Quiz Submission Journey', () => {
    test('user can complete a quiz and earn tokens', async () => {
      // Setup for module with quiz questions
      mockApiService.getModule.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          title: 'Introduction to ICP',
          description: 'Learn the basics',
          tokenReward: 100,
        },
      });
      
      mockApiService.getModuleContent.mockResolvedValue({
        success: true,
        data: [{
          id: 1,
          contentType: ['Text', 'Introduction content'],
        }],
      });
      
      mockApiService.getModuleQuestions.mockResolvedValue({
        success: true,
        data: [
          {
            id: 1,
            text: 'What is ICP?',
            options: [
              { id: 1, text: 'Wrong answer' },
              { id: 2, text: 'Internet Computer Protocol' },
            ],
          },
        ],
      });
      
      mockApiService.submitQuizAnswers.mockResolvedValue({
        success: true,
        data: 100, // tokens earned
      });
      
      // Render the module content page
      render(
        <BrowserRouter>
          <AuthProvider>
            <ModuleContent /> {/* This would be imported from the component */}
          </AuthProvider>
        </BrowserRouter>
      );
      
      // Wait for content to load and go to quiz
      await waitFor(() => {
        expect(mockApiService.getModuleContent).toHaveBeenCalled();
      });
      
      // Click Next/Go to Quiz button
      const quizButton = screen.getByText(/go to quiz/i);
      fireEvent.click(quizButton);
      
      // Select an answer
      const correctOption = await screen.findByText('Internet Computer Protocol');
      fireEvent.click(correctOption);
      
      // Submit the quiz
      const submitButton = screen.getByText(/submit answers/i);
      fireEvent.click(submitButton);
      
      // Verify quiz submission and success display
      await waitFor(() => {
        expect(mockApiService.submitQuizAnswers).toHaveBeenCalledWith(1, [[1, 2]]);
        expect(screen.getByText(/module completed/i)).toBeInTheDocument();
        expect(screen.getByText(/100 tokens earned/i)).toBeInTheDocument();
      });
    });
  });

  describe('Admin Journey', () => {
    test('admin can access admin dashboard', async () => {
      // Mock as admin user
      mockApiService.isAdmin.mockResolvedValue({
        success: true,
        data: true,
      });
      
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );
      
      // Login
      const loginButton = await screen.findByText(/login/i);
      fireEvent.click(loginButton);
      
      // Verify admin access check
      await waitFor(() => {
        expect(mockApiService.isAdmin).toHaveBeenCalled();
      });
      
      // Verify admin dashboard access
      const adminButton = await screen.findByText(/go to admin dashboard/i);
      fireEvent.click(adminButton);
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
    
    test('admin can manage modules', async () => {
      // Mock admin functions
      mockApiService.isAdmin.mockResolvedValue({
        success: true,
        data: true,
      });
      
      mockApiService.getAllModules.mockResolvedValue({
        success: true,
        data: [
          { id: 1, title: 'Introduction to ICP' },
        ],
      });
      
      mockApiService.createModule.mockResolvedValue({
        success: true,
        data: { id: 3 },
      });
      
      // Render admin dashboard
      render(
        <BrowserRouter>
          <AuthProvider>
            <AdminDashboard /> {/* This would be imported from the component */}
          </AuthProvider>
        </BrowserRouter>
      );
      
      // Verify admin module management functionality
      await waitFor(() => {
        expect(mockApiService.getAllModules).toHaveBeenCalled();
      });
      
      // Test adding a module
      const addButton = screen.getByText(/add module/i);
      fireEvent.click(addButton);
      
      // Fill out form
      const titleInput = screen.getByLabelText(/title/i);
      const descInput = screen.getByLabelText(/description/i);
      
      fireEvent.change(titleInput, { target: { value: 'New Module' } });
      fireEvent.change(descInput, { target: { value: 'New Description' } });
      
      // Submit form
      const submitButton = screen.getByText(/create module/i);
      fireEvent.click(submitButton);
      
      // Verify module creation call
      await waitFor(() => {
        expect(mockApiService.createModule).toHaveBeenCalledWith({
          title: 'New Module',
          description: 'New Description',
        });
      });
    });
  });
}); 