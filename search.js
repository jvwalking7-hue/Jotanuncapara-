const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'jtab', 'Desktop', 'Jota não para', 'painel-ads', 'app', 'workspaces', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Delete middle panel
// We'll look for something like:
// <div className="... lg:col-span-4 ...">
//   ...
//   <h3>Poder de Fogo</h3>
//   ...
// </div>
// Wait, regex for the whole block is risky if we don't know the exact HTML structure. Let's find exactly the blocks.

// Let's first dump some lines around 'Poder de Fogo' to see what it looks like.
const lines = content.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Poder de Fogo')) {
        results.push(`Line ${i+1}: ${lines[i]}`);
    }
}
fs.writeFileSync('C:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\search_results.txt', results.join('\n'));
