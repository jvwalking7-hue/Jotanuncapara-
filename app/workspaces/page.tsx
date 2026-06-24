'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


type Workspace = {
  id?:          string;
  nome:         string;
  nicho:        string;
  oferta:       string;
  status:       "teste" | "validada";
  emoji:        string;
  link:         string;
  linkExibicao: string;
  parametrosUtm:string;
  pixelId:      string;
  paises:       string[];
  idadeMin:     number;
  idadeMax:     number;
  genero:       string;
  campanhas?:   any[];
  atualizadoEm?:string;
};

const NICHOS_SUGERIDOS = [
  "Emagrecimento", "Diabetes", "Pressão Alta", "Renda Extra", "Criptomoedas",
  "Relacionamentos", "Espiritualidade", "Artesanato", "Negócios Online", "Saúde Masculina",
  "Ansiedade", "Dívidas", "Concursos Públicos", "Idiomas", "Culinária",
];

const EMOJIS = ["🎯","💰","❤️","🧠","💪","🌿","🔥","⚡","🚀","🎪","🌎","💊","📈","🏆","✨"];

const PAISES_OPCOES = [
  { value: "BR", label: "🇧🇷 Brasil" },
  { value: "US", label: "🇺🇸 Estados Unidos" },
  { value: "PT", label: "🇵🇹 Portugal" },
  { value: "MX", label: "🇲🇽 México" },
  { value: "AR", label: "🇦🇷 Argentina" },
  { value: "CO", label: "🇨🇴 Colômbia" },
  { value: "ES", label: "🇪🇸 Espanha" },
  { value: "DE", label: "🇩🇪 Alemanha" },
  { value: "GB", label: "🇬🇧 Reino Unido" },
  { value: "CA", label: "🇨🇦 Canadá" },
];

const WS_VAZIO: Workspace = {
  nome: "", nicho: "", oferta: "", status: "teste", emoji: "🎯",
  link: "", linkExibicao: "", parametrosUtm: "", pixelId: "",
  paises: ["BR"], idadeMin: 18, idadeMax: 65, genero: "todos",
};



export default function WorkspacesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [workspaces,    setWorkspaces]    = useState<Workspace[]>([]);
  const [carregando,    setCarregando]    = useState(true);
  const [salvando,      setSalvando]      = useState(false);
  const [editando,      setEditando]      = useState<Workspace | null>(null);
  const [mostrarForm,   setMostrarForm]   = useState(false);
  const [wsAtivo,       setWsAtivo]       = useState<string | null>(null);
  const [tab,           setTab]           = useState<"dados"|"historico">("dados");
  const [wsDetalhe,     setWsDetalhe]     = useState<Workspace | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (session?.user?.email) carregarWorkspaces();
    // Workspace ativo salvo localmente
    const ativo = localStorage.getItem("autoads_workspace_ativo");
    if (ativo) setWsAtivo(ativo);
  }, [session]);

  const carregarWorkspaces = async () => {
    setCarregando(true);
    const res = await fetch(`/api/workspaces?email=${session?.user?.email}`);
    const data = await res.json();
    
    if (data.workspaces) {
      setWorkspaces(data.workspaces.map((w: any) => {
        // Blindagem contra o erro de JSON Parse
        let parsedPaises = ["BR"];
        if (Array.isArray(w.paises)) {
          parsedPaises = w.paises;
        } else if (typeof w.paises === 'string') {
          try { parsedPaises = JSON.parse(w.paises || '["BR"]'); } catch (e) { parsedPaises = ["BR"]; }
        }
        return { ...w, paises: parsedPaises };
      }));
    }
    setCarregando(false);
  };

  const salvar = async () => {
    if (!editando) return;
    setSalvando(true);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session?.user?.email, workspace: editando }),
    });
    const data = await res.json();
    if (data.workspace) {
      await carregarWorkspaces();
      setMostrarForm(false);
      setEditando(null);
    }
    setSalvando(false);
  };

  const deletar = async (id: string) => {
    await fetch(`/api/workspaces?id=${id}`, { method: "DELETE" });
    if (wsAtivo === id) {
      localStorage.removeItem("autoads_workspace_ativo");
      setWsAtivo(null);
    }
    await carregarWorkspaces();
    setConfirmDelete(null);
  };

  const ativar = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    localStorage.setItem("autoads_workspace_ativo", id);
    localStorage.setItem("autoads_workspace_dados", JSON.stringify(ws));
    setWsAtivo(id);
  };

  const togglePais = (code: string) => {
    if (!editando) return;
    const paises = editando.paises.includes(code)
      ? editando.paises.filter(p => p !== code)
      : [...editando.paises, code];
    setEditando({ ...editando, paises });
  };

  if (status === "loading" || carregando) {
    return (
      <div className="bg-zinc-950 min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <span className="text-xl font-black tracking-widest text-white">AUTO<span className="text-orange-500">ADS</span></span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <a href="/workspaces" className="flex items-center gap-3 px-3 py-2.5 bg-orange-600/20 border border-orange-500/30 rounded-lg text-sm font-semibold text-orange-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            Workspace
          </a>
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Lançamento em Massa
          </a>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/50">
            <img src={session?.user?.image || ""} alt="Perfil" className="w-8 h-8 rounded-full ring-2 ring-orange-500/30"/>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-zinc-950 border-b border-zinc-800 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-white">Workspaces</h1>
            <p className="text-xs text-zinc-500">Gerencie suas ofertas e nichos. Ative um para preencher o painel automaticamente.</p>
          </div>
          <button onClick={() => { setEditando({ ...WS_VAZIO }); setMostrarForm(true); }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Nova oferta
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">

          {/* Grid de workspaces */}
          {workspaces.length === 0 && !mostrarForm ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-4 text-3xl">🎯</div>
              <h2 className="text-xl font-bold text-white mb-2">Nenhuma oferta cadastrada</h2>
              <p className="text-sm text-zinc-500 mb-6">Crie sua primeira oferta para salvar link, pixel, UTMs e países de uma vez.</p>
              <button onClick={() => { setEditando({ ...WS_VAZIO }); setMostrarForm(true); }}
                className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
                Criar primeira oferta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {workspaces.map(ws => {
                const ativo = wsAtivo === ws.id;
                return (
                  <div key={ws.id} className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${ativo ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                    {/* Header do card */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{ws.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{ws.nome}</p>
                            <p className="text-xs text-zinc-500 truncate">{ws.nicho} — {ws.oferta}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ws.status === 'validada' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                            {ws.status === 'validada' ? '✅ Validada' : '🧪 Teste'}
                          </span>
                        </div>
                      </div>

                      {/* Info rápida */}
                      <div className="space-y-1.5">
                        {ws.link && (
                          <p className="text-xs text-zinc-600 flex items-center gap-1.5 truncate">
                            <span className="text-zinc-700">🔗</span>
                            <span className="truncate">{ws.link}</span>
                          </p>
                        )}
                        {ws.pixelId && (
                          <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                            <span className="text-zinc-700">📍</span>
                            Pixel: {ws.pixelId}
                          </p>
                        )}
                        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                          <span className="text-zinc-700">🌍</span>
                          {Array.isArray(ws.paises) ? ws.paises.join(", ") : "BR"}
                        </p>
                        {(ws.campanhas?.length || 0) > 0 && (
                          <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                            <span className="text-zinc-700">📊</span>
                            {ws.campanhas?.length} disparo(s) registrado(s)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="px-5 pb-4 flex items-center gap-2">
                      {ativo ? (
                        <div className="flex-1 flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0"/>
                          <span className="text-xs font-semibold text-orange-400">Workspace ativo</span>
                        </div>
                      ) : (
                        <button onClick={() => ativar(ws.id!)}
                          className="flex-1 bg-zinc-800 hover:bg-orange-600 text-zinc-300 hover:text-white text-xs font-semibold py-2 rounded-lg transition-all">
                          Ativar
                        </button>
                      )}
                      <button onClick={() => { setWsDetalhe(ws); setTab("historico"); }}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Ver histórico">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      </button>
                      <button onClick={() => { setEditando({ ...ws, paises: Array.isArray(ws.paises) ? ws.paises : ["BR"] }); setMostrarForm(true); }}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={() => setConfirmDelete(ws.id!)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors" title="Deletar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Modal: Formulário de oferta ──────────────────────────────────────── */}
      {mostrarForm && editando && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">{editando.id ? "Editar oferta" : "Nova oferta"}</h2>
              <button onClick={() => { setMostrarForm(false); setEditando(null); }} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Emoji + Nome */}
              <div className="flex gap-3">
                <div>
                  <div className="relative">
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1.5">Nome da oferta <span className="text-red-400">*</span></label>
                  <input type="text" value={editando.nome} onChange={e => setEditando({ ...editando, nome: e.target.value })}
                    placeholder="Ex: Emagrecimento — Brasil"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none placeholder:text-zinc-700"/>
                </div>
              </div>

              {/* Nicho + Oferta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Nicho</label>
                  <input list="nichos-lista" value={editando.nicho} onChange={e => setEditando({ ...editando, nicho: e.target.value })}
                    placeholder="Ex: Emagrecimento"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none placeholder:text-zinc-700"/>
                  <datalist id="nichos-lista">{NICHOS_SUGERIDOS.map(n => <option key={n} value={n}/>)}</datalist>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Nome do produto/oferta</label>
                  <input type="text" value={editando.oferta} onChange={e => setEditando({ ...editando, oferta: e.target.value })}
                    placeholder="Ex: Seca Barriga Definitivo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none placeholder:text-zinc-700"/>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">Status da oferta</label>
                <div className="grid grid-cols-2 gap-3">
                  {([{ v: "teste", l: "Teste", d: "Ainda testando criativos e públicos" }, { v: "validada", l: "Validada", d: "Oferta provada, escalando" }] as const).map(opt => (
                    <button key={opt.v} type="button" onClick={() => setEditando({ ...editando, status: opt.v })}
                      className={`p-3 rounded-xl border text-left transition-all ${editando.status === opt.v ? (opt.v === 'validada' ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10') : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'}`}>
                      <p className={`text-sm font-bold ${editando.status === opt.v ? (opt.v === 'validada' ? 'text-green-400' : 'text-yellow-400') : 'text-zinc-300'}`}>{opt.l}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t border-zinc-800 pt-1">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Rastreamento e destino</p>
              </div>

              {/* Link de destino */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Link de destino <span className="text-red-400">*</span></label>
                <input type="url" value={editando.link} onChange={e => setEditando({ ...editando, link: e.target.value })}
                  placeholder="https://sua-pagina.com/oferta"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none placeholder:text-zinc-700"/>
              </div>

              {/* Link de exibição */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Link de exibição <span className="text-zinc-600">(opcional — aparece no anúncio)</span></label>
                <input type="text" value={editando.linkExibicao} onChange={e => setEditando({ ...editando, linkExibicao: e.target.value })}
                  placeholder="Ex: seusite.com/oferta"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none placeholder:text-zinc-700"/>
                <p className="text-xs text-zinc-600 mt-1">URL curta que aparece embaixo do anúncio no Facebook.</p>
              </div>

              {/* UTM */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Parâmetros UTM <span className="text-zinc-600">(UTMfy, UTM Builder, etc.)</span></label>
                <input type="text" value={editando.parametrosUtm} onChange={e => setEditando({ ...editando, parametrosUtm: e.target.value })}
                  placeholder="?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-xs focus:border-orange-500 focus:outline-none placeholder:text-zinc-700"/>
                <p className="text-xs text-zinc-600 mt-1">Adicionado automaticamente ao link de destino em cada campanha.</p>
              </div>

              {/* Pixel */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">ID do Pixel da Meta <span className="text-red-400">*</span></label>
                <input type="text" inputMode="numeric" value={editando.pixelId}
                  onChange={e => setEditando({ ...editando, pixelId: e.target.value.replace(/\D/g,'') })}
                  placeholder="1638314797420571" maxLength={20}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono focus:border-blue-500 focus:outline-none placeholder:text-zinc-700"/>
              </div>

              {/* Divisor */}
              <div className="border-t border-zinc-800 pt-1">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Público padrão</p>
              </div>

              {/* Países */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">Países de veiculação</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAISES_OPCOES.map(p => (
                    <button key={p.value} type="button" onClick={() => togglePais(p.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${editando.paises.includes(p.value) ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idade + Gênero */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Faixa etária</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={editando.idadeMin} onChange={e => setEditando({ ...editando, idadeMin: Number(e.target.value) })}
                      min="18" max="65" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none text-center"/>
                    <span className="text-zinc-600 text-xs shrink-0">até</span>
                    <input type="number" value={editando.idadeMax} onChange={e => setEditando({ ...editando, idadeMax: Number(e.target.value) })}
                      min="18" max="65" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none text-center"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Gênero</label>
                  <select value={editando.genero} onChange={e => setEditando({ ...editando, genero: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
                    <option value="todos">Todos os gêneros</option>
                    <option value="homens">Apenas homens</option>
                    <option value="mulheres">Apenas mulheres</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer do modal */}
            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button onClick={() => { setMostrarForm(false); setEditando(null); }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-3 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={!editando.nome || salvando}
                className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {salvando ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Salvando...</>) : "Salvar oferta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Histórico ─────────────────────────────────────────────────── */}
      {wsDetalhe && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{wsDetalhe.emoji}</span>
                <div>
                  <h2 className="text-base font-bold text-white">{wsDetalhe.nome}</h2>
                  <p className="text-xs text-zinc-500">{wsDetalhe.nicho} — {wsDetalhe.oferta}</p>
                </div>
              </div>
              <button onClick={() => setWsDetalhe(null)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {!wsDetalhe.campanhas || wsDetalhe.campanhas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">Nenhuma campanha disparada com esta oferta ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500 mb-4">{wsDetalhe.campanhas.length} disparo(s) registrado(s)</p>
                  {wsDetalhe.campanhas.map((camp: any) => (
                    <div key={camp.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-zinc-200">{camp.nomeCampanha}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${camp.status==='pausada'?'bg-yellow-500/20 text-yellow-400':'bg-green-500/20 text-green-400'}`}>
                          {camp.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500">
                        <span>{camp.objetivo}</span>
                        <span>{camp.tipoCampanha} — R$ {camp.orcamento}/dia</span>
                        <span>{camp.totalContas} conta(s) · {camp.totalAnuncios} anúncios</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-2">{new Date(camp.criadoEm).toLocaleString("pt-BR")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmação de delete ─────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <p className="text-lg font-bold text-white mb-2">Deletar oferta?</p>
            <p className="text-sm text-zinc-500 mb-6">O histórico de campanhas também será removido. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-3 rounded-xl transition-colors">Cancelar</button>
              <button onClick={() => deletar(confirmDelete)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-3 rounded-xl transition-colors">Deletar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}