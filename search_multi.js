const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\workspaces\\page.tsx', 'utf-8');

const lines = content.split('\n');
for(let i=0; i<lines.length; i++) {
    if (lines[i].toLowerCase().includes('multiplicador')) {
        console.log(`Line ${i+1}: ${lines[i].trim()}`);
    }
}
