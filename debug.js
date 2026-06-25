const fs = require('fs');

const filePath = 'C:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\workspaces\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const occurrences = [];
let currentIndex = 0;
while(true) {
    const idx = content.indexOf('lg:col-span-4', currentIndex);
    if (idx === -1) break;
    occurrences.push(content.substring(idx - 20, idx + 20));
    currentIndex = idx + 1;
}
console.log(occurrences);
