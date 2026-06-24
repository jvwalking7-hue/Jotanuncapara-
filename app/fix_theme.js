const fs = require('fs');

const filepath = 'c:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\page.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

// 1. Isolate Sidebar to avoid changing its text-white
const sidebarStartRegex = /<aside[^>]*>/;
const sidebarEndStr = '</aside>';
const sidebarStartIndex = content.search(sidebarStartRegex);
const sidebarEndIndex = content.indexOf(sidebarEndStr, sidebarStartIndex) + sidebarEndStr.length;

let beforeSidebar = content.substring(0, sidebarStartIndex);
let sidebar = content.substring(sidebarStartIndex, sidebarEndIndex);
let afterSidebar = content.substring(sidebarEndIndex);

// Update Sidebar background
sidebar = sidebar.replace(/bg-\[#020204\]/g, 'bg-[#16181D]');

// Function to process light theme replacements
function processTheme(str) {
    // Backgrounds (App background)
    str = str.replace(/bg-\[#020204\]/g, 'bg-gray-50');
    str = str.replace(/bg-\[#050508\]/g, 'bg-white shadow-sm');
    
    // Cards
    str = str.replace(/bg-zinc-950\/60/g, 'bg-white shadow-sm');
    str = str.replace(/bg-zinc-950\/40/g, 'bg-white shadow-sm');
    str = str.replace(/bg-zinc-950\/25/g, 'bg-white/80 backdrop-blur-xl border-b border-gray-200'); // Header
    str = str.replace(/bg-zinc-950\/70/g, 'bg-white shadow-sm');
    str = str.replace(/bg-zinc-950/g, 'bg-gray-50');
    str = str.replace(/bg-zinc-900\/20/g, 'bg-white shadow-sm');
    str = str.replace(/bg-zinc-900\/50/g, 'bg-gray-100');
    
    // Inputs
    str = str.replace(/bg-\[#07070d\]/g, 'bg-white');
    str = str.replace(/bg-\[#0c0c14\]/g, 'bg-gray-50');
    
    // Borders
    str = str.replace(/border-white\/5/g, 'border-gray-200');
    str = str.replace(/border-white\/10/g, 'border-gray-200');
    str = str.replace(/border-white\/20/g, 'border-gray-300');
    str = str.replace(/border-white\/\[0\.02\]/g, 'border-gray-100');
    
    // Hover backgrounds
    str = str.replace(/hover:bg-white\/\[0\.02\]/g, 'hover:bg-gray-50');
    str = str.replace(/hover:bg-[#07070d]/g, 'hover:bg-gray-50');

    // Texts (Careful with buttons that have bg-rose-500, they should keep text-white)
    // We'll replace text-white globally first, then fix specific known buttons if needed, 
    // but better yet, let's use regex that avoids replacing text-white if it's near a solid bg color
    // A simpler approach: replace text-white with text-gray-800
    // Then replace text-zinc-300 with text-gray-700
    // text-zinc-400 -> text-gray-500
    // text-zinc-500 -> text-gray-500
    str = str.replace(/text-white/g, 'text-gray-900');
    str = str.replace(/text-zinc-100/g, 'text-gray-900');
    str = str.replace(/text-zinc-300/g, 'text-gray-700');
    str = str.replace(/text-zinc-400/g, 'text-gray-500');
    str = str.replace(/text-zinc-500/g, 'text-gray-500');
    str = str.replace(/text-zinc-600/g, 'text-gray-400');
    
    // Secondary Buttons
    str = str.replace(/bg-\[#0a0a0f\]/g, 'bg-gray-100');
    
    // Fix specific elements that MUST remain text-white
    str = str.replace(/bg-rose-500 text-gray-900/g, 'bg-rose-500 text-white');
    str = str.replace(/bg-gradient-to-r text-sm/g, 'bg-gradient-to-r text-sm text-white');
    str = str.replace(/bg-gradient-to-r from-rose-500 to-rose-600 text-gray-900/g, 'bg-gradient-to-r from-rose-500 to-rose-600 text-white');
    str = str.replace(/bg-rose-600 border-rose-500 text-gray-900/g, 'bg-rose-600 border-rose-500 text-white');
    
    // Tabela rows
    str = str.replace(/hover:bg-gray-900\/\[0\.01\]/g, 'hover:bg-gray-50'); // Just in case
    str = str.replace(/hover:bg-white\/\[0\.01\]/g, 'hover:bg-gray-50');
    str = str.replace(/border-gray-200/g, 'border-gray-200'); // the border-white/5 -> border-gray-200 covered this
    
    // Dropdown / Modals specific
    str = str.replace(/bg-\[#030306\]/g, 'bg-white');

    // Remove text-gray-900 from placeholders if any
    str = str.replace(/placeholder:text-gray-400/g, 'placeholder:text-gray-400');

    return str;
}

beforeSidebar = processTheme(beforeSidebar);
afterSidebar = processTheme(afterSidebar);

// Write back
fs.writeFileSync(filepath, beforeSidebar + sidebar + afterSidebar, 'utf-8');
