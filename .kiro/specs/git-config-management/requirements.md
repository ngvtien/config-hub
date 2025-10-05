# Requirements Document

## Introduction

This feature extends Config Hub's existing ArgoCD application viewing capabilities to enable self-service configuration management. Config Hub currently displays ArgoCD applications, their Git sources, sync status, health, logs, events, and Helm parameters. This feature adds the ability to edit configuration files and propose changes through a Git-based Pull Request workflow.

The feature builds on Config Hub's existing infrastructure:
- **Existing**: ArgoCD API integration, credential management, application detail views, Git source display
- **New**: Git repository file access, in-browser editing, Pull Request creation, and merge workflow

Users will be able to view configuration files from the Git repositories already displayed in ArgoCD applications, edit them with validation, and create Pull Requests using their own Git credentials. All changes flow through Pull Requests, maintaining GitOps principles while providing a user-friendly interface.

## Requirements

### Requirement 1: Configuration File Viewing

**User Story:** As a support engineer, I want to view the current configuration files for any ArgoCD application from the existing application detail page, so that I can understand the deployed state and identify what needs to be changed.

#### Acceptance Criteria

1. WHEN viewing an ArgoCD application detail page THEN the system SHALL add a new "Configuration Files" section below the existing Git source information
2. WHEN displaying the Configuration Files section THEN the system SHALL use the repository URL and path already shown in the application's Git source
3. WHEN fetching files THEN the system SHALL only access files within the path specified in the application's spec.source.path or spec.sources[].path
4. WHEN displaying configuration files THEN the system SHALL show Helm values.yaml, secrets files, and other YAML/JSON files from the configured path
5. WHEN a configuration file is displayed THEN the system SHALL show the file path relative to the application's path, current content, and last commit information
6. WHEN the Git repository is unavailable THEN the system SHALL display an appropriate error message and allow retry
7. WHEN a user has not provided Git credentials THEN the system SHALL display a prompt to authenticate before showing files

### Requirement 2: Configuration File Editing

**User Story:** As a DevOps engineer, I want to edit configuration values directly in the Config Hub UI using the same credential management pattern as ArgoCD, so that I can make changes without using Git command-line tools.

#### Acceptance Criteria

1. WHEN a user has Git credentials stored THEN the system SHALL provide an edit button for each configuration file
2. WHEN a user clicks edit THEN the system SHALL open a modal dialog with an editor (reusing existing UI patterns from Config Hub)
3. WHEN displaying the editor THEN the system SHALL provide syntax highlighting appropriate to the file type (YAML, JSON, etc.)
4. WHEN editing a YAML file AND a corresponding .schema.json file exists (e.g., values.yaml with values.schema.json) THEN the system SHALL provide a toggle to switch between YAML editor and form-based editor
5. WHEN using the form-based editor THEN the system SHALL generate form fields based on the JSON schema with appropriate input types, validation, and descriptions
6. WHEN switching between YAML and form views THEN the system SHALL preserve changes and synchronize values between both views
7. WHEN editing YAML files THEN the system SHALL validate YAML syntax in real-time and display errors
8. WHEN editing with a schema THEN the system SHALL validate against the schema and display validation errors
9. WHEN a user makes changes THEN the system SHALL show a side-by-side diff preview before submission
10. WHEN a user lacks Git credentials THEN the system SHALL hide edit buttons and show a message to authenticate

### Requirement 3: Pull Request Creation

**User Story:** As a support engineer, I want my configuration changes to create a Pull Request under my identity instead of direct commits, so that changes can be reviewed before deployment and properly attributed to me.

#### Acceptance Criteria

1. WHEN a user submits configuration changes THEN the system SHALL create a new Git branch with a descriptive name using the user's Git credentials
2. WHEN creating a branch THEN the system SHALL commit the changes with a meaningful commit message attributed to the authenticated user
3. WHEN changes are committed THEN the system SHALL create a Pull Request in the Git server with the user as the author
4. WHEN creating a PR THEN the system SHALL include a description with change summary and affected applications
5. WHEN a PR is created THEN the system SHALL provide a link to view the PR in the Git server
6. WHEN viewing the PR in Git THEN the branch, commits, and PR SHALL show the actual user's identity as the author
7. WHEN a PR is created AND webhook notifications are configured THEN the system SHALL send notifications to configured channels (MS Teams, Slack, etc.)
8. WHEN sending webhook notifications THEN the system SHALL include PR details, author, affected applications, and a link to the PR
9. IF webhook notification fails THEN the system SHALL log the error but still complete the PR creation successfully
10. IF branch creation fails THEN the system SHALL display an error and allow the user to retry with a different branch name
11. IF the user lacks Git repository write permissions THEN the system SHALL display an error indicating insufficient permissions

### Requirement 4: Pull Request Review Workflow

**User Story:** As a team lead, I want to review and approve configuration changes through Pull Requests, so that I can ensure changes are correct before they affect production systems.

#### Acceptance Criteria

1. WHEN a PR is created THEN the system SHALL notify designated reviewers through the Git server's notification system
2. WHEN viewing a PR in Config Hub THEN the system SHALL display the PR status, reviewers, and approval state
3. WHEN a PR has required approvals THEN the system SHALL allow authorized users to merge it
4. WHEN a PR is merged THEN the system SHALL trigger ArgoCD to sync the affected applications
5. IF a PR has conflicts THEN the system SHALL display the conflicts and provide guidance for resolution

### Requirement 5: Git Repository Integration

**User Story:** As a system administrator, I want Config Hub to integrate with our Bitbucket server using individual user credentials, so that all configuration changes are tracked in our existing Git infrastructure with proper user attribution.

#### Acceptance Criteria

1. WHEN configuring Git integration THEN the system SHALL support Bitbucket Server API authentication using user-specific credentials
2. WHEN a user first accesses Git features THEN the system SHALL prompt them to provide their personal access token or complete OAuth authentication
3. WHEN a user successfully authenticates THEN the system SHALL securely store their credentials (encrypted) for subsequent operations
4. WHEN a user returns to Config Hub THEN the system SHALL use their stored credentials without requiring re-authentication
5. WHEN performing Git operations THEN the system SHALL use the authenticated user's stored credentials to ensure proper attribution
6. WHEN accessing repositories THEN the system SHALL use the repository URLs from ArgoCD application definitions
7. WHEN performing Git operations THEN the system SHALL handle authentication errors gracefully
8. WHEN a user's credentials expire or are revoked THEN the system SHALL detect the failure and prompt for re-authentication
9. IF repository access is denied THEN the system SHALL display clear error messages indicating whether it's an authentication or authorization issue
10. WHEN storing credentials THEN the system SHALL encrypt them at rest and in transit

### Requirement 6: Change Tracking and Audit

**User Story:** As a compliance officer, I want to track all configuration changes with full audit trails, so that we can meet regulatory requirements and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a configuration change is made THEN the system SHALL record the user, timestamp, and change description
2. WHEN viewing an application THEN the system SHALL display a history of configuration changes
3. WHEN viewing change history THEN the system SHALL show who made each change, when, and what was changed
4. WHEN a change is deployed THEN the system SHALL link the Git commit to the ArgoCD sync event
5. WHEN generating audit reports THEN the system SHALL export change history in standard formats

### Requirement 7: Multi-Repository Support

**User Story:** As a platform engineer, I want Config Hub to work with multiple Git repositories, so that I can manage configurations across our entire infrastructure.

#### Acceptance Criteria

1. WHEN ArgoCD applications reference different repositories THEN the system SHALL handle each repository independently
2. WHEN authenticating THEN the system SHALL support different credentials per repository
3. WHEN creating PRs THEN the system SHALL create them in the correct repository for each application
4. WHEN displaying applications THEN the system SHALL clearly indicate which repository each uses
5. IF a repository is unavailable THEN the system SHALL continue to work with other repositories

### Requirement 8: Permissions and Access Control

**User Story:** As a security administrator, I want to control who can view and edit configurations with path-level restrictions, so that we maintain proper separation of duties and prevent unauthorized access to other repository contents.

#### Acceptance Criteria

1. WHEN a user accesses Config Hub THEN the system SHALL authenticate them against the configured identity provider
2. WHEN determining permissions THEN the system SHALL check both Config Hub roles and Git repository permissions
3. WHEN displaying files for an ArgoCD application THEN the system SHALL only show files within the path specified in the application's Git source configuration
4. WHEN a user attempts to access files outside the application's configured path THEN the system SHALL deny access even if they have repository-level permissions
5. WHEN editing files THEN the system SHALL only allow modifications to files within the application's configured Git source path
6. WHEN creating a PR THEN the system SHALL only include changes to files within the application's configured path
7. WHEN a user lacks edit permissions THEN the system SHALL hide edit buttons and prevent modification attempts
8. WHEN a user attempts unauthorized actions THEN the system SHALL display an appropriate error message
9. IF permissions change THEN the system SHALL reflect the new permissions without requiring logout

### Requirement 9: ArgoCD Sync Integration

**User Story:** As a DevOps engineer, I want ArgoCD to automatically sync after my PR is merged using the existing sync functionality, so that changes are deployed without manual intervention.

#### Acceptance Criteria

1. WHEN a PR is merged THEN the system SHALL detect the merge event through webhooks or polling
2. WHEN a merge is detected THEN the system SHALL identify affected ArgoCD applications by matching repository URLs and paths
3. WHEN applications are identified THEN the system SHALL use the existing argoCDService.syncApplication() method to trigger sync
4. WHEN sync is triggered THEN the system SHALL reuse the existing sync status display in the application detail page
5. WHEN viewing the application after a merge THEN the system SHALL show the updated Git commit SHA in the existing Git source section
6. IF sync fails THEN the system SHALL display error details using existing error handling patterns
