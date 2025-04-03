# ICP Studio API Documentation

This document provides technical documentation for the ICP Studio backend canister API. It describes all public functions, their parameters, return types, and includes examples of usage.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Module Management](#module-management)
4. [Content & Quiz Management](#content--quiz-management)
5. [Progress & Rewards](#progress--rewards)
6. [Admin Functions](#admin-functions)
7. [Error Handling](#error-handling)
8. [Integration Examples](#integration-examples)

## Authentication

### Internet Identity Integration

ICP Studio uses Internet Identity for authentication. The principal derived from Internet Identity is used to identify users and determine permissions.

## User Management

### `registerUser`

Registers a new user in the system or updates an existing user's information.

**Method Type**: Update

**Parameters**:
- `username: Text` - The user's display name

**Returns**: 
- `Result<UserProfile, Text>` - The created/updated user profile or an error message

**Example**:
```javascript
const result = await icp_studio_backend.registerUser("alice_developer");
if (result.ok) {
  console.log("User registered:", result.ok);
} else {
  console.error("Error:", result.err);
}
```

### `getMyProfile`

Retrieves the profile of the calling user.

**Method Type**: Query

**Parameters**: None

**Returns**: 
- `Result<UserProfile, Text>` - The user's profile or an error message

**Example**:
```javascript
const result = await icp_studio_backend.getMyProfile();
if (result.ok) {
  console.log("Profile:", result.ok);
} else {
  console.error("Error:", result.err);
}
```

### `getUserProfile`

Retrieves the profile of a specified user. Requires admin permissions to view other user profiles.

**Method Type**: Query

**Parameters**:
- `userId: Principal` - The principal ID of the user to retrieve

**Returns**: 
- `Result<UserProfile, Text>` - The requested user's profile or an error message

**Example**:
```javascript
const userId = Principal.fromText("abc-def-ghi-jkl");
const result = await icp_studio_backend.getUserProfile(userId);
if (result.ok) {
  console.log("User profile:", result.ok);
} else {
  console.error("Error:", result.err);
}
```

## Module Management

### `getAvailableModules`

Returns a list of all modules available to the user.

**Method Type**: Query

**Parameters**: None

**Returns**: 
- `[ModuleSummary]` - Array of module summaries

**Example**:
```javascript
const modules = await icp_studio_backend.getAvailableModules();
console.log("Available modules:", modules);
```

### `getModule`

Returns detailed information about a specific module.

**Method Type**: Query

**Parameters**:
- `moduleId: Nat` - The ID of the module to retrieve

**Returns**: 
- `Result<Module, Text>` - The module details or an error message

**Example**:
```javascript
const moduleId = 1;
const result = await icp_studio_backend.getModule(moduleId);
if (result.ok) {
  console.log("Module details:", result.ok);
} else {
  console.error("Module not found:", result.err);
}
```

## Content & Quiz Management

### `getModuleContent`

Retrieves the learning content for a specific module.

**Method Type**: Query

**Parameters**:
- `moduleId: Nat` - The ID of the module

**Returns**: 
- `Result<[Content], Text>` - Array of content blocks for the module or an error message

**Example**:
```javascript
const moduleId = 1;
const result = await icp_studio_backend.getModuleContent(moduleId);
if (result.ok) {
  console.log("Module content:", result.ok);
} else {
  console.error("Error retrieving content:", result.err);
}
```

### `getModuleQuestions`

Retrieves the quiz questions for a specific module.

**Method Type**: Query

**Parameters**:
- `moduleId: Nat` - The ID of the module

**Returns**: 
- `Result<[Question], Text>` - Array of questions for the module or an error message

**Example**:
```javascript
const moduleId = 1;
const result = await icp_studio_backend.getModuleQuestions(moduleId);
if (result.ok) {
  console.log("Module questions:", result.ok);
} else {
  console.error("Error retrieving questions:", result.err);
}
```

### `submitQuizAnswers`

Submits answers to a module's quiz and processes module completion if answers are correct.

**Method Type**: Update

**Parameters**:
- `moduleId: Nat` - The ID of the module
- `answers: [[Nat, Nat]]` - Array of [questionId, answerId] pairs

**Returns**: 
- `Result<Nat, Text>` - Tokens earned if successful or an error message

**Example**:
```javascript
const moduleId = 1;
const answers = [[1, 2], [2, 1], [3, 3]]; // [questionId, answerId]
const result = await icp_studio_backend.submitQuizAnswers(moduleId, answers);
if (result.ok) {
  console.log("Tokens earned:", result.ok);
} else {
  console.error("Quiz submission error:", result.err);
}
```

## Progress & Rewards

### `getUserProgress`

Retrieves the learning progress for the calling user.

**Method Type**: Query

**Parameters**: None

**Returns**: 
- `UserProgress` - The user's learning progress including completed modules and tokens

**Example**:
```javascript
const progress = await icp_studio_backend.getUserProgress();
console.log("User progress:", progress);
console.log("Completed modules:", progress.completedModules);
console.log("Total tokens:", progress.totalTokens);
```

### `getUserAchievements`

Retrieves the achievements earned by the calling user.

**Method Type**: Query

**Parameters**: None

**Returns**: 
- `[Achievement]` - Array of achievements earned by the user

**Example**:
```javascript
const achievements = await icp_studio_backend.getUserAchievements();
console.log("User achievements:", achievements);
```

## Admin Functions

### `isUserAdmin`

Checks if a given principal has admin privileges.

**Method Type**: Query

**Parameters**:
- `principal: Principal` - The principal ID to check

**Returns**: 
- `Bool` - True if the principal has admin privileges, false otherwise

**Example**:
```javascript
const principal = Principal.fromText("abc-def-ghi-jkl");
const isAdmin = await icp_studio_backend.isUserAdmin(principal);
console.log("Is admin:", isAdmin);
```

### `addModule`

Adds a new module to the platform. Requires admin privileges.

**Method Type**: Update

**Parameters**:
- `module: ModuleInput` - The module details to add

**Returns**: 
- `Result<Nat, Text>` - The ID of the created module or an error message

**Example**:
```javascript
const moduleInput = {
  title: "Introduction to ICP",
  description: "Learn the basics of Internet Computer Protocol",
  tokenReward: 100,
  prerequisiteModules: []
};
const result = await icp_studio_backend.addModule(moduleInput);
if (result.ok) {
  console.log("New module ID:", result.ok);
} else {
  console.error("Error creating module:", result.err);
}
```

### `updateModule`

Updates an existing module. Requires admin privileges.

**Method Type**: Update

**Parameters**:
- `moduleId: Nat` - The ID of the module to update
- `module: ModuleInput` - The updated module details

**Returns**: 
- `Result<Bool, Text>` - Success status or an error message

**Example**:
```javascript
const moduleId = 1;
const moduleUpdate = {
  title: "Updated: Introduction to ICP",
  description: "Learn the fundamentals of Internet Computer Protocol",
  tokenReward: 120,
  prerequisiteModules: []
};
const result = await icp_studio_backend.updateModule(moduleId, moduleUpdate);
if (result.ok) {
  console.log("Module updated successfully");
} else {
  console.error("Error updating module:", result.err);
}
```

### `deleteModule`

Deletes a module. Requires admin privileges.

**Method Type**: Update

**Parameters**:
- `moduleId: Nat` - The ID of the module to delete

**Returns**: 
- `Result<Bool, Text>` - Success status or an error message

**Example**:
```javascript
const moduleId = 1;
const result = await icp_studio_backend.deleteModule(moduleId);
if (result.ok) {
  console.log("Module deleted successfully");
} else {
  console.error("Error deleting module:", result.err);
}
```

### `addContentToModule`

Adds content to a module. Requires admin privileges.

**Method Type**: Update

**Parameters**:
- `moduleId: Nat` - The ID of the module
- `content: ContentInput` - The content to add

**Returns**: 
- `Result<Nat, Text>` - The content ID or an error message

**Example**:
```javascript
const moduleId = 1;
const content = {
  contentType: { Text: "This is an introduction to ICP fundamentals" },
  sortOrder: 1
};
const result = await icp_studio_backend.addContentToModule(moduleId, content);
if (result.ok) {
  console.log("Content added, ID:", result.ok);
} else {
  console.error("Error adding content:", result.err);
}
```

### `addQuestionToModule`

Adds a quiz question to a module. Requires admin privileges.

**Method Type**: Update

**Parameters**:
- `moduleId: Nat` - The ID of the module
- `question: QuestionInput` - The question to add

**Returns**: 
- `Result<Nat, Text>` - The question ID or an error message

**Example**:
```javascript
const moduleId = 1;
const question = {
  text: "What does ICP stand for?",
  options: [
    "Internet Connection Protocol",
    "Internet Computer Protocol",
    "Internal Computing Process",
    "Integrated Computing Platform"
  ],
  correctAnswer: 1 // 0-based index, so 1 = "Internet Computer Protocol"
};
const result = await icp_studio_backend.addQuestionToModule(moduleId, question);
if (result.ok) {
  console.log("Question added, ID:", result.ok);
} else {
  console.error("Error adding question:", result.err);
}
```

### `addAdmin`

Adds a new admin user. Requires admin privileges.

**Method Type**: Update

**Parameters**:
- `principal: Principal` - The principal ID to grant admin privileges

**Returns**: 
- `Result<Bool, Text>` - Success status or an error message

**Example**:
```javascript
const newAdminPrincipal = Principal.fromText("abc-def-ghi-jkl");
const result = await icp_studio_backend.addAdmin(newAdminPrincipal);
if (result.ok) {
  console.log("Admin added successfully");
} else {
  console.error("Error adding admin:", result.err);
}
```

### `removeAdmin`

Removes admin privileges from a user. Requires admin privileges.

**Method Type**: Update

**Parameters**:
- `principal: Principal` - The principal ID to remove admin privileges from

**Returns**: 
- `Result<Bool, Text>` - Success status or an error message

**Example**:
```javascript
const adminPrincipal = Principal.fromText("abc-def-ghi-jkl");
const result = await icp_studio_backend.removeAdmin(adminPrincipal);
if (result.ok) {
  console.log("Admin removed successfully");
} else {
  console.error("Error removing admin:", result.err);
}
```

### `listAdmins`

Lists all admin users. Requires admin privileges.

**Method Type**: Query

**Parameters**: None

**Returns**: 
- `[UserProfile]` - Array of admin user profiles

**Example**:
```javascript
const admins = await icp_studio_backend.listAdmins();
console.log("Admin users:", admins);
```

### `getAdminActivityLog`

Retrieves the admin activity log. Requires admin privileges.

**Method Type**: Query

**Parameters**:
- `limit: Nat` - Maximum number of log entries to retrieve (optional, default: 100)

**Returns**: 
- `[AdminActivity]` - Array of admin activity log entries

**Example**:
```javascript
const limit = 50;
const activityLog = await icp_studio_backend.getAdminActivityLog(limit);
console.log("Admin activity log:", activityLog);
```

## Error Handling

All API functions that return a `Result` type may return an error message as part of the `err` variant. Common error scenarios include:

- Insufficient permissions
- Invalid input parameters
- Resource not found
- Operation not allowed

Example of error handling:

```javascript
const result = await icp_studio_backend.getModule(999); // Non-existent module
if (result.ok) {
  console.log("Module:", result.ok);
} else {
  console.error("Error:", result.err);
  // Handle error appropriately, e.g., show message to user
}
```

## Integration Examples

### Example: User Registration and Module Access

```javascript
// Register a new user
const registerResult = await icp_studio_backend.registerUser("new_learner");
if (registerResult.err) {
  console.error("Registration failed:", registerResult.err);
  return;
}

// Get available modules
const modules = await icp_studio_backend.getAvailableModules();
console.log("Available modules:", modules);

// Access first module content
if (modules.length > 0) {
  const firstModuleId = modules[0].id;
  const contentResult = await icp_studio_backend.getModuleContent(firstModuleId);
  if (contentResult.ok) {
    console.log(`Module ${firstModuleId} content:`, contentResult.ok);
  }
}
```

### Example: Complete a Module

```javascript
// Get module questions
const moduleId = 1;
const questionsResult = await icp_studio_backend.getModuleQuestions(moduleId);

if (questionsResult.err) {
  console.error("Failed to get questions:", questionsResult.err);
  return;
}

// Prepare answers (in a real scenario, these would come from user input)
// Format: [[questionId, answerId], [questionId, answerId], ...]
const answers = questionsResult.ok.map(question => {
  return [question.id, question.correctOption]; // In a real app, you wouldn't know the correct option
});

// Submit quiz answers
const submissionResult = await icp_studio_backend.submitQuizAnswers(moduleId, answers);
if (submissionResult.ok) {
  console.log(`Module completed! Earned ${submissionResult.ok} tokens`);
  
  // Check updated progress
  const progress = await icp_studio_backend.getUserProgress();
  console.log("Updated progress:", progress);
}
```

### Example: Admin Creating a New Module

```javascript
// Check if user is admin
const principal = await identity.getPrincipal();
const isAdmin = await icp_studio_backend.isUserAdmin(principal);

if (!isAdmin) {
  console.error("Admin privileges required");
  return;
}

// Create new module
const newModule = {
  title: "Advanced ICP Development",
  description: "Learn advanced topics in Internet Computer development",
  tokenReward: 200,
  prerequisiteModules: [1, 2] // Requires modules 1 and 2 to be completed first
};

const moduleResult = await icp_studio_backend.addModule(newModule);
if (moduleResult.err) {
  console.error("Failed to create module:", moduleResult.err);
  return;
}

const moduleId = moduleResult.ok;
console.log(`Created module with ID: ${moduleId}`);

// Add content
const contentResult = await icp_studio_backend.addContentToModule(moduleId, {
  contentType: { Text: "# Advanced ICP Development\n\nIn this module, you will learn..." },
  sortOrder: 1
});

// Add questions
const questionResult = await icp_studio_backend.addQuestionToModule(moduleId, {
  text: "Which of these is NOT a feature of Internet Computer?",
  options: [
    "Smart contracts",
    "Web hosting",
    "Proof of Work consensus",
    "On-chain storage"
  ],
  correctAnswer: 2 // "Proof of Work consensus" is NOT a feature of IC
});

console.log("Module setup complete!");
```

---

## Data Types

### UserProfile

```motoko
type UserProfile = {
  userId: Principal;
  username: Text;
  registrationDate: Int; // Nanoseconds
  isAdmin: Bool;
};
```

### Module

```motoko
type Module = {
  id: Nat;
  title: Text;
  description: Text;
  tokenReward: Nat;
  prerequisiteModules: [Nat];
  content: [Content];
  questions: [Question];
};
```

### ModuleSummary

```motoko
type ModuleSummary = {
  id: Nat;
  title: Text;
  description: Text;
  tokenReward: Nat;
  prerequisiteModules: [Nat];
  completedByUser: Bool;
};
```

### Content

```motoko
type Content = {
  id: Nat;
  contentType: ContentType;
  sortOrder: Nat;
};

type ContentType = {
  #Text: Text;
  #Image: {url: Text; caption: Text};
  #Video: {url: Text; description: Text};
  #Code: {language: Text; code: Text};
};
```

### Question

```motoko
type Question = {
  id: Nat;
  text: Text;
  options: [Text];
  correctOption: Nat;
};
```

### UserProgress

```motoko
type UserProgress = {
  completedModules: [Nat];
  totalTokens: Nat;
};
```

### Achievement

```motoko
type Achievement = {
  id: Nat;
  title: Text;
  description: Text;
  dateEarned: Int; // Nanoseconds
  tokenReward: Nat;
};
```

### AdminActivity

```motoko
type AdminActivity = {
  adminId: Principal;
  action: Text;
  timestamp: Int; // Nanoseconds
  details: Text;
};
``` 