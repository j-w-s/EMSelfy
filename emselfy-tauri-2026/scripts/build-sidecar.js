const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rustInfo = execSync('rustc -Vv').toString();
const targetTriple = /host: (\S+)/.exec(rustInfo)?.[1];

if (!targetTriple) {
    console.error('failed to determine target triple');
    process.exit(1);
}

const extension = targetTriple.includes('windows') ? '.exe' : '';
const outDir = path.join(__dirname, '..', 'src-tauri', 'bin');
fs.mkdirSync(outDir, { recursive: true });

const outfile = path.join(outDir, `emselfy-server-${targetTriple}${extension}`);
const entry = path.join(__dirname, '..', 'main.js');

execSync(`bun build --compile --outfile ${JSON.stringify(outfile)} ${JSON.stringify(entry)}`, {
    stdio: 'inherit',
});

console.log('sidecar built: ' + outfile);
