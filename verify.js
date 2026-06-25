const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\workspaces\\page.tsx', 'utf-8');

console.log("lg:col-span-12 count:", (content.match(/lg:col-span-12/g) || []).length);
console.log("lg:col-span-8 count:", (content.match(/lg:col-span-8/g) || []).length);

const pfaIdx = content.indexOf('Poder de Fogo Atual');
console.log("Poder de Fogo Atual found:", pfaIdx !== -1);
if (pfaIdx !== -1) {
    const h3Text = content.substring(content.lastIndexOf('<h3', pfaIdx), pfaIdx + 50);
    console.log("H3 tag text:", h3Text.substring(0, 80));
    
    // find next 4 metric cards
    let searchStart = pfaIdx;
    for (let i=0; i<4; i++) {
        let mcIdx = content.indexOf('<MetricCard', searchStart);
        if (mcIdx !== -1) {
            let end = content.indexOf('>', mcIdx);
            console.log("Metric card", i, "accent:", content.substring(mcIdx, end).match(/accent="([^"]+)"/)?.[1]);
            searchStart = end;
        }
    }
}
