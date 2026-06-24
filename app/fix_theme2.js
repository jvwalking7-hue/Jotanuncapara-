const fs = require('fs');

const filepath = 'c:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\page.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

// Isolate Sidebar
const sidebarStartRegex = /<aside[^>]*>/;
const sidebarEndStr = '</aside>';
const sidebarStartIndex = content.search(sidebarStartRegex);
const sidebarEndIndex = content.indexOf(sidebarEndStr, sidebarStartIndex) + sidebarEndStr.length;

let beforeSidebar = content.substring(0, sidebarStartIndex);
let sidebar = content.substring(sidebarStartIndex, sidebarEndIndex);
let afterSidebar = content.substring(sidebarEndIndex);

function cleanupLightMode(str) {
    str = str.replace(/bg-white\/\[0\.02\]/g, 'bg-gray-50');
    str = str.replace(/bg-white\/5/g, 'bg-gray-100');
    str = str.replace(/bg-white\/10/g, 'bg-gray-100');
    str = str.replace(/bg-black\/60/g, 'bg-gray-900/60');
    str = str.replace(/bg-\[#0a0a0f\]/g, 'bg-gray-100');
    str = str.replace(/text-zinc-700/g, 'text-gray-600');
    return str;
}

beforeSidebar = cleanupLightMode(beforeSidebar);
afterSidebar = cleanupLightMode(afterSidebar);

fs.writeFileSync(filepath, beforeSidebar + sidebar + afterSidebar, 'utf-8');
