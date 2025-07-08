const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const versionBumpType = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(versionBumpType)) {
  console.error('Invalid version bump type. Use major, minor, or patch.');
  process.exit(1);
}

const upgradePackageJSONVersion = () => {
  const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonData);
  const versionParts = packageJson.version.split('.');

  try {
    switch (versionBumpType) {
      case 'patch':
        // Use a 3-digit patch version for clarity (e.g., 6.6.100 instead of 6.6.1)
        versionParts[2] = parseInt(versionParts[2], 10) + 1;
        // If we're starting a new patch cycle and the patch version is less than 100, make it 100 instead
        if (versionParts[2] < 100) {
          versionParts[2] = 100;
        }
        break;
      case 'minor':
        versionParts[1] = parseInt(versionParts[1], 10) + 1;
        versionParts[2] = 0;
        break;
      case 'major':
        versionParts[0] = parseInt(versionParts[0], 10) + 1;
        versionParts[1] = 0;
        versionParts[2] = 0;
        break;
      default:
        console.error(
          'Invalid version bump type. Please specify "patch", "minor", or "major".',
        );
        process.exit(1);
    }
    const newVersion = versionParts.join('.');
    // Just output the new version number for GitHub Actions to capture
    console.log(newVersion);
    return newVersion;
  } catch (error) {
    console.error(`Error upgrading version: ${error}`);
    process.exit(1);
  }
};

// Run the version upgrade and output the new version
upgradePackageJSONVersion(); 