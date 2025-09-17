# AI Content Publisher SDK Monitoring System

This document describes the automated monitoring system for the AI Content Publisher SDK integration.

## 🎯 Overview

The SDK monitoring system automatically checks for updates to the [AI Content Publisher SDK](https://github.com/tindevelopers/ai-content-publisher) and creates pull requests when changes are detected. This ensures our integration stays up-to-date with the latest features and bug fixes.

## 🔄 How It Works

### 1. Automated Monitoring (GitHub Actions)

**Workflow:** `.github/workflows/sdk-monitor.yml`

- **Schedule:** Runs every 6 hours automatically
- **Manual Trigger:** Can be triggered manually from GitHub Actions tab
- **Process:**
  1. Checks current SDK commit hash in `package.json`
  2. Fetches latest commit from SDK repository
  3. Compares versions to detect changes
  4. If updates found, proceeds to integration update

### 2. Automatic Updates

When updates are detected:

1. **Creates Update Branch:** `sdk-update-YYYYMMDD-HHMMSS`
2. **Updates Dependencies:** Downloads latest SDK version
3. **Runs Tests:** Executes compatibility and integration tests
4. **Checks Breaking Changes:** Analyzes for potential compatibility issues
5. **Creates Pull Request:** Automatically submits PR with detailed information

### 3. Pull Request Details

Each auto-generated PR includes:

- **Update Summary:** What changed and why
- **Commit History:** Recent changes from SDK repository
- **Test Results:** Automated compatibility test outcomes
- **Breaking Changes:** Detection of potential breaking changes
- **Review Status:** Draft mode if breaking changes detected

## 🛠️ Manual Operations

### Update SDK Manually

```bash
# Check for updates and apply interactively
node scripts/update-sdk.js

# Auto-update without prompts
node scripts/update-sdk.js --auto

# Force update (skip confirmations)
node scripts/update-sdk.js --force
```

### Run Compatibility Tests

```bash
# Check if current integration is compatible
node scripts/check-sdk-compatibility.js

# Run comprehensive integration tests
node scripts/test-sdk-integration.js
```

## 📁 File Structure

```
.github/
  workflows/
    sdk-monitor.yml           # GitHub Actions workflow

scripts/
  update-sdk.js              # Manual SDK update script
  check-sdk-compatibility.js # Compatibility checker
  test-sdk-integration.js    # Integration test suite

lib/
  content-publisher.ts       # Main SDK integration

components/
  content-publisher.tsx      # React UI component

app/api/content/
  publish/route.ts          # Publishing API endpoint
  test-publisher/route.ts   # Testing API endpoint
```

## 🧪 Testing Strategy

### Automated Tests

1. **Instantiation Test:** Verify SDK classes can be created
2. **Method Validation:** Check all required methods exist
3. **Content Validation:** Test content validation logic
4. **API Endpoints:** Verify API routes are functional
5. **Component Check:** Ensure React components are valid
6. **Type Definitions:** Validate TypeScript interfaces
7. **Dependencies:** Check package dependencies

### Breaking Change Detection

The system automatically detects potential breaking changes by:

- Testing method signatures
- Validating interface compatibility
- Running integration tests
- Checking for missing dependencies

## 🔧 Configuration

### Environment Variables

```bash
# GitHub Actions (set in repository secrets)
GITHUB_TOKEN=<token>     # For PR creation and API access
```

### Workflow Customization

Edit `.github/workflows/sdk-monitor.yml` to customize:

- **Schedule:** Change cron expression for different check frequency
- **Branches:** Modify target branches for PRs
- **Notifications:** Add Slack/Discord/email notifications
- **Test Suite:** Extend automated test coverage

## 📊 Monitoring Status

### Check Update Status

```bash
# View recent workflow runs
gh run list --workflow=sdk-monitor.yml

# View specific run details
gh run view <run-id>
```

### View Current SDK Version

```bash
# Check package.json for current SDK commit
grep "ai-content-publisher" package.json

# Or use the update script to check
node scripts/update-sdk.js --help
```

## 🚨 Handling Breaking Changes

When breaking changes are detected:

1. **PR Created as Draft:** Prevents accidental merging
2. **Review Required:** Manual review flagged as required
3. **Test Failures:** Compatibility tests will show specific issues
4. **Update Integration:** Manually update integration code as needed

### Common Breaking Changes

- **Method Signature Changes:** Parameters added/removed/changed
- **Interface Updates:** Required properties added/removed
- **Dependency Changes:** New peer dependencies required
- **API Changes:** Different response formats or error handling

## 📝 Best Practices

### Before Merging SDK Updates

1. **Review Changes:** Check the commit history and changelog
2. **Test Locally:** Run integration tests in your development environment
3. **Check Documentation:** Verify any new features or requirements
4. **Update Integration:** Modify code if breaking changes detected

### Maintenance

1. **Monitor Notifications:** Check for failed workflow runs
2. **Review PRs Promptly:** Don't let SDK updates accumulate
3. **Update Tests:** Extend test coverage as integration grows
4. **Document Changes:** Update this file when modifying the system

## 🔗 Related Links

- [AI Content Publisher SDK Repository](https://github.com/tindevelopers/ai-content-publisher)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Integration Documentation](./README.md#sdk-integration)

## 🆘 Troubleshooting

### Workflow Failures

```bash
# Check workflow logs
gh run view --log

# Re-run failed workflow
gh run rerun <run-id>
```

### Test Failures

```bash
# Run tests locally with verbose output
node scripts/test-sdk-integration.js

# Check specific compatibility issues
node scripts/check-sdk-compatibility.js
```

### Manual Recovery

If automated updates fail:

1. **Check Error Logs:** Review GitHub Actions logs
2. **Update Manually:** Use `scripts/update-sdk.js --force`
3. **Fix Integration:** Update code to match new SDK version
4. **Test Thoroughly:** Run full test suite before committing
5. **Create PR:** Manual PR with detailed description of changes

---

*This monitoring system ensures our AI Content Publisher integration remains current and functional with minimal manual intervention.*
