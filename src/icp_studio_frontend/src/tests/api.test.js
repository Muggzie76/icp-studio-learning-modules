import apiService from '../services/api';

describe('API Service', () => {
  const mockActor = {
    getMyProfile: jest.fn(),
    getAvailableModules: jest.fn(),
    getModule: jest.fn(),
    getModuleContent: jest.fn(),
    getModuleQuestions: jest.fn(),
    submitQuizAnswers: jest.fn(),
    getUserAchievements: jest.fn(),
    isUserAdmin: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiService.initialize(mockActor);
  });

  test('should initialize with actor', () => {
    expect(apiService.isInitialized()).toBe(true);
  });

  test('should return error when not initialized', async () => {
    apiService.initialize(null);
    const result = await apiService.getMyProfile();
    
    expect(result).toEqual({
      success: false,
      error: 'API service not initialized',
      data: null
    });
  });

  test('should handle successful response', async () => {
    const mockData = { username: 'Test User', totalTokens: 100 };
    mockActor.getMyProfile.mockResolvedValue({ ok: mockData });
    
    const result = await apiService.getMyProfile();
    
    expect(mockActor.getMyProfile).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: mockData,
      error: null
    });
  });

  test('should handle error response', async () => {
    const mockError = 'Profile not found';
    mockActor.getMyProfile.mockResolvedValue({ err: mockError });
    
    const result = await apiService.getMyProfile();
    
    expect(mockActor.getMyProfile).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      data: null,
      error: mockError
    });
  });

  test('should handle regular successful response', async () => {
    const mockData = [{ id: 1, title: 'Module 1' }];
    mockActor.getAvailableModules.mockResolvedValue(mockData);
    
    const result = await apiService.getAvailableModules();
    
    expect(mockActor.getAvailableModules).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: mockData,
      error: null
    });
  });

  test('should handle exceptions', async () => {
    const errorMessage = 'Network error';
    mockActor.getMyProfile.mockRejectedValue(new Error(errorMessage));
    
    const result = await apiService.getMyProfile();
    
    expect(mockActor.getMyProfile).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      data: null,
      error: errorMessage
    });
  });

  test('should convert moduleId to Number for relevant methods', async () => {
    mockActor.getModule.mockResolvedValue({ ok: { id: '1', title: 'Module 1' } });
    
    await apiService.getModule('1');
    
    expect(mockActor.getModule).toHaveBeenCalledWith(1);
  });

  test('should format answers for submitQuizAnswers', async () => {
    const moduleId = '1';
    const answers = [[1, 2], [3, 4]];
    mockActor.submitQuizAnswers.mockResolvedValue({ ok: 100 });
    
    await apiService.submitQuizAnswers(moduleId, answers);
    
    expect(mockActor.submitQuizAnswers).toHaveBeenCalledWith(1, answers);
  });

  test('should handle isAdmin correctly', async () => {
    const principal = { toText: () => 'abcde-fghij' };
    mockActor.isUserAdmin.mockResolvedValue(true);
    
    const result = await apiService.isAdmin(principal);
    
    expect(mockActor.isUserAdmin).toHaveBeenCalledWith(principal);
    expect(result).toEqual({
      success: true,
      data: true,
      error: null
    });
  });
}); 