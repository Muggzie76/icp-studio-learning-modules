import { Actor } from '@dfinity/agent';

/**
 * API Service for handling all interactions with the backend canister
 */
class ApiService {
  constructor() {
    this.actor = null;
  }

  /**
   * Initialize the API service with the authenticated actor
   * @param {Object} actor - The authenticated actor instance
   */
  initialize(actor) {
    this.actor = actor;
  }

  /**
   * Check if the API service is initialized
   * @returns {boolean} True if initialized, false otherwise
   */
  isInitialized() {
    return !!this.actor;
  }

  /**
   * Execute an API call with standardized error handling
   * @param {Function} apiCall - Async function that makes the actual API call
   * @returns {Promise<Object>} The result with standardized format { success, data, error }
   */
  async executeCall(apiCall) {
    if (!this.isInitialized()) {
      return {
        success: false,
        error: 'API service not initialized',
        data: null
      };
    }

    try {
      const result = await apiCall();
      
      // Handle Candid variants (if result has ok/err properties)
      if (result && typeof result === 'object') {
        if ('ok' in result) {
          return {
            success: true,
            data: result.ok,
            error: null
          };
        }
        
        if ('err' in result) {
          return {
            success: false,
            data: null,
            error: result.err
          };
        }
      }
      
      // Regular successful result
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  // === User Management ===
  
  /**
   * Get the current user's profile
   * @returns {Promise<Object>} User profile with standardized response format
   */
  async getMyProfile() {
    return this.executeCall(() => this.actor.getMyProfile());
  }
  
  /**
   * Register a new user (if not already registered)
   * @param {string} username - The username for the new user
   * @returns {Promise<Object>} Registration result with standardized response format
   */
  async registerUser(username) {
    return this.executeCall(() => this.actor.registerUser(username));
  }
  
  /**
   * Check if a principal is an admin
   * @param {Principal} principal - The principal to check
   * @returns {Promise<Object>} Admin status with standardized response format
   */
  async isAdmin(principal) {
    return this.executeCall(() => this.actor.isUserAdmin(principal));
  }

  /**
   * Get the user's achievements
   * @param {Principal} principal - The user's principal
   * @returns {Promise<Object>} User achievements with standardized response format
   */
  async getUserAchievements(principal) {
    return this.executeCall(() => this.actor.getUserAchievements(principal));
  }

  // === Module Management ===
  
  /**
   * Get all available modules
   * @returns {Promise<Object>} Available modules with standardized response format
   */
  async getAvailableModules() {
    return this.executeCall(() => this.actor.getAvailableModules());
  }
  
  /**
   * Get a specific module by ID
   * @param {number} moduleId - The ID of the module to retrieve
   * @returns {Promise<Object>} Module data with standardized response format
   */
  async getModule(moduleId) {
    return this.executeCall(() => this.actor.getModule(Number(moduleId)));
  }
  
  /**
   * Get the content for a specific module
   * @param {number} moduleId - The ID of the module
   * @returns {Promise<Object>} Module content with standardized response format
   */
  async getModuleContent(moduleId) {
    return this.executeCall(() => this.actor.getModuleContent(Number(moduleId)));
  }
  
  /**
   * Get questions for a specific module
   * @param {number} moduleId - The ID of the module
   * @returns {Promise<Object>} Module questions with standardized response format
   */
  async getModuleQuestions(moduleId) {
    return this.executeCall(() => this.actor.getModuleQuestions(Number(moduleId)));
  }
  
  /**
   * Submit quiz answers for a module
   * @param {number} moduleId - The ID of the module
   * @param {Array<Array<number>>} answers - Array of [questionId, answerId] pairs
   * @returns {Promise<Object>} Submission result with standardized response format
   */
  async submitQuizAnswers(moduleId, answers) {
    return this.executeCall(() => this.actor.submitQuizAnswers(Number(moduleId), answers));
  }

  // === Admin Functions ===
  
  /**
   * Create a new module (admin only)
   * @param {Object} moduleData - The module data
   * @returns {Promise<Object>} Creation result with standardized response format
   */
  async createModule(moduleData) {
    return this.executeCall(() => this.actor.createModule(moduleData));
  }
  
  /**
   * Update an existing module (admin only)
   * @param {number} moduleId - The ID of the module to update
   * @param {Object} moduleData - The updated module data
   * @returns {Promise<Object>} Update result with standardized response format
   */
  async updateModule(moduleId, moduleData) {
    return this.executeCall(() => this.actor.updateModule(Number(moduleId), moduleData));
  }
  
  /**
   * Delete a module (admin only)
   * @param {number} moduleId - The ID of the module to delete
   * @returns {Promise<Object>} Deletion result with standardized response format
   */
  async deleteModule(moduleId) {
    return this.executeCall(() => this.actor.deleteModule(Number(moduleId)));
  }
  
  /**
   * Add content to a module (admin only)
   * @param {number} moduleId - The ID of the module
   * @param {Object} content - The content to add
   * @returns {Promise<Object>} Result with standardized response format
   */
  async addModuleContent(moduleId, content) {
    return this.executeCall(() => this.actor.addModuleContent(Number(moduleId), content));
  }
  
  /**
   * Add a question to a module (admin only)
   * @param {number} moduleId - The ID of the module
   * @param {Object} question - The question to add
   * @returns {Promise<Object>} Result with standardized response format
   */
  async addModuleQuestion(moduleId, question) {
    return this.executeCall(() => this.actor.addModuleQuestion(Number(moduleId), question));
  }
  
  /**
   * Get all users (admin only)
   * @returns {Promise<Object>} Users with standardized response format
   */
  async getAllUsers() {
    return this.executeCall(() => this.actor.getAllUsers());
  }
  
  /**
   * Get all admins (admin only)
   * @returns {Promise<Object>} Admins with standardized response format
   */
  async getAllAdmins() {
    return this.executeCall(() => this.actor.listAdmins());
  }
  
  /**
   * Add a new admin (admin only)
   * @param {Principal} principal - The principal to make admin
   * @returns {Promise<Object>} Result with standardized response format
   */
  async addAdmin(principal) {
    return this.executeCall(() => this.actor.addAdmin(principal));
  }
  
  /**
   * Remove an admin (admin only)
   * @param {Principal} principal - The principal to remove admin rights from
   * @returns {Promise<Object>} Result with standardized response format
   */
  async removeAdmin(principal) {
    return this.executeCall(() => this.actor.removeAdmin(principal));
  }
  
  /**
   * Get admin activity log (admin only)
   * @param {number} limit - Number of entries to retrieve
   * @returns {Promise<Object>} Activity log with standardized response format
   */
  async getAdminActivityLog(limit = 100) {
    return this.executeCall(() => this.actor.getAdminActivityLog(limit));
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService; 