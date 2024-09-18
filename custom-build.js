const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const angularJsonPath = './angular.json';
const customOutputPath = path.join(os.homedir(), '.kh', 'kenwandererhaven');

// Read and parse angular.json
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

// Replace the placeholder with the custom output path
angularJson.projects.kenwandererhaven.architect.build.options.outputPath = customOutputPath;

// Write the modified angular.json back to disk
fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));

// Run the Angular build command
try {
  execSync('ng build', { stdio: 'inherit' });
} finally {
  // Restore the original angular.json
  angularJson.projects.kenwandererhaven.architect.build.options.outputPath = "dist/kenwandererhaven";
  fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
}
