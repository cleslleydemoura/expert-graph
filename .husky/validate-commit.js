const fs = require('fs');

const allowedPrefixes = ["feat", "fix", "chore", "docs", "style", "refactor", "merge", "test", "ci", "cicd", "perf", "build", "revert", "release", "security", "deps", "config"];
const commitMsgFile = process.argv[2];
const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim();

const isValidPrefix = allowedPrefixes.some(prefix => commitMsg.startsWith(`${prefix}:`));

if (!isValidPrefix) {
    console.error(`Faça o commit utilizando algum desses prefixos: ${allowedPrefixes.join(", ")}`);
    process.exit(1);
}