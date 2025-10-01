# Tests Directory

This directory contains all test files and test data for the application.

## Structure

```
tests/
├── credentials/                    # Credential management system tests
│   ├── test-credential-core.js    # Core credential system tests
│   ├── test-credentials.js        # Basic credential tests
│   ├── test-simple-credentials.js # Simple credential manager tests
│   └── test-data/                 # Test data directory
│       ├── credentials-metadata.json
│       └── sensitive/             # Encrypted test credentials
└── README.md                      # This file
```

## Running Tests

### Credential System Tests

```bash
# Run core credential system tests
node tests/credentials/test-credential-core.js

# Run simple credential manager tests
node tests/credentials/test-simple-credentials.js

# Run basic credential tests
node tests/credentials/test-credentials.js
```

## Test Data

The `test-data` directory contains:
- **credentials-metadata.json**: Non-sensitive credential metadata for testing
- **sensitive/**: Directory for encrypted credential files during testing

**Note**: Test data is automatically created and cleaned up by the test scripts. The test-data directory structure mirrors the production credential storage layout.

## Test Coverage

The credential tests cover:
- ✅ Core credential storage and encryption
- ✅ Multiple credential types (ArgoCD, Git, Helm, Vault)
- ✅ Secure sensitive data handling
- ✅ Credential retrieval and decryption
- ✅ Credential listing and filtering
- ✅ Credential deletion and cleanup
- ✅ File-based storage with proper permissions
- ✅ Environment-based organization
- ✅ Multiple authentication methods
- ✅ Error handling and validation

## Adding New Tests

When adding new tests:
1. Create test files in the appropriate subdirectory
2. Follow the naming convention: `test-[feature].js`
3. Include comprehensive error handling
4. Clean up test data after completion
5. Update this README with new test information