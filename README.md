# Auto-Changelog Workflow

Automated version management and changelog generation for Node.js projects using GitHub Actions.

## 🚀 Features

- **Automatic Version Bumping**: Increments semantic versions on every merge to master
- **Smart Changelog Generation**: Creates detailed entries with commit info, author, and links
- **Git Tagging**: Automatically creates and pushes version tags
- **GitHub Releases**: Optional automated release creation
- **Security-First**: Minimal permissions and secure coding practices
- **Skip Mechanism**: Bypass workflow with `[skip-changelog]` in commit messages
- **Branch Flexibility**: Works with both `master` and `main` branches

## 📋 Prerequisites

- Node.js project with `package.json`
- Repository with GitHub Actions enabled
- Write permissions for GitHub Actions (configured in repository settings)

## 🛠️ Quick Setup

### 1. Create Workflow File

Create `.github/workflows/auto-changelog.yml` in your repository:

```yaml
# Copy the complete workflow from the artifacts above
```

### 2. Configure Repository Permissions

Navigate to **Settings → Actions → General**:
- Set **Workflow permissions** to "Read and write permissions"
- Enable "Allow GitHub Actions to create and approve pull requests"

### 3. Initial File Structure

```
your-project/
├── .github/
│   └── workflows/
│       └── auto-changelog.yml
├── package.json                 # Required: contains version
├── CHANGELOG.md                 # Auto-created if missing
├── __tests__/                   # Optional: for unit tests
│   └── workflow.test.js
└── src/
    └── your-source-files...
```

## 🔄 How It Works

### Workflow Trigger

The workflow automatically runs when:
- ✅ Code is pushed to `master` or `main` branch
- ✅ Commit message doesn't contain `[skip-changelog]`
- ✅ Commit isn't already a version update

### Processing Steps

1. **Read Current Version** - Extracts version from `package.json`
2. **Calculate New Version** - Custom patch increment: `0 → 100 → 101 → 102...`
3. **Update Files** - Modifies `package.json` and `CHANGELOG.md`
4. **Git Operations** - Commits changes and creates version tag
5. **Create Release** - Optionally creates GitHub release

### Custom Patch Versioning

This workflow uses a **custom patch versioning scheme**:

- **Initial patch version**: `0` (e.g., `1.2.0`)
- **First increment**: `0 → 100` (e.g., `1.2.0 → 1.2.100`)
- **Subsequent increments**: `100 → 101 → 102 → 103...`

**Example version progression**:
```
1.2.0  →  1.2.100  →  1.2.101  →  1.2.102  →  1.2.103
```

**Minor/Major version increments reset patch to 0**:
```
1.2.150  →  1.3.0   (minor increment)
1.2.150  →  2.0.0   (major increment)
```

### Example Changelog Entry

```markdown
## [1.2.100] - 2024-07-04 14:30:25 UTC

**Author:** John Doe
**Commit:** [abc123d](https://github.com/owner/repo/commit/abc123def456789)
**Message:** feat: add user authentication feature
```

## 🎛️ Configuration

### Version Increment Strategy

**Default**: Custom patch increment (`0 → 100 → 101 → 102...`)

**Customize for Different Increment Types**:
```yaml
# Modify the "Calculate new version" step:
- name: Calculate new version
  run: |
    COMMIT_MESSAGE="${{ github.event.head_commit.message }}"

    if [[ $COMMIT_MESSAGE == "feat:"* ]]; then
      # Minor version for features (1.2.100 → 1.3.0)
      minor=$((minor + 1))
      patch=0
      NEW_VERSION="$major.$minor.$patch"
    elif [[ $COMMIT_MESSAGE == "fix:"* ]]; then
      # Custom patch increment for fixes
      if [ "$patch" = "0" ]; then
        NEW_PATCH=100
      else
        NEW_PATCH=$((patch + 1))
      fi
      NEW_VERSION="$major.$minor.$NEW_PATCH"
    elif [[ $COMMIT_MESSAGE == *"BREAKING CHANGE"* ]]; then
      # Major version for breaking changes (1.2.100 → 2.0.0)
      major=$((major + 1))
      minor=0
      patch=0
      NEW_VERSION="$major.$minor.$patch"
    else
      # Default custom patch increment
      if [ "$patch" = "0" ]; then
        NEW_PATCH=100
      else
        NEW_PATCH=$((patch + 1))
      fi
      NEW_VERSION="$major.$minor.$NEW_PATCH"
    fi
```

### Skip Workflow

Add `[skip-changelog]` to commit messages:

```bash
git commit -m "docs: update README [skip-changelog]"
git commit -m "chore: fix typo [skip-changelog]"
```

### Disable GitHub Releases

Remove or comment out the `create-release` job:

```yaml
# Comment out or remove this entire section
# create-release:
#   needs: update-changelog
#   runs-on: ubuntu-latest
#   # ... rest of release job
```

## 🧪 Testing

### Run Unit Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Validate Workflow

```bash
# Install actionlint (one time)
npm install -g actionlint

# Validate workflow syntax
actionlint .github/workflows/auto-changelog.yml
```

### Test Classes

The included test suite covers:

- **VersionManager**: Version reading, calculation, and updating
- **ChangelogManager**: Entry generation and file management
- **Integration Tests**: Complete workflow simulation

## 🔒 Security Features

### Minimal Permissions

```yaml
permissions:
  contents: write        # Update files and create tags
  pull-requests: read    # Read PR information
```

### Secure Practices

- ✅ Uses built-in `GITHUB_TOKEN` (no additional secrets needed)
- ✅ JSON parsing with `jq` prevents injection attacks
- ✅ Input validation for version formats
- ✅ Commit message sanitization
- ✅ File existence checks before operations

### Token Scoping

- Automatically scoped to repository
- Limited to workflow execution time
- No manual token management required

## 🚨 Troubleshooting

### Common Issues

**🔴 Workflow Not Triggering**
```bash
# Check branch name in workflow file
on:
  push:
    branches:
      - master  # Make sure this matches your default branch
```

**🔴 Permission Denied**
- Verify **Settings → Actions → General → Workflow permissions**
- Ensure "Read and write permissions" is selected
- Check if branch protection rules block the action

**🔴 Invalid JSON Error**
```bash
# Validate package.json syntax
npx jsonlint package.json

# Or use jq
jq empty package.json
```

**🔴 Workflow Skipped**
- Check if commit message contains `[skip-changelog]`
- Verify the commit isn't from the workflow itself
- Ensure push is to the correct branch

### Debug Mode

Enable workflow debugging:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## 📚 Advanced Usage

### Custom Changelog Format

Modify the changelog entry generation:

```yaml
- name: Update changelog
  run: |
    # Custom changelog format
    CHANGELOG_ENTRY="### 🎉 Version $NEW_VERSION

    **📅 Released:** $CURRENT_DATE
    **👤 Author:** $AUTHOR
    **🔗 Commit:** [$SHORT_SHA]($COMMIT_URL)

    > $COMMIT_MESSAGE

    ---
    "
```

### Multiple Branch Support

```yaml
on:
  push:
    branches:
      - master
      - main
      - release/*
      - hotfix/*
```

### Conditional Release Creation

```yaml
create-release:
  needs: update-changelog
  runs-on: ubuntu-latest
  # Only create releases for certain commit types
  if: contains(github.event.head_commit.message, 'feat:') || contains(github.event.head_commit.message, 'fix:')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m "feat: add amazing feature"`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [GitHub Actions Documentation](https://docs.github.com/en/actions)
- 🐛 [Report Issues](https://github.com/your-username/your-repo/issues)
- 💬 [Discussions](https://github.com/your-username/your-repo/discussions)

---

**Made with ❤️ for automated development workflows**