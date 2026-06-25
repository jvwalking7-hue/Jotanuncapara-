const fs = require('fs');

const filePath = 'C:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\workspaces\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Expand the main form
content = content.replace(/lg:col-span-8/g, 'lg:col-span-12');

// 2. Remove the middle panel
// We will look for <div className="lg:col-span-4">...<h3>Poder de Fogo</h3>...</div>
// We know there are 6 of them. Let's find the `lg:col-span-4` div that contains "Poder de Fogo".
// Instead of complex parsing, let's use a regex that matches from `{/* SIDE PANEL` to the end of the `lg:col-span-4` div.
// Or we can find `<h3 className="... mb-6">Poder de Fogo</h3>` and backtrack to `<div className="lg:col-span-4">` or `<!-- Painel do Meio -->` / `{/* SIDE PANEL ... */}`
let newContent = content;

// Replace all 6 occurrences
// We can find the index of "Poder de Fogo</h3>" (or similar), find the preceding "lg:col-span-4", and find the matching closing div.
// To be safe, we can use a script that just removes these blocks.

const occurrences = [];
let currentIndex = 0;

while(true) {
    const idx = newContent.indexOf('Poder de Fogo</h3>', currentIndex);
    if (idx === -1) break;
    occurrences.push(idx);
    currentIndex = idx + 1;
}

// We only want the ones in the 6 steps (not the one in the sidebar, which is "Poder de Fogo Atual</h3>").
// So "Poder de Fogo</h3>" exactly.

console.log("Found occurrences:", occurrences.length);

for (let i = occurrences.length - 1; i >= 0; i--) {
    const idx = occurrences[i];
    
    // backtrack to lg:col-span-4
    let startDiv = newContent.lastIndexOf('<div className="lg:col-span-4">', idx);
    if (startDiv === -1) {
        // Try looking for lg:col-span-4 with other spaces
        console.log("Could not find start div for occurrence at", idx);
        continue;
    }
    
    // Look for the comment before it, optionally
    let commentStart = newContent.lastIndexOf('{/* SIDE PANEL', startDiv);
    if (commentStart !== -1 && startDiv - commentStart < 100) {
        startDiv = commentStart;
    }
    
    // Find the end of the div. We count open and close divs.
    let divCount = 0;
    let j = startDiv;
    let endDiv = -1;
    // skip the `{/* SIDE PANEL */}` if we started there
    if (newContent.substring(startDiv, startDiv + 4) === '{/* ') {
        j = newContent.indexOf('<div', startDiv);
    }
    
    while (j < newContent.length) {
        if (newContent.substring(j, j + 4) === '<div') {
            divCount++;
            j += 4;
        } else if (newContent.substring(j, j + 6) === '</div') {
            divCount--;
            if (divCount === 0) {
                endDiv = j + 6; // include the '>'
                // skip until '>'
                while (newContent[endDiv] !== '>' && endDiv < newContent.length) {
                    endDiv++;
                }
                endDiv++; // include '>'
                break;
            }
            j += 6;
        } else {
            j++;
        }
    }
    
    if (endDiv !== -1) {
        newContent = newContent.substring(0, startDiv) + newContent.substring(endDiv);
        console.log("Removed block from", startDiv, "to", endDiv);
    }
}

// 3. Pinte a barra lateral fixa de Azul
// Altere a classe do título <h3> de text-gray-900 para text-blue-600.
// Nos 4 componentes <MetricCard/> que estão dentro dessa barra, altere a propriedade accent de todos eles para accent="blue" (atualmente estão com red, purple, blue e green).
// We find "Poder de Fogo Atual"
let pfaIndex = newContent.indexOf('Poder de Fogo Atual');
if (pfaIndex !== -1) {
    let h3Start = newContent.lastIndexOf('<h3', pfaIndex);
    if (h3Start !== -1) {
        let h3End = newContent.indexOf('>', h3Start);
        let h3Tag = newContent.substring(h3Start, h3End + 1);
        let newH3Tag = h3Tag.replace('text-gray-900', 'text-blue-600');
        newContent = newContent.substring(0, h3Start) + newH3Tag + newContent.substring(h3End + 1);
        console.log("Replaced text-gray-900 with text-blue-600 in Poder de Fogo Atual");
    }
    
    // Find the next 4 MetricCards after this h3 and change their accent
    let searchStart = pfaIndex;
    for (let i = 0; i < 4; i++) {
        let mcIndex = newContent.indexOf('<MetricCard', searchStart);
        if (mcIndex === -1) break;
        
        let mcEnd = newContent.indexOf('/>', mcIndex);
        if (mcEnd === -1) mcEnd = newContent.indexOf('>', mcIndex);
        
        let mcTag = newContent.substring(mcIndex, mcEnd + 2); // assuming />
        
        // replace accent="..." with accent="blue"
        let newMcTag = mcTag.replace(/accent="[^"]+"/, 'accent="blue"');
        
        newContent = newContent.substring(0, mcIndex) + newMcTag + newContent.substring(mcEnd + 2);
        
        searchStart = mcIndex + newMcTag.length;
        console.log("Replaced accent in MetricCard", i + 1);
    }
}

fs.writeFileSync(filePath, newContent, 'utf-8');
console.log("All done!");
