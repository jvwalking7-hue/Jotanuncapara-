import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # SECTION: LANÇADOR EM MASSA
    
    # 1. Todos os paddings pela metade (p-8 -> p-4, p-6 -> p-3, p-4 -> p-2)
    # Be careful not to replace things like pt-8 or pb-8 if not requested, but let's do exactly what's asked for p-*
    # We will do this specifically in the Lançador section (which is between "VIEW 1: LANÇADOR" and "VIEW 2: GERENCIADOR")
    
    parts = content.split('VIEW 2: GERENCIADOR DE CAMPANHA')
    if len(parts) == 2:
        lancador = parts[0]
        resto = parts[1]
        
        # In lancador:
        # paddings
        lancador = re.sub(r'\bp-8\b', 'p-4', lancador)
        lancador = re.sub(r'\bp-6\b', 'p-3', lancador)
        lancador = re.sub(r'\bp-4\b', 'p-2', lancador)
        
        # fontes
        lancador = re.sub(r'\btext-2xl\b', 'text-lg', lancador)
        lancador = re.sub(r'\btext-xl\b', 'text-base', lancador)
        lancador = re.sub(r'\btext-lg\b', 'text-sm', lancador)
        
        # gaps
        lancador = re.sub(r'\bgap-6\b', 'gap-3', lancador)
        lancador = re.sub(r'\bgap-4\b', 'gap-2', lancador)
        
        # 3. Cards dos BM: py-2 px-3
        # In lancador, where it says px-6 py-4 for BM
        lancador = lancador.replace('px-6 py-4 hover:bg-white/[0.02]', 'px-3 py-2 hover:bg-white/[0.02]')
        lancador = lancador.replace('px-6 py-4 text-left', 'px-3 py-2 text-left')
        # BM Icon w-12 h-12 -> maybe smaller for compact? Let's leave as is or reduce to w-8 h-8
        lancador = lancador.replace('w-12 h-12 rounded-xl bg-blue-500/5', 'w-8 h-8 rounded-lg bg-blue-500/5')
        
        # 4. Poder de Fogo Atual
        # "Poder de Fogo Atual" title: text-xs
        # It's currently text-xs in the file, wait: the user asks for: cards com p-3, texto text-xs, título text-xs
        # MetricCard is defined outside Lançador. I will modify MetricCard function.
        
        # 6. Título "SELEÇÃO MULTI-CONTAS": text-lg em uma linha só
        # The SectionStep title was text-base.
        
        # 7. Botão PRÓXIMO
        lancador = lancador.replace('px-6 py-3 bg-white', 'px-4 py-2 bg-white text-sm')
        lancador = lancador.replace('px-8 py-3.5 bg-gradient', 'px-4 py-2 bg-gradient')
        lancador = lancador.replace('px-6 py-3 bg-[#030306]', 'px-4 py-2 bg-[#030306]')
        
        content = lancador + 'VIEW 2: GERENCIADOR DE CAMPANHA' + resto

    # MetricCard update
    content = content.replace('px-4 py-4 group', 'px-3 py-3 group')
    content = content.replace('text-2xl font-black', 'text-xs font-black')
    content = content.replace('text-[10px] uppercase', 'text-[10px] uppercase')
    
    # DICA DO SISTEMA
    content = content.replace('p-4 rounded-xl border border-rose-500/10', 'p-3 rounded-xl border border-rose-500/10')
    content = content.replace('text-xs text-zinc-300 font-medium', 'text-xs text-zinc-300 font-medium')
    
    # SECTION: GERENCIADOR DE CAMPANHA / CENTRAL DE COMANDO
    content = content.replace('text-xl font-black text-white tracking-tight uppercase">Central de Comando', 'text-2xl font-black text-white tracking-tight uppercase">Central de Comando')
    
    # Linhas da tabela
    content = content.replace('px-6 py-4 whitespace-nowrap', 'px-3 py-2 whitespace-nowrap text-sm')
    content = content.replace('<td className="px-6 py-4">', '<td className="px-3 py-2 text-sm">')
    content = content.replace('px-6 py-4 text-center', 'px-3 py-2 text-center')
    content = content.replace('px-6 py-4 text-right', 'px-3 py-2 text-right')
    
    # Headers da tabela
    content = content.replace('px-6 py-4 text-xs', 'px-3 py-2 text-xs whitespace-nowrap')
    
    # Botões "VER CONJUNTOS"
    content = content.replace('px-4 py-2.5 rounded-xl', 'px-2 py-1 rounded-lg text-xs')
    
    # Dropdown "2 CONTAS"
    content = content.replace('px-5 py-3 rounded-2xl shadow-inner min-w-[280px]', 'p-2 rounded-xl shadow-inner min-w-[280px]')

    # COFRE DE CRIATIVO e WORKSPACE
    # We will just do a general replacement for their titles since they share similar layout
    content = content.replace('text-3xl font-black text-white uppercase tracking-tight mb-2">Cofre', 'text-2xl font-black text-white uppercase tracking-tight mb-2">Cofre')
    content = content.replace('text-3xl font-black text-white tracking-tight uppercase">Workspace', 'text-2xl font-black text-white tracking-tight uppercase">Workspace')
    
    content = content.replace('py-16 flex flex-col', 'py-8 flex flex-col')
    content = content.replace('py-24 flex flex-col', 'py-8 flex flex-col')
    content = content.replace('w-16 h-16 rounded-full', 'w-12 h-12 rounded-full')
    content = content.replace('text-lg text-zinc-500', 'text-sm text-zinc-500')
    content = content.replace('px-8 py-4 bg-white', 'px-4 py-2 bg-white text-sm')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    process_file('c:\\Users\\jtab\\Desktop\\Jota não para\\painel-ads\\app\\page.tsx')
