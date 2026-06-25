const fs = require('fs');
const filePath = 'C:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\workspaces\\page.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

const targetClass = 'className="w-10 h-10 mb-2 object-contain mx-auto filter brightness-0 sepia-0 saturate-100 invert-[30%] sepia-[80%] hue-rotate-[200deg] brightness-[100%] contrast-[100%]"';
const replacementClass = 'className="w-10 h-10 mb-2 object-contain mx-auto"';

// Let's count how many we have and replace them
let count = 0;
while (content.includes(targetClass)) {
    content = content.replace(targetClass, replacementClass);
    count++;
}

console.log("Replaced occurrences:", count);

if (count === 0) {
    // In case there are subtle space differences, let's try a regex
    const regex = /className="w-10\s+h-10\s+mb-2\s+object-contain\s+mx-auto\s+filter\s+brightness-0\s+sepia-0\s+saturate-100\s+invert-\[30%\]\s+sepia-\[80%\]\s+hue-rotate-\[200deg\]\s+brightness-\[100%\]\s+contrast-\[100%\]"/g;
    content = content.replace(regex, replacementClass);
    
    // Check if it matched anything this time
    // We can't know count with simple replace without match
    const newContentStr = fs.readFileSync(filePath, 'utf-8');
    const matchCount = (newContentStr.match(regex) || []).length;
    console.log("Matches found with regex:", matchCount);
}

fs.writeFileSync(filePath, content, 'utf-8');
