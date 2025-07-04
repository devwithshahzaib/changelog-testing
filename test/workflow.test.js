/**
 * Unit tests for changelog workflow functionality
 * Tests the core logic that would be used in the GitHub Actions workflow
 */

const fs = require('fs');

// Mock data for testing
const MOCK_PACKAGE_JSON = {
  name: 'test-package',
  version: '1.2.0', // Starting with patch 0 to test the 0->100 increment
  description: 'Test package for workflow testing'
};

const MOCK_COMMIT_DATA = {
  sha: 'abc123def456789',
  author: 'Test Author',
  message: 'feat: add new feature for testing'
};

/**
 * Utility class for version management operations
 */
class VersionManager {
  /**
   * Read current version from package.json
   * @param {string} packagePath - Path to package.json file
   * @returns {string} Current version string
   */
  static getCurrentVersion (packagePath = './package.json') {
    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageData.version;
    } catch (error) {
      throw new Error(`Failed to read version from ${packagePath}: ${error.message}`);
    }
  }

  /**
   * Calculate next version based on current version with custom patch increment
   * Patch versioning: 0 -> 100 -> 101 -> 102 -> 103...
   * @param {string} currentVersion - Current semantic version
   * @param {string} increment - Type of increment (major, minor, patch)
   * @returns {string} New version string
   */
  static calculateNextVersion (currentVersion, increment = 'patch') {
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)$/;
    const match = currentVersion.match(versionRegex);

    if (!match) {
      throw new Error(`Invalid version format: ${currentVersion}`);
    }

    let [, major, minor, patch] = match.map(Number);

    switch (increment) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
    default:
    // Custom patch increment: 0 -> 100 -> 101 -> 102...
      if (patch === 0) {
        patch = 100;
      } else {
        patch++;
      }
      break;
    }
    return `${major}.${minor}.${patch}`;
  }

  /**
   * Update version in package.json
   * @param {string} newVersion - New version to set
   * @param {string} packagePath - Path to package.json file
   */
  static updatePackageVersion (newVersion, packagePath = './package.json') {
    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      packageData.version = newVersion;
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
    } catch (error) {
      throw new Error(`Failed to update version in ${packagePath}: ${error.message}`);
    }
  }
}

/**
 * Utility class for changelog management operations
 */
class ChangelogManager {
  /**
   * Generate changelog entry for a new version
   * @param {string} version - Version number
   * @param {Object} commitData - Commit information
   * @param {string} commitData.sha - Git commit SHA
   * @param {string} commitData.author - Commit author
   * @param {string} commitData.message - Commit message
   * @returns {string} Formatted changelog entry
   */
  static generateChangelogEntry (version, commitData) {
    const currentDate = new Date().toISOString().split('T')[0];
    const shortSha = commitData.sha.substring(0, 7);

    return `## [${version}] - ${currentDate}

**Author:** ${commitData.author}
**Commit:** [${shortSha}](https://github.com/owner/repo/commit/${commitData.sha})
**Message:** ${commitData.message}

`;
  }

  /**
   * Update changelog file with new entry
   * @param {string} newEntry - New changelog entry to add
   * @param {string} changelogPath - Path to changelog file
   */
  static updateChangelog (newEntry, changelogPath = './CHANGELOG.md') {
    try {
      let existingContent = '';

      // Read existing changelog or create header if file doesn't exist
      if (fs.existsSync(changelogPath)) {
        existingContent = fs.readFileSync(changelogPath, 'utf8');
      } else {
        existingContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
      }

      // Split content to insert new entry after header
      const lines = existingContent.split('\n');
      const headerEndIndex = lines.findIndex(line => line.trim() === '' && lines.indexOf(line) > 2) || 3;

      const beforeHeader = lines.slice(0, headerEndIndex + 1);
      const afterHeader = lines.slice(headerEndIndex + 1);

      // Combine with new entry
      const updatedContent = [
        ...beforeHeader,
        newEntry,
        ...afterHeader
      ].join('\n');

      fs.writeFileSync(changelogPath, updatedContent);
    } catch (error) {
      throw new Error(`Failed to update changelog: ${error.message}`);
    }
  }
}

/**
 * Test suite for VersionManager class
 */
describe('VersionManager', () => {
  const testPackagePath = './test-package.json';

  beforeEach(() => {
    // Create test package.json
    fs.writeFileSync(testPackagePath, JSON.stringify(MOCK_PACKAGE_JSON, null, 2));
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testPackagePath)) {
      fs.unlinkSync(testPackagePath);
    }
  });

  describe('getCurrentVersion', () => {
    test('should read version from package.json correctly', () => {
      const version = VersionManager.getCurrentVersion(testPackagePath);
      expect(version).toBe('1.2.0');
    });

    test('should throw error for non-existent package.json', () => {
      expect(() => {
        VersionManager.getCurrentVersion('./non-existent.json');
      }).toThrow('Failed to read version from ./non-existent.json');
    });

    test('should throw error for invalid JSON', () => {
      fs.writeFileSync(testPackagePath, 'invalid json');
      expect(() => {
        VersionManager.getCurrentVersion(testPackagePath);
      }).toThrow('Failed to read version from');
    });
  });

  describe('calculateNextVersion', () => {
    test('should increment from patch 0 to 100', () => {
      const newVersion = VersionManager.calculateNextVersion('1.2.0');
      expect(newVersion).toBe('1.2.100');
    });

    test('should increment normally from patch 100 onwards', () => {
      const newVersion = VersionManager.calculateNextVersion('1.2.100');
      expect(newVersion).toBe('1.2.101');
    });

    test('should increment from patch 101 to 102', () => {
      const newVersion = VersionManager.calculateNextVersion('1.2.101');
      expect(newVersion).toBe('1.2.102');
    });

    test('should increment from patch 150 to 151', () => {
      const newVersion = VersionManager.calculateNextVersion('1.2.150');
      expect(newVersion).toBe('1.2.151');
    });

    test('should increment minor version correctly and reset patch to 0', () => {
      const newVersion = VersionManager.calculateNextVersion('1.2.105', 'minor');
      expect(newVersion).toBe('1.3.0');
    });

    test('should increment major version correctly and reset minor and patch to 0', () => {
      const newVersion = VersionManager.calculateNextVersion('1.2.105', 'major');
      expect(newVersion).toBe('2.0.0');
    });

    test('should handle edge cases with high patch numbers', () => {
      const newVersion = VersionManager.calculateNextVersion('5.10.999');
      expect(newVersion).toBe('5.10.1000');
    });

    test('should throw error for invalid version format', () => {
      expect(() => {
        VersionManager.calculateNextVersion('invalid.version');
      }).toThrow('Invalid version format: invalid.version');
    });

    test('should throw error for non-numeric version components', () => {
      expect(() => {
        VersionManager.calculateNextVersion('1.a.3');
      }).toThrow('Invalid version format: 1.a.3');
    });
  });

  describe('updatePackageVersion', () => {
    test('should update version in package.json correctly', () => {
      VersionManager.updatePackageVersion('2.0.0', testPackagePath);
      const updatedData = JSON.parse(fs.readFileSync(testPackagePath, 'utf8'));
      expect(updatedData.version).toBe('2.0.0');
      expect(updatedData.name).toBe('test-package'); // Should preserve other fields
    });

    test('should throw error for non-existent package.json', () => {
      expect(() => {
        VersionManager.updatePackageVersion('2.0.0', './non-existent.json');
      }).toThrow('Failed to update version in ./non-existent.json');
    });
  });
});

/**
 * Test suite for ChangelogManager class
 */
describe('ChangelogManager', () => {
  const testChangelogPath = './test-changelog.md';

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testChangelogPath)) {
      fs.unlinkSync(testChangelogPath);
    }
  });

  describe('generateChangelogEntry', () => {
    test('should generate properly formatted changelog entry', () => {
      const entry = ChangelogManager.generateChangelogEntry('1.2.4', MOCK_COMMIT_DATA);

      expect(entry).toContain('## [1.2.4]');
      expect(entry).toContain('**Author:** Test Author');
      expect(entry).toContain('**Commit:** [abc123d]');
      expect(entry).toContain('**Message:** feat: add new feature for testing');
    });

    test('should include current date in entry', () => {
      const entry = ChangelogManager.generateChangelogEntry('1.2.4', MOCK_COMMIT_DATA);
      const currentDate = new Date().toISOString().split('T')[0];
      expect(entry).toContain(currentDate);
    });

    test('should truncate SHA to 7 characters in display text', () => {
      const entry = ChangelogManager.generateChangelogEntry('1.2.100', MOCK_COMMIT_DATA);
      // Should contain the truncated SHA in the link text
      expect(entry).toContain('[abc123d]');
      // Should contain the full SHA in the URL (which is correct behavior)
      expect(entry).toContain('abc123def456789');
      // Verify the format: [shortSHA](url with full SHA)
      expect(entry).toMatch(/\[abc123d\]\(.*abc123def456789\)/);
    });
  });

  describe('updateChangelog', () => {
    test('should create new changelog file if it does not exist', () => {
      const newEntry = ChangelogManager.generateChangelogEntry('1.2.4', MOCK_COMMIT_DATA);
      ChangelogManager.updateChangelog(newEntry, testChangelogPath);

      const content = fs.readFileSync(testChangelogPath, 'utf8');
      expect(content).toContain('# Changelog');
      expect(content).toContain('## [1.2.4]');
    });

    test('should prepend new entry to existing changelog', () => {
      // Create initial changelog
      const initialContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## [1.2.3] - 2023-01-01\n\nOlder entry\n';
      fs.writeFileSync(testChangelogPath, initialContent);

      const newEntry = ChangelogManager.generateChangelogEntry('1.2.4', MOCK_COMMIT_DATA);
      ChangelogManager.updateChangelog(newEntry, testChangelogPath);

      const content = fs.readFileSync(testChangelogPath, 'utf8');
      const firstEntryIndex = content.indexOf('## [1.2.4]');
      const secondEntryIndex = content.indexOf('## [1.2.3]');

      expect(firstEntryIndex).toBeLessThan(secondEntryIndex);
      expect(content).toContain('Older entry');
    });

    test('should preserve existing changelog structure', () => {
      const initialContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## [1.2.3] - 2023-01-01\n\nOlder entry\n';
      fs.writeFileSync(testChangelogPath, initialContent);

      const newEntry = ChangelogManager.generateChangelogEntry('1.2.4', MOCK_COMMIT_DATA);
      ChangelogManager.updateChangelog(newEntry, testChangelogPath);

      const content = fs.readFileSync(testChangelogPath, 'utf8');
      expect(content).toContain('# Changelog');
      expect(content).toContain('All notable changes to this project will be documented in this file.');
    });
  });
});

/**
 * Integration test suite for complete workflow
 */
describe('Workflow Integration', () => {
  const testPackagePath = './test-package.json';
  const testChangelogPath = './test-changelog.md';

  beforeEach(() => {
    fs.writeFileSync(testPackagePath, JSON.stringify(MOCK_PACKAGE_JSON, null, 2));
  });

  afterEach(() => {
    // Clean up test files
    [testPackagePath, testChangelogPath].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  test('should complete full workflow successfully', () => {
    // Step 1: Read current version
    const currentVersion = VersionManager.getCurrentVersion(testPackagePath);
    expect(currentVersion).toBe('1.2.0');

    // Step 2: Calculate new version (0 -> 100)
    const newVersion = VersionManager.calculateNextVersion(currentVersion);
    expect(newVersion).toBe('1.2.100');

    // Step 3: Update package.json
    VersionManager.updatePackageVersion(newVersion, testPackagePath);
    const updatedVersion = VersionManager.getCurrentVersion(testPackagePath);
    expect(updatedVersion).toBe('1.2.100');

    // Step 4: Update changelog
    const changelogEntry = ChangelogManager.generateChangelogEntry(newVersion, MOCK_COMMIT_DATA);
    ChangelogManager.updateChangelog(changelogEntry, testChangelogPath);

    const changelogContent = fs.readFileSync(testChangelogPath, 'utf8');
    expect(changelogContent).toContain('## [1.2.100]');
    expect(changelogContent).toContain('Test Author');
    expect(changelogContent).toContain('feat: add new feature for testing');
  });

  test('should handle multiple version updates correctly', () => {
    // First update: 1.2.0 -> 1.2.100
    let currentVersion = VersionManager.getCurrentVersion(testPackagePath);
    let newVersion = VersionManager.calculateNextVersion(currentVersion);
    expect(newVersion).toBe('1.2.100');

    VersionManager.updatePackageVersion(newVersion, testPackagePath);

    let changelogEntry = ChangelogManager.generateChangelogEntry(newVersion, MOCK_COMMIT_DATA);
    ChangelogManager.updateChangelog(changelogEntry, testChangelogPath);

    // Second update: 1.2.100 -> 1.2.101
    currentVersion = VersionManager.getCurrentVersion(testPackagePath);
    newVersion = VersionManager.calculateNextVersion(currentVersion);
    expect(newVersion).toBe('1.2.101');

    VersionManager.updatePackageVersion(newVersion, testPackagePath);

    const secondCommitData = { ...MOCK_COMMIT_DATA, message: 'fix: critical bug fix' };
    changelogEntry = ChangelogManager.generateChangelogEntry(newVersion, secondCommitData);
    ChangelogManager.updateChangelog(changelogEntry, testChangelogPath);

    // Verify final state
    const finalVersion = VersionManager.getCurrentVersion(testPackagePath);
    expect(finalVersion).toBe('1.2.101');

    const changelogContent = fs.readFileSync(testChangelogPath, 'utf8');
    expect(changelogContent).toContain('## [1.2.101]');
    expect(changelogContent).toContain('## [1.2.100]');
    expect(changelogContent).toContain('fix: critical bug fix');
  });
});

// Export classes for potential reuse
module.exports = {
  VersionManager,
  ChangelogManager
};
