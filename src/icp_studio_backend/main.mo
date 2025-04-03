import Types = "types";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";
import Debug "mo:base/Debug";

actor IcpStudio {
  // Stable storage - these variables persist across canister upgrades
  stable var nextModuleId : Types.ModuleId = 0;
  stable var nextQuestionId : Types.QuestionId = 0;
  
  // Stable variables for serialization during upgrades
  stable var usersEntries : [(Principal, Types.UserProfile)] = [];
  stable var modulesEntries : [(Types.ModuleId, Types.Module)] = [];
  stable var userProgressEntries : [(Principal, Types.UserProgress)] = [];
  stable var adminActivitiesArray : [Types.AdminActivity] = [];
  stable var quizSubmissionsArray : [Types.QuizSubmission] = [];
  
  // Custom hash function for Nat
  private func natHash(n : Nat) : Hash.Hash {
    return Nat32.fromNat(n);
  };
  
  // Runtime data structures
  var users = HashMap.HashMap<Principal, Types.UserProfile>(0, Principal.equal, Principal.hash);
  var modules = HashMap.HashMap<Types.ModuleId, Types.Module>(0, Nat.equal, natHash);
  var userProgress = HashMap.HashMap<Principal, Types.UserProgress>(0, Principal.equal, Principal.hash);
  var adminActivities = Buffer.Buffer<Types.AdminActivity>(0);
  var quizSubmissions = Buffer.Buffer<Types.QuizSubmission>(0);
  
  // Default admin is set during initialization
  let defaultAdminPrincipal : Principal = Principal.fromText("rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae");
  
  // Initialize the canister - executed once when first deployed
  private func initialize() {
    // Setup the default admin if users is empty
    if (users.size() == 0) {
      let adminProfile : Types.UserProfile = {
        id = defaultAdminPrincipal;
        username = "Admin";
        role = #Admin;
        createdAt = Time.now();
        totalTokens = 0;
      };
      users.put(defaultAdminPrincipal, adminProfile);
    } else {
      // Ensure the default admin exists even if other users are present
      switch (users.get(defaultAdminPrincipal)) {
        case (null) {
          let adminProfile : Types.UserProfile = {
            id = defaultAdminPrincipal;
            username = "Admin";
            role = #Admin;
            createdAt = Time.now();
            totalTokens = 0;
          };
          users.put(defaultAdminPrincipal, adminProfile);
        };
        case (?userProfile) {
          // If user exists but is not admin, promote to admin
          if (userProfile.role != #Admin) {
            let updatedProfile : Types.UserProfile = {
              id = userProfile.id;
              username = userProfile.username;
              role = #Admin;
              createdAt = userProfile.createdAt;
              totalTokens = userProfile.totalTokens;
            };
            users.put(defaultAdminPrincipal, updatedProfile);
          };
        };
      };
    };
  };
  
  // Call initialize during deployment
  initialize();
  
  // Handle canister upgrade
  system func preupgrade() {
    // Convert in-memory data structures to stable variables
    usersEntries := Iter.toArray(users.entries());
    modulesEntries := Iter.toArray(modules.entries());
    userProgressEntries := Iter.toArray(userProgress.entries());
    adminActivitiesArray := adminActivities.toArray();
    quizSubmissionsArray := quizSubmissions.toArray();
  };
  
  system func postupgrade() {
    // Restore in-memory data structures from stable variables
    users := HashMap.fromIter<Principal, Types.UserProfile>(
      Iter.fromArray(usersEntries), 
      usersEntries.size(), 
      Principal.equal, 
      Principal.hash
    );
    
    modules := HashMap.fromIter<Types.ModuleId, Types.Module>(
      Iter.fromArray(modulesEntries), 
      modulesEntries.size(), 
      Nat.equal, 
      natHash
    );
    
    userProgress := HashMap.fromIter<Principal, Types.UserProgress>(
      Iter.fromArray(userProgressEntries), 
      userProgressEntries.size(), 
      Principal.equal, 
      Principal.hash
    );
    
    // Convert arrays back to buffers
    adminActivities := Buffer.Buffer<Types.AdminActivity>(adminActivitiesArray.size());
    for (activity in adminActivitiesArray.vals()) {
      adminActivities.add(activity);
    };
    
    quizSubmissions := Buffer.Buffer<Types.QuizSubmission>(quizSubmissionsArray.size());
    for (submission in quizSubmissionsArray.vals()) {
      quizSubmissions.add(submission);
    };
    
    // Clear stable variables to free memory
    usersEntries := [];
    modulesEntries := [];
    userProgressEntries := [];
    adminActivitiesArray := [];
    quizSubmissionsArray := [];
  };
  
  // Helper functions
  private func isAdmin(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?userProfile) {
        switch (userProfile.role) {
          case (#Admin) { true };
          case (_) { false };
        };
      };
    };
  };
  
  private func logAdminActivity(
    caller : Principal, 
    activityType : Types.ActivityType, 
    targetId : Text, 
    details : Text
  ) {
    let activity : Types.AdminActivity = {
      adminId = caller;
      activityType = activityType;
      targetId = targetId;
      details = details;
      timestamp = Time.now();
    };
    adminActivities.add(activity);
  };
  
  // Admin Authentication System
  
  // Get current user role
  public query(msg) func getUserRole() : async Types.UserRole {
    switch (users.get(msg.caller)) {
      case (null) { #User };
      case (?profile) { profile.role };
    };
  };
  
  // Check if caller is admin
  public query(msg) func isCallerAdmin() : async Bool {
    isAdmin(msg.caller)
  };
  
  // Add a new admin (only callable by existing admins)
  public shared(msg) func addAdmin(newAdminPrincipal : Principal, username : Text) : async Result.Result<(), Text> {
    let caller = msg.caller;
    
    // Check if there are no admins yet (first admin setup)
    let adminCount = Array.filter<Types.UserProfile>(Iter.toArray(users.vals()), func(user) {
      switch (user.role) {
        case (#Admin) { true };
        case (_) { false };
      };
    }).size();
    
    // If no admins exist yet, allow the first admin to be created without restrictions
    // Otherwise, verify the caller is an admin
    if (adminCount == 0) {
      Debug.print("First admin creation - no authentication required");
    } else if (not isAdmin(caller)) {
      return #err("Unauthorized: Only admins can add new admins");
    };
    
    // Check if user already exists
    switch (users.get(newAdminPrincipal)) {
      case (?userProfile) {
        // Update role if user exists but is not admin
        if (userProfile.role != #Admin) {
          let updatedProfile : Types.UserProfile = {
            id = userProfile.id;
            username = userProfile.username;
            role = #Admin;
            createdAt = userProfile.createdAt;
            totalTokens = userProfile.totalTokens;
          };
          users.put(newAdminPrincipal, updatedProfile);
          
          logAdminActivity(
            msg.caller,
            #UpdateUser,
            Principal.toText(newAdminPrincipal),
            "Promoted user to admin"
          );
          return #ok();
        } else {
          return #err("User is already an admin");
        };
      };
      case (null) {
        // Create new admin profile if user doesn't exist
        let adminProfile : Types.UserProfile = {
          id = newAdminPrincipal;
          username = username;
          role = #Admin;
          createdAt = Time.now();
          totalTokens = 0;
        };
        users.put(newAdminPrincipal, adminProfile);
        
        logAdminActivity(
          msg.caller,
          #CreateUser,
          Principal.toText(newAdminPrincipal),
          "Created new admin user"
        );
        return #ok();
      };
    };
  };
  
  // Remove admin role (only callable by existing admins)
  public shared(msg) func removeAdmin(adminPrincipal : Principal) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can remove admins");
    };
    
    // Cannot remove self
    if (Principal.equal(msg.caller, adminPrincipal)) {
      return #err("Cannot remove yourself from admin role");
    };
    
    // Check if user exists and is admin
    switch (users.get(adminPrincipal)) {
      case (?userProfile) {
        if (userProfile.role == #Admin) {
          let updatedProfile : Types.UserProfile = {
            id = userProfile.id;
            username = userProfile.username;
            role = #User;
            createdAt = userProfile.createdAt;
            totalTokens = userProfile.totalTokens;
          };
          users.put(adminPrincipal, updatedProfile);
          
          logAdminActivity(
            msg.caller,
            #UpdateUser,
            Principal.toText(adminPrincipal),
            "Removed admin role"
          );
          return #ok();
        } else {
          return #err("User is not an admin");
        };
      };
      case (null) {
        return #err("User does not exist");
      };
    };
  };
  
  // List all admins (only callable by admins)
  public query(msg) func listAdmins() : async Result.Result<[Types.UserProfile], Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can view admin list");
    };
    
    let adminBuffer = Buffer.Buffer<Types.UserProfile>(0);
    for ((_, profile) in users.entries()) {
      switch (profile.role) {
        case (#Admin) { adminBuffer.add(profile) };
        case (_) {};
      };
    };
    
    return #ok(adminBuffer.toArray());
  };
  
  // Get admin activity log (only callable by admins)
  public query(msg) func getAdminActivityLog(limit : Nat) : async Result.Result<[Types.AdminActivity], Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can view activity logs");
    };
    
    let size = adminActivities.size();
    let startIndex = if (size > limit) { size - limit } else { 0 };
    let result = Buffer.Buffer<Types.AdminActivity>(limit);
    
    var i = startIndex;
    while (i < size) {
      result.add(adminActivities.get(i));
      i += 1;
    };
    
    return #ok(result.toArray());
  };
  
  // Module Management System
  
  // Create a new module (admin only)
  public shared(msg) func createModule(
    title: Text,
    description: Text,
    tokenReward: Nat,
    prerequisiteModules: [Types.ModuleId]
  ) : async Result.Result<Types.ModuleId, Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can create modules");
    };
    
    // Validate inputs
    if (Text.size(title) < 3) {
      return #err("Title must be at least 3 characters");
    };
    
    if (Text.size(description) < 10) {
      return #err("Description must be at least 10 characters");
    };
    
    // Validate prerequisites - make sure they all exist
    for (prereqId in prerequisiteModules.vals()) {
      if (Option.isNull(modules.get(prereqId))) {
        return #err("Prerequisite module with ID " # Nat.toText(prereqId) # " does not exist");
      };
    };
    
    // Create the new module
    let moduleId = nextModuleId;
    let newModule : Types.Module = {
      id = moduleId;
      title = title;
      description = description;
      content = [];
      questions = [];
      tokenReward = tokenReward;
      prerequisiteModules = prerequisiteModules;
      createdAt = Time.now();
      updatedAt = Time.now();
      createdBy = msg.caller;
    };
    
    modules.put(moduleId, newModule);
    nextModuleId += 1;
    
    // Log activity
    logAdminActivity(
      msg.caller,
      #CreateModule,
      Nat.toText(moduleId),
      "Created new module: " # title
    );
    
    return #ok(moduleId);
  };
  
  // Update an existing module (admin only)
  public shared(msg) func updateModule(
    moduleId: Types.ModuleId,
    title: ?Text,
    description: ?Text,
    tokenReward: ?Nat,
    prerequisiteModules: ?[Types.ModuleId]
  ) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can update modules");
    };
    
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?existingModule) {
        // Validate prerequisites if provided
        switch (prerequisiteModules) {
          case (?prereqs) {
            for (prereqId in prereqs.vals()) {
              if (Option.isNull(modules.get(prereqId))) {
                return #err("Prerequisite module with ID " # Nat.toText(prereqId) # " does not exist");
              };
            };
          };
          case (null) {};
        };
        
        // Create updated module
        let updatedModule : Types.Module = {
          id = existingModule.id;
          title = Option.get(title, existingModule.title);
          description = Option.get(description, existingModule.description);
          content = existingModule.content;
          questions = existingModule.questions;
          tokenReward = Option.get(tokenReward, existingModule.tokenReward);
          prerequisiteModules = Option.get(prerequisiteModules, existingModule.prerequisiteModules);
          createdAt = existingModule.createdAt;
          updatedAt = Time.now();
          createdBy = existingModule.createdBy;
        };
        
        modules.put(moduleId, updatedModule);
        
        // Log activity
        logAdminActivity(
          msg.caller,
          #UpdateModule,
          Nat.toText(moduleId),
          "Updated module: " # updatedModule.title
        );
        
        return #ok();
      };
    };
  };
  
  // Delete a module (admin only)
  public shared(msg) func deleteModule(moduleId: Types.ModuleId) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can delete modules");
    };
    
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?existingModule) {
        // Check if this module is a prerequisite for any other module
        for ((_, moduleItem) in modules.entries()) {
          for (prereqId in moduleItem.prerequisiteModules.vals()) {
            if (prereqId == moduleId) {
              return #err("Cannot delete: This module is a prerequisite for another module");
            };
          };
        };
        
        // Remove module
        modules.delete(moduleId);
        
        // Log activity
        logAdminActivity(
          msg.caller,
          #DeleteModule,
          Nat.toText(moduleId),
          "Deleted module: " # existingModule.title
        );
        
        return #ok();
      };
    };
  };
  
  // Add content to a module (admin only)
  public shared(msg) func addModuleContent(
    moduleId: Types.ModuleId,
    contentType: Types.ContentType,
    order: ?Nat
  ) : async Result.Result<Nat, Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can add module content");
    };
    
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?existingModule) {
        // Create new content block
        let contentId = existingModule.content.size();
        let contentOrder = Option.get(order, contentId); // Default to end of content array
        
        let newContentBlock : Types.ContentBlock = {
          id = contentId;
          contentType = contentType;
          order = contentOrder;
        };
        
        // Add content to module
        let contentBuffer = Buffer.Buffer<Types.ContentBlock>(existingModule.content.size() + 1);
        for (content in existingModule.content.vals()) {
          contentBuffer.add(content);
        };
        contentBuffer.add(newContentBlock);
        
        // Sort by order field
        let sortedContent = Array.sort(contentBuffer.toArray(), func (a: Types.ContentBlock, b: Types.ContentBlock) : {#less; #equal; #greater} {
          if (a.order < b.order) { #less }
          else if (a.order == b.order) { #equal }
          else { #greater }
        });
        
        // Update module
        let updatedModule : Types.Module = {
          id = existingModule.id;
          title = existingModule.title;
          description = existingModule.description;
          content = sortedContent;
          questions = existingModule.questions;
          tokenReward = existingModule.tokenReward;
          prerequisiteModules = existingModule.prerequisiteModules;
          createdAt = existingModule.createdAt;
          updatedAt = Time.now();
          createdBy = existingModule.createdBy;
        };
        
        modules.put(moduleId, updatedModule);
        
        // Log activity
        let contentTypeText = switch (contentType) {
          case (#Text(_)) { "text" };
          case (#Image(_)) { "image" };
          case (#Video(_)) { "video" };
          case (#Code(_)) { "code" };
        };
        
        logAdminActivity(
          msg.caller,
          #UpdateModule,
          Nat.toText(moduleId),
          "Added " # contentTypeText # " content to module"
        );
        
        return #ok(contentId);
      };
    };
  };
  
  // Remove content from a module (admin only)
  public shared(msg) func removeModuleContent(
    moduleId: Types.ModuleId,
    contentId: Nat
  ) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can remove module content");
    };
    
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?existingModule) {
        // Check if content exists
        var contentExists = false;
        for (content in existingModule.content.vals()) {
          if (content.id == contentId) {
            contentExists := true;
          };
        };
        
        if (not contentExists) {
          return #err("Content not found in module");
        };
        
        // Filter out the content block
        let contentBuffer = Buffer.Buffer<Types.ContentBlock>(0);
        for (content in existingModule.content.vals()) {
          if (content.id != contentId) {
            contentBuffer.add(content);
          };
        };
        
        // Update module
        let updatedModule : Types.Module = {
          id = existingModule.id;
          title = existingModule.title;
          description = existingModule.description;
          content = contentBuffer.toArray();
          questions = existingModule.questions;
          tokenReward = existingModule.tokenReward;
          prerequisiteModules = existingModule.prerequisiteModules;
          createdAt = existingModule.createdAt;
          updatedAt = Time.now();
          createdBy = existingModule.createdBy;
        };
        
        modules.put(moduleId, updatedModule);
        
        // Log activity
        logAdminActivity(
          msg.caller,
          #UpdateModule,
          Nat.toText(moduleId),
          "Removed content from module"
        );
        
        return #ok();
      };
    };
  };
  
  // Add a question to a module (admin only)
  public shared(msg) func addModuleQuestion(
    moduleId: Types.ModuleId,
    text: Text,
    options: [Types.QuestionOption],
    correctOptionId: Nat,
    explanation: Text
  ) : async Result.Result<Types.QuestionId, Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can add questions");
    };
    
    // Validate inputs
    if (Text.size(text) < 5) {
      return #err("Question text must be at least 5 characters");
    };
    
    if (options.size() < 2) {
      return #err("Question must have at least 2 options");
    };
    
    if (correctOptionId >= options.size()) {
      return #err("Correct option ID is out of range");
    };
    
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?existingModule) {
        // Create new question
        let questionId = nextQuestionId;
        nextQuestionId += 1;
        
        let newQuestion : Types.Question = {
          id = questionId;
          text = text;
          options = options;
          correctOptionId = correctOptionId;
          explanation = explanation;
        };
        
        // Add question to module
        let questionBuffer = Buffer.Buffer<Types.Question>(existingModule.questions.size() + 1);
        for (question in existingModule.questions.vals()) {
          questionBuffer.add(question);
        };
        questionBuffer.add(newQuestion);
        
        // Update module
        let updatedModule : Types.Module = {
          id = existingModule.id;
          title = existingModule.title;
          description = existingModule.description;
          content = existingModule.content;
          questions = questionBuffer.toArray();
          tokenReward = existingModule.tokenReward;
          prerequisiteModules = existingModule.prerequisiteModules;
          createdAt = existingModule.createdAt;
          updatedAt = Time.now();
          createdBy = existingModule.createdBy;
        };
        
        modules.put(moduleId, updatedModule);
        
        // Log activity
        logAdminActivity(
          msg.caller,
          #UpdateModule,
          Nat.toText(moduleId),
          "Added question to module"
        );
        
        return #ok(questionId);
      };
    };
  };
  
  // Remove a question from a module (admin only)
  public shared(msg) func removeModuleQuestion(
    moduleId: Types.ModuleId,
    questionId: Types.QuestionId
  ) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can remove questions");
    };
    
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?existingModule) {
        // Check if question exists
        var questionExists = false;
        for (question in existingModule.questions.vals()) {
          if (question.id == questionId) {
            questionExists := true;
          };
        };
        
        if (not questionExists) {
          return #err("Question not found in module");
        };
        
        // Filter out the question
        let questionBuffer = Buffer.Buffer<Types.Question>(0);
        for (question in existingModule.questions.vals()) {
          if (question.id != questionId) {
            questionBuffer.add(question);
          };
        };
        
        // Update module
        let updatedModule : Types.Module = {
          id = existingModule.id;
          title = existingModule.title;
          description = existingModule.description;
          content = existingModule.content;
          questions = questionBuffer.toArray();
          tokenReward = existingModule.tokenReward;
          prerequisiteModules = existingModule.prerequisiteModules;
          createdAt = existingModule.createdAt;
          updatedAt = Time.now();
          createdBy = existingModule.createdBy;
        };
        
        modules.put(moduleId, updatedModule);
        
        // Log activity
        logAdminActivity(
          msg.caller,
          #UpdateModule,
          Nat.toText(moduleId),
          "Removed question from module"
        );
        
        return #ok();
      };
    };
  };
  
  // Query Functions for Modules
  
  // Get all modules (public)
  public query func getAllModules() : async [Types.Module] {
    let moduleBuffer = Buffer.Buffer<Types.Module>(modules.size());
    for ((_, moduleItem) in modules.entries()) {
      moduleBuffer.add(moduleItem);
    };
    
    // Sort by ID
    return Array.sort(moduleBuffer.toArray(), func (a: Types.Module, b: Types.Module) : {#less; #equal; #greater} {
      if (a.id < b.id) { #less }
      else if (a.id == b.id) { #equal }
      else { #greater }
    });
  };
  
  // Get a specific module by ID (public)
  public query func getModule(moduleId: Types.ModuleId) : async ?Types.Module {
    modules.get(moduleId)
  };
  
  // Get module content (public)
  public query func getModuleContent(moduleId: Types.ModuleId) : async Result.Result<[Types.ContentBlock], Text> {
    switch (modules.get(moduleId)) {
      case (null) { #err("Module not found") };
      case (?moduleItem) { #ok(moduleItem.content) };
    };
  };
  
  // Get module questions (public)
  public query func getModuleQuestions(moduleId: Types.ModuleId) : async Result.Result<[Types.Question], Text> {
    switch (modules.get(moduleId)) {
      case (null) { #err("Module not found") };
      case (?moduleItem) { #ok(moduleItem.questions) };
    };
  };

  // User Authentication and Management System
  
  // Register a new user
  public shared(msg) func registerUser(username: Text) : async Result.Result<Types.UserProfile, Text> {
    // Check if user already exists
    switch (users.get(msg.caller)) {
      case (?existingUser) {
        return #err("User already registered");
      };
      case (null) {
        // Create new user profile
        let newUser : Types.UserProfile = {
          id = msg.caller;
          username = username;
          role = #User; // Default role is regular user
          createdAt = Time.now();
          totalTokens = 0;
        };
        
        users.put(msg.caller, newUser);
        
        // Initialize user progress
        let newProgress : Types.UserProgress = {
          userId = msg.caller;
          completedModules = [];
          moduleProgress = [];
          totalTokens = 0;
          lastActivity = Time.now();
        };
        
        userProgress.put(msg.caller, newProgress);
        
        return #ok(newUser);
      };
    };
  };
  
  // Get current user profile
  public query(msg) func getMyProfile() : async Result.Result<Types.UserProfile, Text> {
    switch (users.get(msg.caller)) {
      case (null) { 
        #err("User not registered") 
      };
      case (?profile) { 
        #ok(profile) 
      };
    };
  };
  
  // Update user profile (only username can be updated)
  public shared(msg) func updateProfile(username: Text) : async Result.Result<Types.UserProfile, Text> {
    switch (users.get(msg.caller)) {
      case (null) { 
        #err("User not registered") 
      };
      case (?profile) {
        let updatedProfile : Types.UserProfile = {
          id = profile.id;
          username = username;
          role = profile.role;
          createdAt = profile.createdAt;
          totalTokens = profile.totalTokens;
        };
        
        users.put(msg.caller, updatedProfile);
        return #ok(updatedProfile);
      };
    };
  };
  
  // Get a user's progress
  public query(msg) func getMyProgress() : async Result.Result<Types.UserProgress, Text> {
    switch (userProgress.get(msg.caller)) {
      case (null) { 
        #err("User progress not found") 
      };
      case (?progress) { 
        #ok(progress) 
      };
    };
  };
  
  // Check if a user has completed a prerequisite module
  private func hasCompletedPrerequisites(userId: Principal, moduleId: Types.ModuleId) : Bool {
    switch (modules.get(moduleId), userProgress.get(userId)) {
      case (?moduleItem, ?progress) {
        for (prereqId in moduleItem.prerequisiteModules.vals()) {
          let completed = Array.find<Types.ModuleId>(
            progress.completedModules, 
            func(id: Types.ModuleId) : Bool { id == prereqId }
          );
          
          if (Option.isNull(completed)) {
            return false;
          };
        };
        return true;
      };
      case (_, _) {
        return false;
      };
    };
  };
  
  // Start a module (mark as in progress)
  public shared(msg) func startModule(moduleId: Types.ModuleId) : async Result.Result<(), Text> {
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?moduleItem) {
        // Check if user exists
        switch (userProgress.get(msg.caller)) {
          case (null) {
            return #err("User not registered");
          };
          case (?progress) {
            // Check prerequisites
            if (not hasCompletedPrerequisites(msg.caller, moduleId)) {
              return #err("You must complete prerequisite modules first");
            };
            
            // Check if module is already in progress or completed
            let existingProgress = Array.find<Types.ModuleProgress>(
              progress.moduleProgress,
              func(mp: Types.ModuleProgress) : Bool { mp.moduleId == moduleId }
            );
            
            switch (existingProgress) {
              case (?mp) {
                if (mp.completed) {
                  return #err("Module already completed");
                };
                // Already in progress, do nothing
                return #ok();
              };
              case (null) {
                // Add new module progress
                let moduleProgress : Types.ModuleProgress = {
                  moduleId = moduleId;
                  completed = false;
                  startedAt = Time.now();
                  completedAt = null;
                  attempts = 0;
                  lastScore = null;
                };
                
                let progressBuffer = Buffer.Buffer<Types.ModuleProgress>(progress.moduleProgress.size() + 1);
                for (mp in progress.moduleProgress.vals()) {
                  progressBuffer.add(mp);
                };
                progressBuffer.add(moduleProgress);
                
                // Update user progress
                let updatedProgress : Types.UserProgress = {
                  userId = progress.userId;
                  completedModules = progress.completedModules;
                  moduleProgress = progressBuffer.toArray();
                  totalTokens = progress.totalTokens;
                  lastActivity = Time.now();
                };
                
                userProgress.put(msg.caller, updatedProgress);
                return #ok();
              };
            };
          };
        };
      };
    };
  };
  
  // Submit quiz answers and complete a module
  public shared(msg) func submitQuizAnswers(
    moduleId: Types.ModuleId,
    answers: [(Types.QuestionId, Nat)]
  ) : async Result.Result<Nat, Text> {
    // Check if module exists
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (?moduleItem) {
        // Check if user exists
        switch (userProgress.get(msg.caller)) {
          case (null) {
            return #err("User not registered");
          };
          case (?progress) {
            // Check prerequisites
            if (not hasCompletedPrerequisites(msg.caller, moduleId)) {
              return #err("You must complete prerequisite modules first");
            };
            
            // Find existing module progress or initialize it
            var moduleProgress = Array.find<Types.ModuleProgress>(
              progress.moduleProgress,
              func(mp: Types.ModuleProgress) : Bool { mp.moduleId == moduleId }
            );
            
            if (Option.isNull(moduleProgress)) {
              return #err("You must start the module before submitting answers");
            };
            
            // Get the unwrapped module progress
            let mp = Option.unwrap(moduleProgress);
            
            // Check if already completed
            if (mp.completed) {
              return #err("Module already completed");
            };
            
            // Validate and score answers
            let questions = moduleItem.questions;
            var correctAnswers = 0;
            
            // Create a map for the submitted answers for easy lookup
            let answersMap = HashMap.HashMap<Types.QuestionId, Nat>(
              answers.size(), 
              Nat.equal, 
              natHash
            );
            
            for ((qId, optionId) in answers.vals()) {
              answersMap.put(qId, optionId);
            };
            
            // Score each question
            for (question in questions.vals()) {
              switch (answersMap.get(question.id)) {
                case (?selectedOption) {
                  if (selectedOption == question.correctOptionId) {
                    correctAnswers += 1;
                  };
                };
                case (null) {
                  // No answer provided for this question
                };
              };
            };
            
            // Calculate score as a percentage
            let totalQuestions = questions.size();
            let score = if (totalQuestions == 0) { 0 } else { (correctAnswers * 100) / totalQuestions };
            
            // Record the quiz submission
            let submission : Types.QuizSubmission = {
              userId = msg.caller;
              moduleId = moduleId;
              answers = answers;
              score = score;
              maxScore = 100;
              submittedAt = Time.now();
              passed = score >= 70; // 70% or higher to pass
            };
            
            quizSubmissions.add(submission);
            
            // Update module progress
            let attempts = mp.attempts + 1;
            let passed = score >= 70;
            
            // Update progress trackers
            let progressBuffer = Buffer.Buffer<Types.ModuleProgress>(progress.moduleProgress.size());
            var updatedModuleProgress : Types.ModuleProgress = {
              moduleId = mp.moduleId;
              completed = passed;
              startedAt = mp.startedAt;
              completedAt = if (passed) { ?Time.now() } else { mp.completedAt };
              attempts = attempts;
              lastScore = ?score;
            };
            
            for (existingMp in progress.moduleProgress.vals()) {
              if (existingMp.moduleId == moduleId) {
                progressBuffer.add(updatedModuleProgress);
              } else {
                progressBuffer.add(existingMp);
              };
            };
            
            // Update completed modules list if passed
            var completedModules = progress.completedModules;
            var totalTokens = progress.totalTokens;
            
            if (passed) {
              // Check if this module is already in the completed list
              let alreadyCompleted = Array.find<Types.ModuleId>(
                completedModules,
                func(id: Types.ModuleId) : Bool { id == moduleId }
              );
              
              if (Option.isNull(alreadyCompleted)) {
                completedModules := Array.append(completedModules, [moduleId]);
                totalTokens += moduleItem.tokenReward;
                
                // Also update the user's total tokens
                switch (users.get(msg.caller)) {
                  case (?userProfile) {
                    let updatedUserProfile : Types.UserProfile = {
                      id = userProfile.id;
                      username = userProfile.username;
                      role = userProfile.role;
                      createdAt = userProfile.createdAt;
                      totalTokens = userProfile.totalTokens + moduleItem.tokenReward;
                    };
                    users.put(msg.caller, updatedUserProfile);
                  };
                  case (null) {};
                };
              };
            };
            
            // Update user progress
            let updatedProgress : Types.UserProgress = {
              userId = progress.userId;
              completedModules = completedModules;
              moduleProgress = progressBuffer.toArray();
              totalTokens = totalTokens;
              lastActivity = Time.now();
            };
            
            userProgress.put(msg.caller, updatedProgress);
            
            if (passed) {
              return #ok(moduleItem.tokenReward);
            } else {
              return #ok(0);
            };
          };
        };
      };
    };
  };
  
  // Get available modules for a user (filtered by prerequisites)
  public query(msg) func getAvailableModules() : async [Types.Module] {
    let allModules = Buffer.Buffer<Types.Module>(modules.size());
    
    switch (userProgress.get(msg.caller)) {
      case (?progress) {
        for ((_, moduleItem) in modules.entries()) {
          if (hasCompletedPrerequisites(msg.caller, moduleItem.id)) {
            allModules.add(moduleItem);
          };
        };
      };
      case (null) {
        // User not registered, only show modules with no prerequisites
        for ((_, moduleItem) in modules.entries()) {
          if (moduleItem.prerequisiteModules.size() == 0) {
            allModules.add(moduleItem);
          };
        };
      };
    };
    
    return allModules.toArray();
  };
  
  // Admin function to get user's progress (admin only)
  public query(msg) func getUserProgressByPrincipal(userId: Principal) : async Result.Result<Types.UserProgress, Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can view other users' progress");
    };
    
    switch (userProgress.get(userId)) {
      case (null) { 
        #err("User progress not found") 
      };
      case (?progress) { 
        #ok(progress) 
      };
    };
  };
  
  // Admin function to get all users (admin only)
  public query(msg) func getAllUsers() : async Result.Result<[Types.UserProfile], Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can view all users");
    };
    
    let userBuffer = Buffer.Buffer<Types.UserProfile>(users.size());
    for ((_, userProfile) in users.entries()) {
      userBuffer.add(userProfile);
    };
    
    return #ok(userBuffer.toArray());
  };
  
  // Progress Tracking System
  
  // Get summary statistics for all modules (admin only)
  public query(msg) func getModuleStatistics() : async Result.Result<[(Types.ModuleId, Nat, Nat, Nat)], Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can access statistics");
    };
    
    // Format: (ModuleId, UsersStarted, UsersCompleted, AverageScore)
    let statsMap = HashMap.HashMap<Types.ModuleId, (Nat, Nat, Nat, Nat)>(
      modules.size(), 
      Nat.equal, 
      natHash
    );
    
    // Initialize stats for all modules
    for ((moduleId, _) in modules.entries()) {
      statsMap.put(moduleId, (0, 0, 0, 0)); // (started, completed, totalScore, scoreCount)
    };
    
    // Process all user progress data
    for ((_, progress) in userProgress.entries()) {
      for (moduleProgress in progress.moduleProgress.vals()) {
        let moduleId = moduleProgress.moduleId;
        
        switch (statsMap.get(moduleId)) {
          case (?stats) {
            let (started, completed, totalScore, scoreCount) = stats;
            
            // User has started this module
            let newStarted = started + 1;
            
            // Check if user completed this module
            let newCompleted = if (moduleProgress.completed) { completed + 1 } else { completed };
            
            // Add score to total if available
            var newTotalScore = totalScore;
            var newScoreCount = scoreCount;
            
            switch (moduleProgress.lastScore) {
              case (?score) {
                newTotalScore += score;
                newScoreCount += 1;
              };
              case (null) {};
            };
            
            statsMap.put(moduleId, (newStarted, newCompleted, newTotalScore, newScoreCount));
          };
          case (null) {
            // This shouldn't happen since we initialized all modules
          };
        };
      };
    };
    
    // Convert to result array with average scores
    let result = Buffer.Buffer<(Types.ModuleId, Nat, Nat, Nat)>(modules.size());
    
    for ((moduleId, stats) in statsMap.entries()) {
      let (started, completed, totalScore, scoreCount) = stats;
      let avgScore = if (scoreCount == 0) { 0 } else { totalScore / scoreCount };
      result.add((moduleId, started, completed, avgScore));
    };
    
    return #ok(result.toArray());
  };
  
  // Get recent quiz submissions (admin only)
  public query(msg) func getRecentSubmissions(limit: Nat) : async Result.Result<[Types.QuizSubmission], Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can view submission details");
    };
    
    let size = quizSubmissions.size();
    let actualLimit = if (size < limit) { size } else { limit };
    let startIndex = size - actualLimit;
    
    let result = Buffer.Buffer<Types.QuizSubmission>(actualLimit);
    var i = startIndex;
    
    while (i < size) {
      result.add(quizSubmissions.get(i));
      i += 1;
    };
    
    return #ok(result.toArray());
  };
  
  // Get detailed progress for a specific module (admin only)
  public query(msg) func getModuleProgressDetails(
    moduleId: Types.ModuleId
  ) : async Result.Result<[(Principal, Types.ModuleProgress)], Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can view detailed progress");
    };
    
    let result = Buffer.Buffer<(Principal, Types.ModuleProgress)>(0);
    
    for ((userId, progress) in userProgress.entries()) {
      for (moduleProgress in progress.moduleProgress.vals()) {
        if (moduleProgress.moduleId == moduleId) {
          result.add((userId, moduleProgress));
        };
      };
    };
    
    return #ok(result.toArray());
  };
  
  // Get user leaderboard by tokens earned
  public query func getLeaderboard(limit: Nat) : async [(Text, Nat)] {
    let userArray = Buffer.Buffer<(Text, Nat)>(users.size());
    
    for ((_, profile) in users.entries()) {
      userArray.add((profile.username, profile.totalTokens));
    };
    
    // Sort by tokens (descending)
    let sorted = Array.sort(
      userArray.toArray(),
      func ((_, tokensA): (Text, Nat), (_, tokensB): (Text, Nat)) : {#less; #equal; #greater} {
        if (tokensA > tokensB) { #less }  // Descending order
        else if (tokensA == tokensB) { #equal }
        else { #greater }
      }
    );
    
    // Apply limit
    let actualLimit = if (sorted.size() < limit) { sorted.size() } else { limit };
    let result = Buffer.Buffer<(Text, Nat)>(actualLimit);
    
    var i = 0;
    while (i < actualLimit) {
      result.add(sorted[i]);
      i += 1;
    };
    
    return result.toArray();
  };
  
  // Get user completion statistics
  public query func getUserCompletionStats() : async Result.Result<(Nat, Nat, Nat), Text> {
    // Returns (totalUsers, activeUsers, completedAnyModule)
    var totalUsers = users.size();
    var activeUsers = 0;
    var usersCompletedAny = 0;
    
    let now = Time.now();
    let oneWeekNanos : Int = 7 * 24 * 60 * 60 * 1_000_000_000;
    
    for ((_, progress) in userProgress.entries()) {
      // Count active users (active in the last week)
      if (now - progress.lastActivity < oneWeekNanos) {
        activeUsers += 1;
      };
      
      // Count users who have completed at least one module
      if (progress.completedModules.size() > 0) {
        usersCompletedAny += 1;
      };
    };
    
    return #ok((totalUsers, activeUsers, usersCompletedAny));
  };
  
  // Reset a user's progress for a specific module (admin only)
  public shared(msg) func resetUserModuleProgress(
    userId: Principal,
    moduleId: Types.ModuleId
  ) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can reset user progress");
    };
    
    switch (userProgress.get(userId)) {
      case (null) {
        return #err("User progress not found");
      };
      case (?progress) {
        // Remove from completed modules if present
        let completedModules = Array.filter<Types.ModuleId>(
          progress.completedModules,
          func(id: Types.ModuleId) : Bool { id != moduleId }
        );
        
        // Remove or reset module progress
        let moduleProgress = Buffer.Buffer<Types.ModuleProgress>(0);
        for (mp in progress.moduleProgress.vals()) {
          if (mp.moduleId != moduleId) {
            moduleProgress.add(mp);
          };
        };
        
        // Calculate token adjustment if needed
        var tokenAdjustment : Nat = 0;
        switch (modules.get(moduleId)) {
          case (?moduleItem) {
            // Check if module was previously completed to adjust tokens
            let wasCompleted = Array.find<Types.ModuleId>(
              progress.completedModules,
              func(id: Types.ModuleId) : Bool { id == moduleId }
            );
            
            if (Option.isSome(wasCompleted)) {
              tokenAdjustment := moduleItem.tokenReward;
            };
          };
          case (null) {
            return #err("Module not found");
          };
        };
        
        // Update progress
        let updatedProgress : Types.UserProgress = {
          userId = progress.userId;
          completedModules = completedModules;
          moduleProgress = moduleProgress.toArray();
          totalTokens = if (progress.totalTokens >= tokenAdjustment) { 
            progress.totalTokens - tokenAdjustment 
          } else { 
            0 
          };
          lastActivity = Time.now();
        };
        
        userProgress.put(userId, updatedProgress);
        
        // Update user profile tokens if needed
        if (tokenAdjustment > 0) {
          switch (users.get(userId)) {
            case (?userProfile) {
              let updatedUserProfile : Types.UserProfile = {
                id = userProfile.id;
                username = userProfile.username;
                role = userProfile.role;
                createdAt = userProfile.createdAt;
                totalTokens = if (userProfile.totalTokens >= tokenAdjustment) {
                  userProfile.totalTokens - tokenAdjustment
                } else {
                  0
                };
              };
              users.put(userId, updatedUserProfile);
            };
            case (null) {};
          };
        };
        
        // Log activity
        logAdminActivity(
          msg.caller,
          #Other("ResetModuleProgress"),
          Principal.toText(userId) # "/" # Nat.toText(moduleId),
          "Reset user progress for module"
        );
        
        return #ok();
      };
    };
  };
  
  // Get my detailed learning progress
  public query(msg) func getMyDetailedProgress() : async Result.Result<Types.UserProgress, Text> {
    switch (userProgress.get(msg.caller)) {
      case (null) {
        return #err("User progress not found");
      };
      case (?progress) {
        return #ok(progress);
      };
    };
  };
  
  // Get completion percentage for a specific module
  public query func getModuleCompletionRate(moduleId: Types.ModuleId) : async Result.Result<(Nat, Nat), Text> {
    // Returns (completedCount, startedCount)
    switch (modules.get(moduleId)) {
      case (null) {
        return #err("Module not found");
      };
      case (_) {
        var startedCount = 0;
        var completedCount = 0;
        
        for ((_, progress) in userProgress.entries()) {
          // Check if in completed modules
          let completed = Array.find<Types.ModuleId>(
            progress.completedModules,
            func(id: Types.ModuleId) : Bool { id == moduleId }
          );
          
          if (Option.isSome(completed)) {
            completedCount += 1;
            startedCount += 1; // Completed implies started
          } else {
            // Check if in module progress
            let started = Array.find<Types.ModuleProgress>(
              progress.moduleProgress,
              func(mp: Types.ModuleProgress) : Bool { mp.moduleId == moduleId }
            );
            
            if (Option.isSome(started)) {
              startedCount += 1;
            };
          };
        };
        
        return #ok((completedCount, startedCount));
      };
    };
  };

  // Token Reward System
  
  // Structure to track token transactions
  private type TokenTransaction = {
    userId: Principal;
    amount: Int; // Positive for earned, negative for spent
    description: Text;
    timestamp: Int;
    relatedModuleId: ?Types.ModuleId;
  };
  
  private let tokenTransactions = Buffer.Buffer<TokenTransaction>(0);
  
  // Award bonus tokens to a user (admin only)
  public shared(msg) func awardBonusTokens(
    userId: Principal,
    amount: Nat,
    reason: Text
  ) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can award bonus tokens");
    };
    
    // Check if user exists
    switch (users.get(userId)) {
      case (null) {
        return #err("User not found");
      };
      case (?userProfile) {
        // Update user profile tokens
        let updatedProfile : Types.UserProfile = {
          id = userProfile.id;
          username = userProfile.username;
          role = userProfile.role;
          createdAt = userProfile.createdAt;
          totalTokens = userProfile.totalTokens + amount;
        };
        
        users.put(userId, updatedProfile);
        
        // Update user progress tokens
        switch (userProgress.get(userId)) {
          case (null) {};
          case (?progress) {
            let updatedProgress : Types.UserProgress = {
              userId = progress.userId;
              completedModules = progress.completedModules;
              moduleProgress = progress.moduleProgress;
              totalTokens = progress.totalTokens + amount;
              lastActivity = Time.now();
            };
            
            userProgress.put(userId, updatedProgress);
          };
        };
        
        // Record the transaction
        let transaction : TokenTransaction = {
          userId = userId;
          amount = amount; // Cast to Int
          description = "Bonus: " # reason;
          timestamp = Time.now();
          relatedModuleId = null;
        };
        
        tokenTransactions.add(transaction);
        
        // Log admin activity
        logAdminActivity(
          msg.caller,
          #Other("AwardBonusTokens"),
          Principal.toText(userId),
          "Awarded " # Nat.toText(amount) # " bonus tokens: " # reason
        );
        
        return #ok();
      };
    };
  };
  
  // Get a user's token transaction history (self or admin)
  public query(msg) func getTokenTransactionHistory(
    userId: ?Principal,
    limit: Nat
  ) : async Result.Result<[(Int, Int, Text)], Text> {
    let targetUser = Option.get(userId, msg.caller);
    
    // Authorization check - users can only see their own history unless they're an admin
    if (not Principal.equal(msg.caller, targetUser) and not isAdmin(msg.caller)) {
      return #err("Unauthorized: You can only view your own transaction history");
    };
    
    // Check if user exists
    switch (users.get(targetUser)) {
      case (null) {
        return #err("User not found");
      };
      case (_) {
        // Filter transactions for this user
        let userTransactions = Buffer.Buffer<TokenTransaction>(0);
        
        for (tx in tokenTransactions.vals()) {
          if (Principal.equal(tx.userId, targetUser)) {
            userTransactions.add(tx);
          };
        };
        
        // Sort by timestamp (newest first) and apply limit
        let sorted = Array.sort(
          userTransactions.toArray(),
          func(a: TokenTransaction, b: TokenTransaction) : {#less; #equal; #greater} {
            if (a.timestamp > b.timestamp) { #less }  // Descending order
            else if (a.timestamp == b.timestamp) { #equal }
            else { #greater }
          }
        );
        
        let actualLimit = if (sorted.size() < limit) { sorted.size() } else { limit };
        let result = Buffer.Buffer<(Int, Int, Text)>(actualLimit);
        
        var i = 0;
        while (i < actualLimit) {
          let tx = sorted[i];
          result.add((tx.timestamp, tx.amount, tx.description));
          i += 1;
        };
        
        return #ok(result.toArray());
      };
    };
  };
  
  // Get total token distribution stats (admin only)
  public query(msg) func getTokenDistributionStats() : async Result.Result<(Nat, Nat, Nat), Text> {
    // Returns (totalTokensAwarded, totalUsers, averageTokensPerUser)
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can view token statistics");
    };
    
    var totalTokens : Nat = 0;
    let totalUsersWithTokens = Buffer.Buffer<Principal>(0);
    
    for ((userId, profile) in users.entries()) {
      if (profile.totalTokens > 0) {
        totalTokens += profile.totalTokens;
        totalUsersWithTokens.add(userId);
      };
    };
    
    let numUsers = totalUsersWithTokens.size();
    let averageTokens = if (numUsers == 0) { 0 } else { totalTokens / numUsers };
    
    return #ok((totalTokens, numUsers, averageTokens));
  };
  
  // Special reward for completing all modules
  private func checkAndAwardCompletionBonus(userId: Principal) : async () {
    // Check if user has completed all modules
    let allModules = Buffer.Buffer<Types.ModuleId>(modules.size());
    for ((moduleId, _) in modules.entries()) {
      allModules.add(moduleId);
    };
    
    if (allModules.size() == 0) {
      return; // No modules available yet
    };
    
    switch (userProgress.get(userId)) {
      case (null) { return };
      case (?progress) {
        // Check if user has completed each module
        let allCompleted = Array.foldLeft<Types.ModuleId, Bool>(
          allModules.toArray(),
          true,
          func (acc: Bool, moduleId: Types.ModuleId) : Bool {
            if (not acc) { return false };
            
            let completed = Array.find<Types.ModuleId>(
              progress.completedModules,
              func(id: Types.ModuleId) : Bool { id == moduleId }
            );
            
            Option.isSome(completed)
          }
        );
        
        if (allCompleted) {
          // Check if bonus has already been awarded
          let bonusAwarded = Array.find<TokenTransaction>(
            tokenTransactions.toArray(),
            func(tx: TokenTransaction) : Bool {
              Principal.equal(tx.userId, userId) and tx.description == "Bonus: Completed all modules"
            }
          );
          
          if (Option.isNull(bonusAwarded)) {
            // Award completion bonus (500 tokens)
            let bonusAmount : Nat = 500;
            
            // Update user profile tokens
            switch (users.get(userId)) {
              case (?userProfile) {
                let updatedProfile : Types.UserProfile = {
                  id = userProfile.id;
                  username = userProfile.username;
                  role = userProfile.role;
                  createdAt = userProfile.createdAt;
                  totalTokens = userProfile.totalTokens + bonusAmount;
                };
                
                users.put(userId, updatedProfile);
              };
              case (null) {};
            };
            
            // Update user progress tokens
            let updatedProgress : Types.UserProgress = {
              userId = progress.userId;
              completedModules = progress.completedModules;
              moduleProgress = progress.moduleProgress;
              totalTokens = progress.totalTokens + bonusAmount;
              lastActivity = Time.now();
            };
            
            userProgress.put(userId, updatedProgress);
            
            // Record the transaction
            let transaction : TokenTransaction = {
              userId = userId;
              amount = bonusAmount;
              description = "Bonus: Completed all modules";
              timestamp = Time.now();
              relatedModuleId = null;
            };
            
            tokenTransactions.add(transaction);
          };
        };
      };
    };
  };
  
  // Add token reward for a specific achievement (admin only)
  public shared(msg) func addAchievementReward(
    achievementName: Text,
    tokenAmount: Nat
  ) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can add achievement rewards");
    };
    
    // In a more complex system, this would store the achievement in a stable data structure
    // For now, we'll just return success
    
    // Log admin activity
    logAdminActivity(
      msg.caller,
      #Other("AddAchievementReward"),
      achievementName,
      "Added achievement reward: " # Nat.toText(tokenAmount) # " tokens"
    );
    
    return #ok();
  };
  
  // Grant an achievement reward to a user (admin only)
  public shared(msg) func grantAchievementReward(
    userId: Principal,
    achievementName: Text,
    tokenAmount: Nat
  ) : async Result.Result<(), Text> {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized: Only admins can grant achievement rewards");
    };
    
    // Check if user exists
    switch (users.get(userId)) {
      case (null) {
        return #err("User not found");
      };
      case (?userProfile) {
        // Update user profile tokens
        let updatedProfile : Types.UserProfile = {
          id = userProfile.id;
          username = userProfile.username;
          role = userProfile.role;
          createdAt = userProfile.createdAt;
          totalTokens = userProfile.totalTokens + tokenAmount;
        };
        
        users.put(userId, updatedProfile);
        
        // Update user progress tokens
        switch (userProgress.get(userId)) {
          case (null) {};
          case (?progress) {
            let updatedProgress : Types.UserProgress = {
              userId = progress.userId;
              completedModules = progress.completedModules;
              moduleProgress = progress.moduleProgress;
              totalTokens = progress.totalTokens + tokenAmount;
              lastActivity = Time.now();
            };
            
            userProgress.put(userId, updatedProgress);
          };
        };
        
        // Record the transaction
        let transaction : TokenTransaction = {
          userId = userId;
          amount = tokenAmount;
          description = "Achievement: " # achievementName;
          timestamp = Time.now();
          relatedModuleId = null;
        };
        
        tokenTransactions.add(transaction);
        
        // Log admin activity
        logAdminActivity(
          msg.caller,
          #Other("GrantAchievementReward"),
          Principal.toText(userId),
          "Granted achievement '" # achievementName # "' with " # Nat.toText(tokenAmount) # " tokens"
        );
        
        return #ok();
      };
    };
  };
  
  // Get my token balance
  public query(msg) func getMyTokenBalance() : async Result.Result<Nat, Text> {
    switch (users.get(msg.caller)) {
      case (null) {
        return #err("User not registered");
      };
      case (?userProfile) {
        return #ok(userProfile.totalTokens);
      };
    };
  };
  
  // Public API - will be expanded in subsequent tasks
  public shared(msg) func whoami() : async Principal {
    return msg.caller;
  };
  
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "! Welcome to ICP Studio!";
  };

  // Check if a specific user is an admin (accessible from frontend)
  public query func isUserAdmin(userId : Principal) : async Bool {
    switch (users.get(userId)) {
      case (null) { false };
      case (?userProfile) {
        switch (userProfile.role) {
          case (#Admin) { true };
          case (_) { false };
        };
      };
    };
  };
};
