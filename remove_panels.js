const fs = require('fs');

const filePath = 'C:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\workspaces\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

let count = 0;
while (true) {
    let sidePanelIndex = content.indexOf('{/* SIDE PANEL (4 colunas) */}');
    if (sidePanelIndex === -1) {
        break;
    }
    
    let startDiv = content.indexOf('<div className="lg:col-span-4">', sidePanelIndex);
    if (startDiv === -1) {
        console.log("Error: could not find start div for panel at", sidePanelIndex);
        break;
    }
    
    let endDiv = -1;
    let divCount = 0;
    let j = startDiv;
    while (j < content.length) {
        if (content.substring(j, j + 4) === '<div') {
            divCount++;
            j += 4;
        } else if (content.substring(j, j + 6) === '</div>') {
            divCount--;
            if (divCount === 0) {
                endDiv = j + 6;
                break;
            }
            j += 6;
        } else {
            j++;
        }
    }
    
    if (endDiv !== -1) {
        // Find if there's any trailing whitespace or newline to remove
        let finalEnd = endDiv;
        while(content[finalEnd] === ' ' || content[finalEnd] === '\t' || content[finalEnd] === '\n' || content[finalEnd] === '\r') {
            finalEnd++;
        }
        content = content.substring(0, sidePanelIndex) + content.substring(finalEnd);
        count++;
        console.log("Removed block", count);
    } else {
        console.log("Error: could not find end div");
        break;
    }
}

console.log("Total removed:", count);

fs.writeFileSync(filePath, content, 'utf-8');
