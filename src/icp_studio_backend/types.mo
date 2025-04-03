// Types definition for ICP Studio

module {
  // User types
  public type UserId = Principal;
  public type UserRole = {
    #Admin;
    #User;
  };

  public type UserProfile = {
    id: UserId;
    username: Text;
    role: UserRole;
    createdAt: Int;
    totalTokens: Nat;
  };

  // Module and content types
  public type ModuleId = Nat;
  public type QuestionId = Nat;

  public type QuestionOption = {
    id: Nat;
    text: Text;
  };

  public type Question = {
    id: QuestionId;
    text: Text;
    options: [QuestionOption];
    correctOptionId: Nat;
    explanation: Text;
  };

  public type ContentType = {
    #Text: Text;
    #Image: Text; // URL or asset canister reference
    #Video: Text; // URL or asset canister reference
    #Code: Text;
  };

  public type ContentBlock = {
    id: Nat;
    contentType: ContentType;
    order: Nat;
  };

  public type Module = {
    id: ModuleId;
    title: Text;
    description: Text;
    content: [ContentBlock];
    questions: [Question];
    tokenReward: Nat;
    prerequisiteModules: [ModuleId];
    createdAt: Int;
    updatedAt: Int;
    createdBy: UserId;
  };

  // User progress tracking
  public type ModuleProgress = {
    moduleId: ModuleId;
    completed: Bool;
    startedAt: Int;
    completedAt: ?Int;
    attempts: Nat;
    lastScore: ?Nat;
  };

  public type UserProgress = {
    userId: UserId;
    completedModules: [ModuleId];
    moduleProgress: [ModuleProgress];
    totalTokens: Nat;
    lastActivity: Int;
  };

  // Quiz submission
  public type QuizSubmission = {
    userId: UserId;
    moduleId: ModuleId;
    answers: [(QuestionId, Nat)]; // (QuestionId, Selected OptionId)
    score: Nat;
    maxScore: Nat;
    submittedAt: Int;
    passed: Bool;
  };

  // Admin activity logging
  public type ActivityType = {
    #CreateModule;
    #UpdateModule;
    #DeleteModule;
    #CreateUser;
    #UpdateUser;
    #DeleteUser;
    #Other: Text;
  };

  public type AdminActivity = {
    adminId: UserId;
    activityType: ActivityType;
    targetId: Text; // Could be a module ID, user ID, etc.
    details: Text;
    timestamp: Int;
  };
} 