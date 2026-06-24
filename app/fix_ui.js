const fs = require('fs');

const filepath = 'c:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\page.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

// SECTION: LANÇADOR EM MASSA
const parts = content.split('VIEW 2: GERENCIADOR DE CAMPANHA');
if (parts.length === 2) {
    let lancador = parts[0];
    const resto = parts[1];
    
    // 1. Paddings
    lancador = lancador.replace(/\bp-5\b/g, 'p-2'); // Replacing the already reduced paddings just in case
    lancador = lancador.replace(/\bp-7\b/g, 'p-3');
    lancador = lancador.replace(/\bp-8\b/g, 'p-4');
    lancador = lancador.replace(/\bp-6\b/g, 'p-3');
    lancador = lancador.replace(/\bp-4\b/g, 'p-2');
    
    // 2. Fontes
    lancador = lancador.replace(/\btext-2xl\b/g, 'text-lg');
    lancador = lancador.replace(/\btext-xl\b/g, 'text-base');
    lancador = lancador.replace(/\btext-lg\b/g, 'text-sm');
    
    // 5. Gaps
    lancador = lancador.replace(/\bgap-6\b/g, 'gap-3');
    lancador = lancador.replace(/\bgap-4\b/g, 'gap-2');
    
    // 3. Cards dos Business Managers
    lancador = lancador.replace(/px-6 py-4 hover:bg-white\/\[0\.02\]/g, 'px-3 py-2 hover:bg-white/[0.02]');
    lancador = lancador.replace(/px-6 py-4 text-left/g, 'px-3 py-2 text-left');
    
    // 6. Título "SELEÇÃO MULTI-CONTAS" -> Actually "Contas de Destino" is what was "text-3xl" previously, now "text-lg". Wait, the SectionStep title "Seleção Multi-Contas" had `text-xl sm:text-2xl` and changed to `text-sm sm:text-base`. Let's ensure it's `text-lg`.
    // Let's not try to guess. The SectionStep component is generic.
    
    // 7. Botão "PRÓXIMO"
    lancador = lancador.replace('px-6 py-3 bg-white text-black hover:bg-zinc-200 disabled:opacity-30 rounded-xl text-sm font-bold uppercase tracking-widest transition-all', 'px-4 py-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-30 rounded-xl text-sm font-bold uppercase tracking-widest transition-all');
    lancador = lancador.replace('px-8 py-3.5 bg-gradient-to-r', 'px-4 py-2 bg-gradient-to-r text-sm');
    lancador = lancador.replace('px-6 py-3 bg-[#030306]', 'px-4 py-2 bg-[#030306]');

    content = lancador + 'VIEW 2: GERENCIADOR DE CAMPANHA' + resto;
}

// 4. Painel "Poder de Fogo Atual"
content = content.replace(/px-4 py-4 group/g, 'px-3 py-3 group'); // MetricCard
content = content.replace(/text-2xl font-black font-mono tracking-tight text-white mb-1/g, 'text-base font-black font-mono tracking-tight text-white mb-1'); // Actually text-xs was requested for text, let's use text-sm maybe
content = content.replace(/text-xs font-black text-white uppercase tracking-\[0\.2em\] mb-4 flex items-center gap-2/g, 'text-xs font-black text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2');

// 8. "DICA DO SISTEMA": texto text-xs, padding p-3
content = content.replace(/p-4 rounded-xl border border-rose-500\/10 bg-zinc-950\/70/g, 'p-3 rounded-xl border border-rose-500/10 bg-zinc-950/70');
content = content.replace(/text-xs text-zinc-300 font-medium leading-relaxed/g, 'text-xs text-zinc-300 font-medium leading-relaxed');

// --- SEÇÃO: GERENCIADOR DE CAMPANHA / CENTRAL DE COMANDO ---
// 1. Título "CENTRAL DE COMANDO": text-2xl
content = content.replace(/text-xl font-black text-white tracking-tight uppercase">Central de Comando/g, 'text-2xl font-black text-white tracking-tight uppercase">Central de Comando');

// 2. Linhas da tabela: py-2 px-3, fonte text-sm
content = content.replace(/px-6 py-4 whitespace-nowrap/g, 'px-3 py-2 whitespace-nowrap text-sm');
content = content.replace(/<td className="px-6 py-4">/g, '<td className="px-3 py-2 text-sm">');
content = content.replace(/px-6 py-4 text-center/g, 'px-3 py-2 text-center');
content = content.replace(/px-6 py-4 text-right/g, 'px-3 py-2 text-right');

// 3. Headers da tabela: text-xs, whitespace-nowrap, py-2
content = content.replace(/px-6 py-4 text-xs/g, 'px-3 py-2 text-xs whitespace-nowrap');

// 4. Botões "VER CONJUNTOS": text-xs py-1 px-2
content = content.replace(/px-4 py-2\.5 rounded-xl text-white transition-all flex items-center gap-2 font-black text-\[10px\] uppercase tracking-widest/g, 'px-2 py-1 rounded-lg text-white transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest');

// 5. Dropdown "2 CONTAS": text-xs p-2
content = content.replace(/px-5 py-3 rounded-2xl shadow-inner min-w-\[280px\]/g, 'p-2 rounded-xl shadow-inner min-w-[280px]');

// --- SEÇÃO: COFRE DE CRIATIVO e WORKSPACE ---
// 1. Títulos: text-2xl
content = content.replace(/text-3xl font-black text-white uppercase tracking-tight mb-2">Cofre de Criativo/g, 'text-2xl font-black text-white uppercase tracking-tight mb-2">Cofre de Criativo');
content = content.replace(/text-3xl font-black text-white tracking-tight uppercase">Workspace/g, 'text-2xl font-black text-white tracking-tight uppercase">Workspace');

// 2. Área vazia central: py-8
content = content.replace(/py-16 flex flex-col items-center/g, 'py-8 flex flex-col items-center');
content = content.replace(/py-24 flex flex-col items-center/g, 'py-8 flex flex-col items-center');

// 3. Ícone central: w-12 h-12
content = content.replace(/w-16 h-16 rounded-full bg-zinc-900\/50 border border-white\/5 flex items-center justify-center mb-6/g, 'w-12 h-12 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center mb-4');

// 4. Textos internos: text-sm
content = content.replace(/text-lg text-zinc-500 max-w-md/g, 'text-sm text-zinc-500 max-w-md');

// 5. Botões: text-sm py-2 px-4
content = content.replace(/px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm/g, 'px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm');

fs.writeFileSync(filepath, content, 'utf-8');
