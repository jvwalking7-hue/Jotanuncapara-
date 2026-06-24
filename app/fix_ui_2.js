const fs = require('fs');

const filepath = 'c:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\page.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

// Ações buttons (Edit, Pause, Robot)
content = content.replace(/p-3 rounded-xl bg-blue-500\/5/g, 'p-2 rounded-lg bg-blue-500/5');
content = content.replace(/p-3 rounded-xl bg-yellow-500\/5/g, 'p-2 rounded-lg bg-yellow-500/5');
content = content.replace(/p-3\.5 rounded-xl border transition-all/g, 'p-2 rounded-lg border transition-all');

// Status indicator function (just replace any text-sm with text-xs in the badge if it has text-sm, or replace text-[10px] with text-xs if the user explicitly wants text-xs)
// The user asked "Badge PAUSADA: text-xs". It might have been `text-sm` or `px-3 py-1 text-sm`.
content = content.replace(/px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest/g, 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest'); // Wait, if user wants text-xs, let's look for "PAUSADA"
content = content.replace(/PAUSADA<\/span>/g, 'PAUSADA</span>'); // Not enough context, let's just make sure we replace the text sizes for the span with PAUSADA
// Assuming the span has text-sm
content = content.replace(/text-sm font-black uppercase tracking-widest bg-yellow-500\/10/g, 'text-xs font-black uppercase tracking-widest bg-yellow-500/10');
content = content.replace(/text-sm font-black uppercase tracking-widest bg-emerald-500\/10/g, 'text-xs font-black uppercase tracking-widest bg-emerald-500/10');

// Título "SELEÇÃO MULTI-CONTAS" -> text-lg em uma linha só
// It's the SectionStep title.
content = content.replace(/<h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-white">Seleção Multi-Contas<\/h3>/g, '<h3 className="text-lg font-black uppercase tracking-widest text-white whitespace-nowrap">Seleção Multi-Contas</h3>');
content = content.replace(/<h3 className="text-base sm:text-base font-black uppercase tracking-widest text-white">Seleção Multi-Contas<\/h3>/g, '<h3 className="text-lg font-black uppercase tracking-widest text-white whitespace-nowrap">Seleção Multi-Contas</h3>');
content = content.replace(/<h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-white">/g, '<h3 className="text-sm font-black uppercase tracking-widest text-white">');

fs.writeFileSync(filepath, content, 'utf-8');
