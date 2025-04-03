# ICP Studio Admin Guide

This guide provides comprehensive documentation for administrators of the ICP Studio platform. As an admin, you have access to powerful tools for managing learning modules, users, and system settings.

## Table of Contents

1. [Admin Access](#admin-access)
2. [Admin Dashboard Overview](#admin-dashboard-overview)
3. [Module Management](#module-management)
4. [User Management](#user-management)
5. [Admin Management](#admin-management)
6. [Performance Monitoring](#performance-monitoring)
7. [Troubleshooting](#troubleshooting)

## Admin Access

### Becoming an Admin

Admin access is controlled via ICP principal IDs. Only designated principals can access admin functionality.

- **Default Admin**: During initial deployment, the principal specified in the deployment configuration is set as the default admin.
- **Additional Admins**: Existing admins can add new admin users through the Admin Management interface.

### Logging In

1. Navigate to the ICP Studio login page
2. Authenticate using Internet Identity
3. If your principal is registered as an admin, you'll automatically see the admin dashboard options in the navigation menu

## Admin Dashboard Overview

The admin dashboard provides a central hub for monitoring and managing the ICP Studio platform.

### Key Metrics

- **Active Users**: Number of users currently active on the platform
- **Module Completions**: Total module completions across all users
- **Token Distribution**: Total tokens awarded to users
- **System Health**: Current status of backend canister (cycles, memory usage)

### Navigation

The admin dashboard includes navigation to:
- Module Management
- User Management
- Admin Management
- Platform Settings
- Activity Log

## Module Management

### Creating a Module

1. Navigate to **Modules** → **Create New Module**
2. Fill in the required fields:
   - **Title**: A concise, descriptive title
   - **Description**: An overview of what users will learn
   - **Prerequisites**: Select any modules that should be completed first
   - **Token Reward**: Number of tokens awarded upon completion

3. Click **Save Draft** to save without publishing, or **Publish** to make it available to users

### Adding Content to Modules

1. Open the module you want to edit
2. Click **Add Content**
3. Choose the content type:
   - **Text**: Rich text content with formatting
   - **Image**: Upload an image with caption
   - **Video**: Embed a video with description
   - **Code**: Code examples with syntax highlighting

4. Arrange content blocks by dragging them into position
5. Click **Save Changes**

### Creating Quizzes

1. Navigate to the **Quizzes** tab within a module
2. Click **Add Question**
3. Choose question type (multiple choice, true/false)
4. Enter the question text and answer options
5. Mark the correct answer(s)
6. Set the question weight (points value)
7. Click **Add Question** to add more or **Save Quiz** when finished

### Editing and Deleting Modules

- **Edit**: Click the Edit button on any module card or from the module detail page
- **Deactivate**: To temporarily hide a module from users, toggle the Active status
- **Delete**: Use the Delete option to permanently remove a module (this will affect user progress data)

## User Management

### Viewing User Information

1. Navigate to **Users** in the admin dashboard
2. Use filters to search by username, completion status, or registration date
3. Click on a user to view their detailed profile

### User Profile Details

- **Account Information**: Username, registration date, principal ID
- **Progress**: Completed modules and current progress
- **Token Balance**: Total tokens earned and transaction history
- **Activity Log**: Recent actions taken by the user

### Managing User Progress

Admins can manually adjust user progress if needed:
1. Open the user's profile
2. Navigate to the Progress tab
3. Use the **Reset Progress** option to clear a specific module's progress
4. Use **Grant Completion** to manually mark a module as completed

## Admin Management

### Adding New Admins

1. Navigate to **Admin** → **Manage Admins**
2. Click **Add New Admin**
3. Enter the principal ID of the user you want to make an admin
4. Optionally add a name/note for reference
5. Click **Add Admin**

### Viewing Admin Activity

The admin activity log tracks all actions performed by admins:
1. Navigate to **Admin** → **Activity Log**
2. View a chronological list of admin actions
3. Filter by admin name, action type, or date range

### Removing Admin Access

1. Navigate to **Admin** → **Manage Admins**
2. Find the admin you want to remove
3. Click the **Remove** button
4. Confirm the removal

## Performance Monitoring

### Canister Metrics

1. Navigate to **System** → **Performance**
2. View key metrics:
   - Cycles consumption rate
   - Memory usage
   - Query call response times
   - Update call response times

### User Analytics

1. Navigate to **Analytics** → **User Engagement**
2. View data on:
   - Daily/monthly active users
   - Average session duration
   - Most popular modules
   - Completion rates

## Troubleshooting

### Common Issues and Solutions

#### Module Not Displaying for Users
- Check that the module is marked as Active
- Verify that prerequisites are correctly set
- Check for permission issues

#### User Cannot Complete Module
- Verify that quiz questions have correct answers marked
- Check if minimum quiz score requirement is set too high
- Ensure module content is fully accessible

#### Token Rewards Not Being Issued
- Check token reward value is set for the module
- Verify the backend canister has sufficient cycles
- Look for errors in the admin activity log

### Getting Support

If you encounter issues not covered in this guide:
1. Check the system status in the admin dashboard
2. Review the error logs under **System** → **Logs**
3. Contact the development team through the support channel

---

## Best Practices

### Module Design
- Keep modules focused on specific learning outcomes
- Use a variety of content types (text, images, code examples)
- Ensure quiz questions reinforce key concepts
- Provide clear feedback for incorrect answers

### User Management
- Respect user privacy and data protection regulations
- Use the activity log to identify and address user issues quickly
- Regularly review user feedback for improvement opportunities

### System Maintenance
- Monitor cycles consumption regularly
- Schedule updates during low-traffic periods
- Maintain regular backups of critical data
- Test new modules thoroughly before publishing 