#!/usr/bin/env node

/**
 * Manual SDK Update Script
 * 
 * Use this script to manually check for and apply SDK updates
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SDK_REPO = 'tindevelopers/ai-content-publisher';
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');

console.log('🔍 AI Content Publisher SDK Update Tool\n');

async function getCurrentSDKVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const sdkDep = packageJson.dependencies['ai-content-publisher'];
    
    if (!sdkDep) {
      throw new Error('ai-content-publisher not found in dependencies');
    }
    
    // Extract commit hash from GitHub URL
    if (sdkDep.includes('#')) {
      return sdkDep.split('#')[1];
    }
    
    return 'main';
  } catch (error) {
    throw new Error(`Failed to read current SDK version: ${error.message}`);
  }
}

async function getLatestSDKCommit() {
  try {
    console.log('📡 Fetching latest commit from GitHub...');
    
    const response = await fetch(`https://api.github.com/repos/${SDK_REPO}/commits/main`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      sha: data.sha,
      message: data.commit.message,
      author: data.commit.author.name,
      date: data.commit.author.date
    };
  } catch (error) {
    throw new Error(`Failed to fetch latest commit: ${error.message}`);
  }
}

async function getCommitDifference(fromCommit, toCommit) {
  try {
    console.log(`📊 Comparing commits ${fromCommit.substring(0, 7)}...${toCommit.substring(0, 7)}`);
    
    const response = await fetch(`https://api.github.com/repos/${SDK_REPO}/compare/${fromCommit}...${toCommit}`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      totalCommits: data.total_commits,
      commits: data.commits.map(commit => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0],
        author: commit.commit.author.name,
        date: commit.commit.author.date
      }))
    };
  } catch (error) {
    throw new Error(`Failed to get commit difference: ${error.message}`);
  }
}

function updatePackageJson(newCommit) {
  try {
    console.log('📝 Updating package.json...');
    
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    packageJson.dependencies['ai-content-publisher'] = `github:${SDK_REPO}#${newCommit}`;
    
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log('✅ package.json updated');
  } catch (error) {
    throw new Error(`Failed to update package.json: ${error.message}`);
  }
}

function installUpdatedSDK() {
  try {
    console.log('📦 Installing updated SDK...');
    
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ SDK installation completed');
  } catch (error) {
    throw new Error(`Failed to install updated SDK: ${error.message}`);
  }
}

function runCompatibilityTests() {
  try {
    console.log('🧪 Running compatibility tests...');
    
    execSync('node scripts/check-sdk-compatibility.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ Compatibility tests passed');
    return true;
  } catch (error) {
    console.error('❌ Compatibility tests failed');
    return false;
  }
}

function createUpdateCommit(latestCommit, changes) {
  try {
    console.log('📝 Creating git commit...');
    
    const commitMessage = `feat: Update AI Content Publisher SDK to ${latestCommit.sha.substring(0, 7)}

Latest changes:
${changes.commits.slice(0, 5).map(c => `- ${c.message}`).join('\n')}

Updated from: ${SDK_REPO}
Commit: ${latestCommit.sha}
Author: ${latestCommit.author}
Date: ${latestCommit.date}`;

    execSync('git add package.json package-lock.json', {
      cwd: path.join(__dirname, '..')
    });
    
    execSync(`git commit -m "${commitMessage}"`, {
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ Git commit created');
  } catch (error) {
    console.warn('⚠️ Failed to create git commit (this is optional):', error.message);
  }
}

async function main() {
  try {
    // Get current version
    const currentCommit = await getCurrentSDKVersion();
    console.log(`Current SDK version: ${currentCommit}\n`);
    
    // Get latest version
    const latestCommit = await getLatestSDKCommit();
    console.log(`Latest SDK commit: ${latestCommit.sha.substring(0, 7)}`);
    console.log(`Author: ${latestCommit.author}`);
    console.log(`Date: ${latestCommit.date}`);
    console.log(`Message: ${latestCommit.message}\n`);
    
    // Check if update is needed
    if (currentCommit === latestCommit.sha || currentCommit === latestCommit.sha.substring(0, 7)) {
      console.log('✅ SDK is already up to date!');
      return;
    }
    
    // Get changes
    const changes = await getCommitDifference(currentCommit, latestCommit.sha);
    
    console.log(`📈 ${changes.totalCommits} new commits found:\n`);
    changes.commits.forEach(commit => {
      console.log(`  ${commit.sha} - ${commit.message} (${commit.author})`);
    });
    console.log('');
    
    // Confirm update
    if (process.argv.includes('--auto') || process.argv.includes('-y')) {
      console.log('🤖 Auto-update mode enabled, proceeding with update...\n');
    } else {
      console.log('❓ Do you want to proceed with the update? (y/N)');
      // In a real scenario, you'd use readline for user input
      // For automation, we'll assume yes if --auto flag is used
      if (!process.argv.includes('--force')) {
        console.log('ℹ️ Use --auto or --force flag to skip confirmation');
        return;
      }
    }
    
    // Perform update
    console.log('🚀 Starting SDK update process...\n');
    
    updatePackageJson(latestCommit.sha);
    installUpdatedSDK();
    
    // Test compatibility
    const testsPass = runCompatibilityTests();
    
    if (!testsPass) {
      console.error('\n❌ Compatibility tests failed! Update may contain breaking changes.');
      console.log('You may need to manually update your integration code.');
    } else {
      console.log('\n✅ Update completed successfully!');
      
      // Create commit
      createUpdateCommit(latestCommit, changes);
    }
    
    console.log('\n📋 Update Summary:');
    console.log(`- Updated from: ${currentCommit}`);
    console.log(`- Updated to: ${latestCommit.sha.substring(0, 7)}`);
    console.log(`- New commits: ${changes.totalCommits}`);
    console.log(`- Tests: ${testsPass ? 'Passed' : 'Failed'}`);
    
  } catch (error) {
    console.error('\n💥 SDK update failed:', error.message);
    process.exit(1);
  }
}

// Show usage if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node scripts/update-sdk.js [options]

Options:
  --auto, -y    Skip confirmation prompt
  --force       Force update even without confirmation
  --help, -h    Show this help message

Examples:
  node scripts/update-sdk.js                 # Interactive update
  node scripts/update-sdk.js --auto          # Automatic update
  node scripts/update-sdk.js --force         # Force update without prompts
`);
  process.exit(0);
}

// Run the update
main();
