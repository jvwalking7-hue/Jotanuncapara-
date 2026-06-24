'use client';

import React, { useState, useEffect, useRef } from "react";
import { signIn, useSession, signOut } from "next-auth/react";

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — "Antigravity Premium UI"
   Tema: Dark Obsidian & Glowing Crimson
   ──────────────────────────────────────────────────────────────────────── */

type Objetivo = "OUTCOME_SALES" | "OUTCOME_TRAFFIC" | "OUTCOME_LEADS" | "OUTCOME_ENGAGEMENT" | "OUTCOME_AWARENESS";
type TipoCampanha = "CBO" | "ABO";
type EstrategiaLance = "LOWEST_COST" | "COST_CAP" | "BID_CAP" | "MINIMUM_ROAS";
type LocalConversao = "WEBSITE" | "WEBSITE_AND_CALLS" | "WEBSITE_AND_APP" | "PHONE_CALL" | "MESSENGER" | "WHATSAPP" | "INSTAGRAM_DIRECT";

type CASelecionada = { caId: string; caName: string; bmName: string; bmId: string; paginaId: string };
type LogItem = { tipo: string; mensagem: string; pct?: number; ok?: boolean };
type ArquivoCofre = { id: string; url: string; name: string; type: string; data: string };
type Workspace = { id: string; nomeProduto: string; nomeOferta: string; status: 'teste' | 'validada'; link: string; pixelId: string; parametrosUtm: string };
type RegraRobo = { stopLossGasto: string; escalaRoas: string; escalaAumento: string };
type RoboLogAction = { id: string; dataHora: string; tipo: 'info' | 'stop' | 'escala' | 'recuperacao'; campanha: string; mensagem: string };

type FacebookObject = {
  id: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  name: string;
  configured_status?: string;
  _originName?: string;
};

type Campaign = FacebookObject & { objective?: string; buying_type?: string; daily_budget?: number; lifetime_budget?: number };
type AdSet = FacebookObject & { daily_budget?: number; lifetime_budget?: number };
type Ad = FacebookObject & { creative?: { image_url?: string; thumbnail_url?: string; video_id?: string; title?: string; body?: string } };

// Premium SVG Icons (Obsidian Gradient Styling)
const IconWorkspace = (
  <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);
const IconManager = (
  <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012-2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const IconCreator = (
  <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const IconFolder = (
  <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);
const IconCloud = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const IconSales = <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
const IconTraffic = <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>;
const IconLeads = <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 017.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconEngage = <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const IconBrand = <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const IconEdit = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const IconPause = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPlay = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconChevronDown = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const IconTest = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const IconValid = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const IconRobot = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h2v2H9V9zm4 0h2v2h-2V9z" /></svg>;

const OBJETIVOS = [
  { value: "OUTCOME_SALES", label: "Vendas", icon: <img src="/VENDAS.png" className="w-10 h-10 mb-2 object-contain mx-auto filter brightness-0 sepia-0 saturate-100 invert-[30%] sepia-[80%] hue-rotate-[200deg] brightness-[100%] contrast-[100%]" /> },
  { value: "OUTCOME_TRAFFIC", label: "Tráfego", icon: <img src="/TRAFEGO.png" className="w-10 h-10 mb-2 object-contain mx-auto filter brightness-0 sepia-0 saturate-100 invert-[30%] sepia-[80%] hue-rotate-[200deg] brightness-[100%] contrast-[100%]" /> },
  { value: "OUTCOME_LEADS", label: "Leads", icon: <img src="/LEADS.png" className="w-10 h-10 mb-2 object-contain mx-auto filter brightness-0 sepia-0 saturate-100 invert-[30%] sepia-[80%] hue-rotate-[200deg] brightness-[100%] contrast-[100%]" /> },
  { value: "OUTCOME_ENGAGEMENT", label: "Engajamento", icon: <img src="/engajamento.png" className="w-10 h-10 mb-2 object-contain mx-auto filter brightness-0 sepia-0 saturate-100 invert-[30%] sepia-[80%] hue-rotate-[200deg] brightness-[100%] contrast-[100%]" /> },
  { value: "OUTCOME_AWARENESS", label: "Alcance", icon: <img src="/ALCANCE.png" className="w-10 h-10 mb-2 object-contain mx-auto filter brightness-0 sepia-0 saturate-100 invert-[30%] sepia-[80%] hue-rotate-[200deg] brightness-[100%] contrast-[100%]" /> },
];

const ESTRATEGIAS_LANCE = [
  { value: "LOWEST_COST", label: "Menor custo (Automático)" },
  { value: "COST_CAP", label: "Limite de Custo (Cost Cap)" },
  { value: "BID_CAP", label: "Limite de Lance (Bid Cap)" },
  { value: "MINIMUM_ROAS", label: "ROAS mínimo" },
];

const LOCAIS_CONVERSAO = [
  { value: "WEBSITE", label: "Site Oficial" },
  { value: "PHONE_CALL", label: "Ligação Telefônica" },
  { value: "MESSENGER", label: "Messenger" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM_DIRECT", label: "Instagram Direct" },
];

const PAISES_POPULARES = [
  { value: "BR", label: "Brasil" }, { value: "US", label: "Estados Unidos" }, { value: "PT", label: "Portugal" },
  { value: "MX", label: "México" }, { value: "AR", label: "Argentina" }, { value: "CO", label: "Colômbia" },
];

/* ── Primitivos visuais reutilizáveis GIGANTES ─────────────────────────────────── */
function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`antigravity-glass rounded-3xl flex flex-col overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function Toggle({ enabled, onChange, label, desc }: { enabled: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-3.5 border-b border-gray-200 last:border-0 hover:bg-gray-50 px-3 rounded-xl transition-colors cursor-pointer" onClick={() => onChange(!enabled)}>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <button type="button" aria-pressed={enabled} className={`relative w-12 h-6 rounded-full shrink-0 transition-all duration-300 focus:outline-none border-2 ${enabled ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-transparent' : 'bg-gray-100 border-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function MetricCard({ label, value, accent = "red", sub }: { label: string; value: string | number; accent?: "red" | "purple" | "blue" | "green"; sub?: string }) {
  const ring: Record<string, string> = {
    red: "from-blue-500/10 to-transparent text-blue-500 border-blue-500/20 hover:border-blue-500/40",
    purple: "from-purple-500/10 to-transparent text-purple-400 border-purple-500/20 hover:border-purple-500/40",
    blue: "from-sky-500/10 to-transparent text-sky-400 border-sky-500/20 hover:border-sky-500/40",
    green: "from-emerald-500/10 to-transparent text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${ring[accent].split(' ').pop()} bg-white shadow-sm px-3 py-3 group transition-all duration-300 hover:shadow-2xl`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${ring[accent].split(' ').slice(0, 2).join(' ')} opacity-30 pointer-events-none group-hover:opacity-60 transition-opacity duration-300`} />
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{label}</p>
        <p className="text-sm font-black font-mono tracking-tight text-gray-900 mb-1">{value}</p>
        {sub && <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{sub}</p>}
      </div>
    </div>
  );
}

function SectionStep({ num, title, tooltip, children }: { num: string; title: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-10 sm:pl-12 pb-8 border-l border-gray-200 last:border-transparent last:pb-0 animate-fade-in">
      <div className="absolute left-[-14px] top-0 w-7 h-7 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-xs font-black text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]">{num}</div>
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        <div className="flex-1 w-full space-y-4">
          <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 whitespace-nowrap">{title}</h3>
          {children}
        </div>
        {tooltip && (
          <div className="w-full xl:w-[280px] shrink-0 p-2 rounded-xl border border-blue-500/10 bg-white shadow-sm relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-60 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Dica do Sistema</p>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">{tooltip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const formatCurrency = (value?: number) => {
  if (!value || value === 0) return "Indefinido";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value / 100);
};

function StatusIndicator({ status }: { status: FacebookObject['status'] }) {
  if (status === 'ACTIVE') {
    return (
      <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wider">
        <span className="relative flex h-3 w-3">
          <span className="animate-pulse-green absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-black"></span>
        </span>
        Ativa (ON)
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 font-black uppercase tracking-wider">
      <span className="h-3 w-3 rounded-full bg-slate-700 border border-black"></span>
      {status === 'PAUSED' ? 'Pausada' : status === 'ARCHIVED' ? 'Arquivada' : 'Deletada'}
    </div>
  );
}

/* ─── Landing Page ─────────────────────────────────────────────────────── */
function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen font-sans overflow-x-hidden selection:bg-blue-500/30 relative">
      {/* Dynamic Background mesh glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[180px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] animate-float-delayed" />
      </div>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-gray-50/80 backdrop-blur-xl border-b border-gray-200 shadow-2xl" : "bg-transparent"}`}>
        <div className="w-full max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <span className="text-sm font-black tracking-widest text-gray-900">AUTO<span className="text-blue-500">ADS</span></span>
          <button onClick={() => signIn("facebook", { callbackUrl: "/workspaces" })}
            className="magnetic-btn bg-blue-600 hover:bg-blue-700 hover:brightness-110 text-gray-900 text-sm font-bold px-8 py-3.5 rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] uppercase tracking-widest">
            Entrar no Painel
          </button>
        </div>
      </nav>

      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
        <div className="relative max-w-5xl mx-auto animate-slide-up">
          <h1 className="text-5xl md:text-8xl font-black leading-[1.05] tracking-tight mb-8">
            Lance 100<br />campanhas<br />
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              em segundos.
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            A plataforma de automação de anúncios definitiva. Escale seu tráfego através da Meta API com a interface Antigravity de alto nível.
          </p>
          <button onClick={() => signIn("facebook", { callbackUrl: "/workspaces" })}
            className="magnetic-btn w-full sm:w-auto bg-blue-600 hover:bg-blue-700 hover:brightness-110 text-gray-900 font-bold text-sm px-12 py-5 rounded-2xl transition-all shadow-[0_0_40px_rgba(59,130,246,0.4)] uppercase tracking-widest">
            Conectar com Facebook
          </button>
        </div>
      </section>
    </div>
  );
}

/* ─── App principal ─────────────────────────────────────────────────────── */
export default function Home() {
  const { data: session, status } = useSession();
  const TOTAL_PASSOS = 6;
  const [passoAtual, setPassoAtual] = useState(1);
  const [abaAtiva, setAbaAtiva] = useState<'workspaces' | 'gestao' | 'lancador' | 'biblioteca'>('workspaces');

  // Estados Form Lançador
  const [bms, setBms] = useState<any[]>([]);
  const [contasAvulsas, setContasAvulsas] = useState<any[]>([]);
  const [carregandoBMs, setCarregandoBMs] = useState(false);
  const [bmExpandida, setBmExpandida] = useState<string | null>(null);
  const [casSelecionadas, setCasSelecionadas] = useState<CASelecionada[]>([]);

  // Passo 2
  const [nomeCampanha, setNomeCampanha] = useState("");
  const [objetivo, setObjetivo] = useState<Objetivo>("OUTCOME_SALES");
  const [tipoCampanha, setTipoCampanha] = useState<TipoCampanha>("CBO");
  const [orcamento, setOrcamento] = useState("50");
  const [quantidadeCampanhas, setQuantidadeCampanhas] = useState("1");
  const [quantidadeConjuntos, setQuantidadeConjuntos] = useState("1");
  const [estrategiaLance, setEstrategiaLance] = useState<EstrategiaLance>("LOWEST_COST");
  const [valorLance, setValorLance] = useState("");

  // Extra variables for Form
  const [dataInicioDt, setDataInicioDt] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [nomeConjunto, setNomeConjunto] = useState("");
  const [nomeAnuncio, setNomeAnuncio] = useState("");
  const [textoAnuncio, setTextoAnuncio] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [callToAction, setCallToAction] = useState("SHOP_NOW");

  // Passo 3
  const [localConversao, setLocalConversao] = useState<LocalConversao>("WEBSITE");
  const [link, setLink] = useState("");
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [whatsappDdi, setWhatsappDdi] = useState("+55");
  const [pixelId, setPixelId] = useState("");
  const [parametrosUtm, setParametrosUtm] = useState("");

  // Passo 4
  const [paises, setPaises] = useState<string[]>(["BR"]);
  const [idadeMin, setIdadeMin] = useState("18");
  const [idadeMax, setIdadeMax] = useState("65");
  const [genero, setGenero] = useState("todos");

  // Passo 5
  const [advantageAudience, setAdvantageAudience] = useState(true);
  const [advantagePlacement, setAdvantagePlacement] = useState(true);
  const [advantageCreative, setAdvantageCreative] = useState(true);

  // Passo 6
  const [regraNomeacao, setRegraNomeacao] = useState<'arquivo' | 'sistema'>('arquivo');
  const [imagens, setImagens] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Execução
  const [lancando, setLancando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [logItems, setLogItems] = useState<LogItem[]>([]);
  const [concluido, setConcluido] = useState(false);
  const [erroFinal, setErroFinal] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };


  // === ESTADOS DA ABA DE GESTÃO ===
  const [activeAdAccounts, setActiveAdAccounts] = useState<CASelecionada[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [gestaoNivel, setGestaoNivel] = useState<'campanhas' | 'conjuntos' | 'anuncios'>('campanhas');
  const [gestaoCampanhaAtiva, setGestaoCampanhaAtiva] = useState<Campaign | null>(null);
  const [gestaoConjuntoAtivo, setGestaoConjuntoAtivo] = useState<AdSet | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [gestaoLoading, setGestaoLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [itemEditando, setItemEditando] = useState<any>(null);

  // === ESTADOS DO ROBÔ E DIÁRIO DE BORDO ===
  const [modalRoboOpen, setModalRoboOpen] = useState(false);
  const [itemRobo, setItemRobo] = useState<any>(null);
  const [formRobo, setFormRobo] = useState<RegraRobo>({ stopLossGasto: '50', escalaRoas: '3.0', escalaAumento: '20' });
  const [robosAtivos, setRobosAtivos] = useState<Record<string, RegraRobo>>({});
  const [isDrawerLogOpen, setIsDrawerLogOpen] = useState(false);
  const [roboLogs, setRoboLogs] = useState<RoboLogAction[]>([]);

  // === ESTADOS DA BIBLIOTECA DE MÍDIA ===
  const [cofreArquivos, setCofreArquivos] = useState<ArquivoCofre[]>([]);
  const [isModalCofreOpen, setIsModalCofreOpen] = useState(false);

  // === ESTADOS DOS WORKSPACES (OFERTAS) ===
  const [wsAtivo, setWsAtivo] = useState<Workspace | null>(null);
  const [workspacesList, setWorkspacesList] = useState<Workspace[]>([]);
  const [isModalWsOpen, setIsModalWsOpen] = useState(false);
  const [wsForm, setWsForm] = useState<Workspace>({
    id: '', nomeProduto: '', nomeOferta: '', status: 'teste', link: '', pixelId: '', parametrosUtm: ''
  });

  const totalConjuntos = casSelecionadas.length * Number(quantidadeCampanhas || 0) * Number(quantidadeConjuntos || 0);
  const totalAnuncios = totalConjuntos * (imagens.length || 1);

  const passoLabels = ["Contas", "Campanha", "Conversão", "Público", "IA Meta", "Criativos"];
  const passoIcones = [
    <svg key="1" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    <svg key="2" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
    <svg key="3" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    <svg key="4" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 017.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    <svg key="5" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    <svg key="6" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // LOAD WORKSPACES AND ACTIVE WS
  useEffect(() => {
    try {
      const list = localStorage.getItem("autoads_workspaces_list");
      if (list) {
        const parsedList = JSON.parse(list).map((w: any) => ({
          ...w,
          nomeProduto: w.nomeProduto || w.nome || 'Produto Indefinido',
          nomeOferta: w.nomeOferta || 'Oferta Principal',
          status: w.status || 'teste'
        }));
        setWorkspacesList(parsedList);
      }

      const dados = localStorage.getItem("autoads_workspace_dados");
      if (dados) {
        const ws = JSON.parse(dados);
        const wsCompleto = {
          ...ws,
          nomeProduto: ws.nomeProduto || ws.nome || 'Produto Indefinido',
          nomeOferta: ws.nomeOferta || 'Oferta Principal',
          status: ws.status || 'teste'
        };
        setWsAtivo(wsCompleto);
        if (wsCompleto.link) setLink(wsCompleto.link);
        if (wsCompleto.pixelId) setPixelId(wsCompleto.pixelId);
        if (wsCompleto.parametrosUtm) setParametrosUtm(wsCompleto.parametrosUtm);
      }

      const robos = localStorage.getItem("autoads_robos_ativos");
      if (robos) setRobosAtivos(JSON.parse(robos));

      const logs = localStorage.getItem("autoads_robo_logs");
      if (logs) setRoboLogs(JSON.parse(logs));

    } catch { }
  }, []);

  useEffect(() => {
    if (session?.user?.email && bms.length === 0 && !carregandoBMs) {
      setCarregandoBMs(true);
      fetch("/api/facebook/adaccounts", { method: "POST", body: JSON.stringify({ email: session.user.email }) })
        .then(r => r.json())
        .then(d => {
          if (d.bms) {
            setBms(d.bms);
            setContasAvulsas(d.contasAvulsas || []);
            if (d.bms.length > 0) setBmExpandida(d.bms[0].id);
            if (d.bms[0]?.contas[0] && activeAdAccounts.length === 0) {
              const firstCA = d.bms[0].contas[0];
              setActiveAdAccounts([{ caId: firstCA.id, caName: firstCA.name, bmName: d.bms[0].name, bmId: d.bms[0].id, paginaId: "" }]);
            }
          }
          setCarregandoBMs(false);
        })
        .catch(() => setCarregandoBMs(false));
    }
  }, [session]);

  const toggleGestaoAccount = (ca: CASelecionada) => {
    setActiveAdAccounts(prev => {
      const exists = prev.find(p => p.caId === ca.caId);
      if (exists) return prev.filter(p => p.caId !== ca.caId);
      return [...prev, ca];
    });
    setGestaoNivel('campanhas');
    setGestaoCampanhaAtiva(null);
    setGestaoConjuntoAtivo(null);
  };

  useEffect(() => {
    if (abaAtiva !== 'gestao' || activeAdAccounts.length === 0) return;
    const fetchMultiCampaigns = async () => {
      setGestaoLoading(true);
      setDataError("");
      try {
        const promises = activeAdAccounts.map(account =>
          fetch(`/api/facebook/gestao/campaigns`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session?.user?.email, ad_account_id: account.caId })
          }).then(res => res.json().then(data => ({ ...data, _accountName: account.caName })))
        );
        const results = await Promise.all(promises);
        let combinedCampaigns: Campaign[] = [];
        results.forEach(res => {
          if (res.data) {
            const mapped = res.data.map((item: any) => ({ ...item, _originName: res._accountName }));
            combinedCampaigns = [...combinedCampaigns, ...mapped];
          }
        });
        setCampaigns(combinedCampaigns);
      } catch (err: any) {
        setDataError("Erro ao buscar dados paralelos.");
        setCampaigns([]);
      } finally {
        setGestaoLoading(false);
      }
    };
    fetchMultiCampaigns();
  }, [activeAdAccounts, abaAtiva]);

  const fetchSingleLevelData = async (url: string, payload: any, dataSetter: (data: any[]) => void) => {
    setGestaoLoading(true);
    setDataError("");
    try {
      const res = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      const mappedData = (data.data || []).map((item: any) => ({ ...item, _originName: payload._originName }));
      dataSetter(mappedData);
    } catch (err: any) {
      setDataError(err.message || "Erro ao buscar dados.");
      dataSetter([]);
    } finally {
      setGestaoLoading(false);
    }
  };

  useEffect(() => {
    if (!gestaoCampanhaAtiva) return;
    fetchSingleLevelData(`/api/facebook/gestao/adsets`, { campaign_id: gestaoCampanhaAtiva.id, _originName: gestaoCampanhaAtiva._originName }, setAdSets);
  }, [gestaoCampanhaAtiva]);

  useEffect(() => {
    if (!gestaoConjuntoAtivo) return;
    fetchSingleLevelData(`/api/facebook/gestao/ads`, { adset_id: gestaoConjuntoAtivo.id, _originName: gestaoConjuntoAtivo._originName }, setAds);
  }, [gestaoConjuntoAtivo]);

  const handleToggleStatusReal = async (obj: FacebookObject, type: 'campaign' | 'adset' | 'ad') => {
    const nextStatus = obj.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    if (type === 'campaign') setCampaigns(prev => prev.map(c => c.id === obj.id ? { ...c, status: nextStatus } : c));
    if (type === 'adset') setAdSets(prev => prev.map(c => c.id === obj.id ? { ...c, status: nextStatus } : c));
    if (type === 'ad') setAds(prev => prev.map(c => c.id === obj.id ? { ...c, status: nextStatus } : c));
    try {
      const res = await fetch(`/api/facebook/gestao/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ object_id: obj.id, status: nextStatus })
      });
      if (!res.ok) throw new Error("Falha na API.");
    } catch (err) {
      if (type === 'campaign') setCampaigns(prev => prev.map(c => c.id === obj.id ? { ...c, status: obj.status } : c));
      if (type === 'adset') setAdSets(prev => prev.map(c => c.id === obj.id ? { ...c, status: obj.status } : c));
      if (type === 'ad') setAds(prev => prev.map(c => c.id === obj.id ? { ...c, status: obj.status } : c));
      showToast("Erro: A Meta recusou a alteração de status.", "error");
    }
  };

  // --- LÓGICA DO ROBÔ SENTINELA ---
  const adicionarLogRobo = (tipo: RoboLogAction['tipo'], mensagem: string, campanhaNome: string) => {
    const novoLog: RoboLogAction = {
      id: Date.now().toString(),
      dataHora: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      tipo,
      campanha: campanhaNome,
      mensagem
    };
    setRoboLogs(prev => {
      const updated = [novoLog, ...prev].slice(0, 100);
      localStorage.setItem("autoads_robo_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const abrirModalRobo = (item: any) => {
    setItemRobo(item);
    if (robosAtivos[item.id]) {
      setFormRobo(robosAtivos[item.id]);
    } else {
      setFormRobo({ stopLossGasto: '50', escalaRoas: '3.0', escalaAumento: '20' });
    }
    setModalRoboOpen(true);
  };

  const salvarRegraRobo = () => {
    if (!itemRobo) return;
    const novosRobos = { ...robosAtivos, [itemRobo.id]: formRobo };
    setRobosAtivos(novosRobos);
    localStorage.setItem("autoads_robos_ativos", JSON.stringify(novosRobos));

    adicionarLogRobo('info', `Regras de Defesa (R$ ${formRobo.stopLossGasto}) e Ataque (ROAS > ${formRobo.escalaRoas}) ativadas.`, itemRobo.name);

    setModalRoboOpen(false);
  };

  const desativarRobo = () => {
    if (!itemRobo) return;
    const novosRobos = { ...robosAtivos };
    delete novosRobos[itemRobo.id];
    setRobosAtivos(novosRobos);
    localStorage.setItem("autoads_robos_ativos", JSON.stringify(novosRobos));

    adicionarLogRobo('info', `Monitoramento 24h desligado pelo usuário.`, itemRobo.name);

    setModalRoboOpen(false);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logItems]);

  const handlePixelId = (e: React.ChangeEvent<HTMLInputElement>) => setPixelId(e.target.value.replace(/\D/g, ''));

  const handleImagensCofre = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const arquivos = Array.from(e.target.files);
      const novosNoCofre: ArquivoCofre[] = arquivos.map((f, i) => ({
        id: `file_${Date.now()}_${i}`,
        url: URL.createObjectURL(f),
        name: f.name,
        type: f.type.startsWith("video/") ? "video" : "image",
        data: new Date().toLocaleDateString('pt-BR')
      }));
      setCofreArquivos(prev => [...novosNoCofre, ...prev]);
    }
  };

  const handleImagens = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const arquivos = Array.from(e.target.files);
      setImagens(prev => {
        const novas = [...prev, ...arquivos];
        setPreviewUrls(novas.map(f => URL.createObjectURL(f)));
        return novas;
      });
    }
  };

  const removerImagem = (idx: number) => {
    setImagens(prev => prev.filter((_, i) => i !== idx));
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  // FULLY FUNCTIONAL COFRE SELECTOR
  const selecionarDoCofre = async (arquivo: ArquivoCofre) => {
    try {
      const res = await fetch(arquivo.url);
      const blob = await res.blob();
      const file = new File([blob], arquivo.name, { type: blob.type });
      setImagens(prev => {
        const novas = [...prev, file];
        setPreviewUrls(novas.map(f => URL.createObjectURL(f)));
        return novas;
      });
      setIsModalCofreOpen(false);
      showToast(`O arquivo ${arquivo.name} foi adicionado à fila de disparo!`, "success");
    } catch {
      showToast(`Falha ao injetar ${arquivo.name} na fila. Inserindo dados de referência.`, "error");
    }
  };

  const togglePais = (code: string) => setPaises(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const toggleCA = (ca: any, bm: any) => {
    const jaExiste = casSelecionadas.find(c => c.caId === ca.id);
    if (jaExiste) {
      setCasSelecionadas(prev => prev.filter(c => c.caId !== ca.id));
    } else {
      const paginaId = ca.paginas?.[0]?.id || "";
      setCasSelecionadas(prev => [...prev, {
        caId: ca.id, caName: ca.name, bmName: bm.name, bmId: bm.id, paginaId,
      }]);
    }
  };

  const setPaginaCA = (caId: string, paginaId: string) => {
    setCasSelecionadas(prev => prev.map(c => c.caId === caId ? { ...c, paginaId } : c));
  };

  const podeAvançar = () => {
    if (passoAtual === 1) return casSelecionadas.length > 0;
    if (passoAtual === 2) return orcamento !== "" && Number(orcamento) > 0;
    if (passoAtual === 3) return link !== "" && pixelId !== "";
    if (passoAtual === 4) return paises.length > 0;
    return true;
  };

  const podeLancar = imagens.length > 0 && casSelecionadas.length > 0 && paises.length > 0 && link !== "" && pixelId !== "";

  const handleLancar = async () => {
    if (!podeLancar) return;
    setLancando(true);
    setConcluido(false);
    setErroFinal("");
    setProgresso(0);
    setLogItems([{ tipo: "info", mensagem: "Iniciando processo de automação..." }]);

    const turboTimer = setTimeout(() => {
      setLogItems(prev => {
        const isFinished = prev.some(log => log.tipo === "erro" || log.mensagem.includes("Concluído"));
        if (isFinished) return prev;
        return [...prev, { tipo: "info", mensagem: "Ativando MODO TURBO na conexão com a Meta API..." }];
      });
    }, 9000);

    try {
      const urlsUpload: { url: string, type: string, name: string }[] = [];
      for (let i = 0; i < imagens.length; i++) {
        const file = imagens[i];
        const resSignature = await fetch("/api/upload", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        if (!resSignature.ok) throw new Error(`Falha ao autorizar upload de ${file.name}`);
        const { signedUrl, publicUrl } = await resSignature.json();

        const uploadDireto = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!uploadDireto.ok) throw new Error(`O upload de ${file.name} falhou.`);

        urlsUpload.push({ url: publicUrl, type: file.type.startsWith("video/") ? "video" : "image", name: file.name });
        setLogItems(prev => [...prev, { tipo: "concluido", mensagem: `[UPLOAD] "${file.name}" salvo com sucesso!` }]);
      }

      setLogItems(prev => [...prev, { tipo: "info", mensagem: "Iniciando criação das campanhas na Meta..." }]);

      const formData = new FormData();
      formData.append("email", session?.user?.email || "");
      formData.append("objetivo", objetivo);
      formData.append("tipoCampanha", tipoCampanha);
      formData.append("orcamento", orcamento);
      formData.append("regraNomeacao", regraNomeacao);
      formData.append("estrategiaLance", estrategiaLance);
      const dataInicio = dataInicioDt && horaInicio ? new Date(`${dataInicioDt}T${horaInicio}:00`).toISOString() : "";
      formData.append("dataInicio", dataInicio);
      formData.append("nomeCampanha", nomeCampanha);
      formData.append("nomeConjunto", nomeConjunto);
      formData.append("nomeAnuncio", nomeAnuncio);
      formData.append("textoAnuncio", textoAnuncio);
      formData.append("titulo", titulo);
      formData.append("descricao", descricao);
      formData.append("callToAction", callToAction);
      formData.append("link", link);
      formData.append("pixelId", pixelId);
      formData.append("localConversao", localConversao);
      formData.append("paises", JSON.stringify(paises));
      formData.append("quantidadeCampanhas", String(quantidadeCampanhas));
      formData.append("quantidadeConjuntos", String(quantidadeConjuntos));
      formData.append("casSelecionadas", JSON.stringify(casSelecionadas));
      formData.append("criativosUrls", JSON.stringify(urlsUpload));

      const res = await fetch("/api/facebook/campanhas", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Falha na requisição (Erro ${res.status})`);
      if (!res.body) throw new Error("Falha ao iniciar o stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.pct !== undefined) setProgresso(ev.pct);
            if (ev.mensagem) setLogItems(prev => [...prev, { tipo: ev.tipo, mensagem: ev.mensagem, pct: ev.pct, ok: ev.tipo !== "erro" }]);
            if (ev.tipo === "concluido") { setConcluido(true); setProgresso(100); }
            if (ev.tipo === "erro") { setErroFinal(ev.mensagem); }
          } catch { }
        }
      }
    } catch (err: any) {
      setErroFinal(err.message || "Erro de conexão.");
    } finally {
      clearTimeout(turboTimer);
      setLancando(false);
    }
  };

  const salvarWorkspace = () => {
    const id = wsForm.id || `ws_${Date.now()}`;
    const novoWs = { ...wsForm, id };
    let novaLista;
    if (wsForm.id) {
      novaLista = workspacesList.map(w => w.id === id ? novoWs : w);
    } else {
      novaLista = [...workspacesList, novoWs];
    }
    setWorkspacesList(novaLista);
    localStorage.setItem("autoads_workspaces_list", JSON.stringify(novaLista));
    setIsModalWsOpen(false);
  };

  const ativarWorkspace = (ws: Workspace) => {
    setWsAtivo(ws);
    localStorage.setItem("autoads_workspace_dados", JSON.stringify(ws));
    if (ws.link) setLink(ws.link);
    if (ws.pixelId) setPixelId(ws.pixelId);
    if (ws.parametrosUtm) setParametrosUtm(ws.parametrosUtm);

    const statusText = ws.status === 'validada' ? 'VALIDADA' : 'TESTE';
    setNomeCampanha(`[${statusText}] ${ws.nomeProduto} - ${ws.nomeOferta}`);

    setAbaAtiva('lancador');
  };

  // INPUT PREMIUM AESTHETICS
  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none placeholder:text-gray-400 shadow-inner";

  if (status === "loading") {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-[4px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute w-20 h-20 border border-purple-500/30 rounded-full animate-pulse-slow" />
        </div>
      </div>
    );
  }
  if (!session) return <LandingPage />;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg px-4 py-3 text-sm text-white transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}>
          {toast.message}
        </div>
      )}
      {/* Floating neon blobs in background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-blue-600/[0.03] rounded-full blur-[250px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-600/[0.03] rounded-full blur-[250px] animate-float-delayed" />
      </div>

      {/* BARRA LATERAL ANTIGRAVITY */}
      <aside className="cursor-pointer w-[340px] bg-slate-950 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 z-20 shadow-2xl relative">
        <div className="h-24 flex items-center px-8 border-b border-white/5">
          <span className="text-sm font-black tracking-widest text-white">AUTO<span className="text-blue-500">ADS</span></span>
          <span className="ml-3 text-[9px] font-bold tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase">
            v2.0
          </span>
        </div>

        {/* Navigation Menu containing EXCLUSIVELY the 4 required options */}
        <nav className="flex-1 px-4 py-8 space-y-2.5">
          <button onClick={() => setAbaAtiva('workspaces')}
            className={`w-full flex items-center gap-2 px-5 py-4 rounded-2xl text-base transition-all duration-300 group ${abaAtiva === 'workspaces' ? "bg-slate-800 border-l-4 border-blue-600 border-t-0 border-r-0 border-b-0 font-black text-blue-500 rounded-none" : "font-bold text-slate-500 hover:text-white hover:bg-white/[0.03]"}`}>
            {IconWorkspace} Sua Oferta
          </button>

          <button onClick={() => setAbaAtiva('gestao')}
            className={`w-full flex items-center gap-2 px-5 py-4 rounded-2xl text-base transition-all duration-300 group ${abaAtiva === 'gestao' ? "bg-slate-800 border-l-4 border-blue-600 border-t-0 border-r-0 border-b-0 font-black text-blue-500 rounded-none" : "font-bold text-slate-500 hover:text-white hover:bg-white/[0.03]"}`}>
            {IconManager} Gerenciador de Campanha
          </button>

          <button onClick={() => setAbaAtiva('lancador')}
            className={`w-full flex items-center gap-2 px-5 py-4 rounded-2xl text-base transition-all duration-300 group ${abaAtiva === 'lancador' ? "bg-slate-800 border-l-4 border-blue-600 border-t-0 border-r-0 border-b-0 font-black text-blue-500 rounded-none" : "font-bold text-slate-500 hover:text-white hover:bg-white/[0.03]"}`}>
            {IconCreator} Crie sua Campanha
          </button>

          <button onClick={() => setAbaAtiva('biblioteca')}
            className={`w-full flex items-center gap-2 px-5 py-4 rounded-2xl text-base transition-all duration-300 group ${abaAtiva === 'biblioteca' ? "bg-slate-800 border-l-4 border-blue-600 border-t-0 border-r-0 border-b-0 font-black text-blue-500 rounded-none" : "font-bold text-slate-500 hover:text-white hover:bg-white/[0.03]"}`}>
            {IconFolder} Seus Criativos
          </button>
        </nav>

        <div className="p-3 border-t border-white/5 bg-slate-950/20">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
            <img src={session.user?.image || ""} alt="Perfil" className="w-12 h-12 rounded-full ring-2 ring-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-white">{session.user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate font-mono">{session.user?.email}</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="magnetic-btn mt-4 w-full text-xs font-bold text-slate-500 hover:text-blue-400 py-3 transition-colors uppercase tracking-widest border border-white/5 rounded-xl hover:bg-blue-500/5">
            Desconectar
          </button>
        </div>
      </aside>

      {/* CENTRAL CONTENT PANEL WITH TAB TRANSITIONS */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">

        {/* HEADER MAIOR */}
        <header className="h-24 flex items-center justify-between px-8 bg-white/80 backdrop-blur-xl border-b border-gray-200 backdrop-blur-xl border-b border-gray-200 shrink-0 z-10">
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight uppercase">
              {abaAtiva === 'lancador' ? "Lançador em Massa" : abaAtiva === 'gestao' ? "Gerenciador de Campanha" : abaAtiva === 'biblioteca' ? "Cofre de Criativo" : "Workspace"}
            </h1>
            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">
              {abaAtiva === 'lancador' ? "Crie dezenas de campanhas via Meta API" : abaAtiva === 'gestao' ? "Central de Monitoramento" : abaAtiva === 'biblioteca' ? "Biblioteca de Criativos na Nuvem" : "Perfis de Configuração e Ofertas"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {wsAtivo && (
              <div className="flex items-center gap-3 bg-gray-50 border border-blue-500/20 px-5 py-2.5 rounded-full shadow-sm">
                <span className={`w-2 h-2 rounded-full ${wsAtivo.status === 'validada' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{wsAtivo.nomeOferta}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-200 px-5 py-2.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />Conectado
            </div>
          </div>
        </header>

        {/* ────────────────────────────────────────────────────────────────────────
            VIEW 1: LANÇADOR EM MASSA (Originally Mesa de Operações)
            ──────────────────────────────────────────────────────────────────────── */}
        <div key={`tab-${abaAtiva}-lancador`} className={`flex-1 overflow-y-auto p-2 md:p-2 scroll-smooth ${abaAtiva === 'lancador' ? 'block animate-fade-in' : 'hidden'}`}>
          <div className="w-full max-w-[1600px] mx-auto flex flex-col xl:flex-row items-start gap-3">

            <div className="flex-1 w-full min-w-0 space-y-5">
              {/* Steps indicators */}
              <div className="flex items-center bg-white shadow-sm backdrop-blur-md border border-gray-200 p-3 rounded-2xl shadow-2xl overflow-x-auto custom-scrollbar">
                {[1, 2, 3, 4, 5, 6].map((num, idx) => (
                  <div key={num} className="flex items-center flex-1 last:flex-none cursor-pointer" onClick={() => { if (num < passoAtual) setPassoAtual(num) }}>
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all duration-500 ${passoAtual > num ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : passoAtual === num ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105'
                          : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                        {passoAtual > num ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg> : <span>{passoIcones[idx]}</span>}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${passoAtual === num ? 'text-blue-500' : passoAtual > num ? 'text-emerald-400' : 'text-gray-400'}`}>{passoLabels[idx]}</span>
                    </div>
                    {idx < 5 && <div className={`flex-1 h-0.5 mx-4 mb-4 rounded-full transition-all duration-700 ${passoAtual > num ? 'bg-emerald-500/40' : 'bg-gray-100'}`} />}
                  </div>
                ))}
              </div>

              <GlassPanel className="overflow-hidden">
                {/* PASSO 1: CONTAS */}
                {passoAtual === 1 && (
                  <div className="bg-slate-50/50 max-w-7xl mx-auto px-4 py-8 animate-fade-in">
                    <div className="mb-8 bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium w-full">
                      <strong>Dica do sistema:</strong> Selecione as Business Managers e as contas de anúncio onde as campanhas serão criadas.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* MAIN CARD (8 colunas) */}
                      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900">Seleção Multi-Contas</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Para onde vamos enviar estas campanhas?</p>
                          </div>
                          {casSelecionadas.length > 0 && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-full font-bold text-xs shadow-sm">
                              {casSelecionadas.length} CA SELECIONADA(S)
                            </span>
                          )}
                        </div>

                        {carregandoBMs ? (
                          <div className="flex items-center justify-center py-12 text-slate-500 text-sm font-semibold gap-3">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            Sincronizando com a Meta API...
                          </div>
                        ) : (
                          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {bms.map(bm => {
                              const isActive = bmExpandida === bm.id;
                              return (
                                <div key={bm.id} className={`border border-slate-200 rounded-xl p-5 mb-4 hover:border-blue-400 transition-colors ${isActive ? 'border-2 border-blue-600 bg-blue-50/30' : 'bg-white'}`}>
                                  <button type="button" onClick={() => setBmExpandida(isActive ? null : bm.id)} className="w-full flex items-center justify-between outline-none">
                                    <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-blue-600">BM</span>
                                      </div>
                                      <div className="text-left">
                                        <p className="text-lg font-semibold text-slate-900">{bm.name}</p>
                                        <p className="text-xs text-slate-500 font-medium uppercase mt-1 tracking-wider">{bm.contas.length} Contas</p>
                                      </div>
                                    </div>
                                    <svg className={`w-6 h-6 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                  </button>

                                  {isActive && (
                                    <div className="mt-5 pt-5 border-t border-slate-200 space-y-3">
                                      {bm.contas.map((ca: any) => {
                                        const selecionada = casSelecionadas.find(c => c.caId === ca.id);
                                        return (
                                          <div key={ca.id} className={`rounded-xl border transition-all ${selecionada ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}>
                                            <button type="button" onClick={() => toggleCA(ca, bm)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                                              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border-2 ${selecionada ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                                {selecionada && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className={`text-base font-medium truncate ${selecionada ? 'text-blue-900' : 'text-slate-700'}`}>{ca.name}</p>
                                              </div>
                                            </button>
                                            {selecionada && ca.paginas?.length > 0 && (
                                              <div className="px-5 pb-4 ml-9">
                                                <select value={selecionada.paginaId} onChange={e => setPaginaCA(ca.id, e.target.value)} onClick={e => e.stopPropagation()} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                                                  {ca.paginas.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* SIDE PANEL (4 colunas) */}
                      <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                          <h3 className="text-lg font-bold text-slate-900 mb-6">Poder de Fogo</h3>
                          <div className="space-y-6">
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{casSelecionadas.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Contas de Anúncio</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{Number(quantidadeCampanhas) || 0}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Campanhas Base</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{totalConjuntos}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Total de Conjuntos</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{imagens.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Mídias p/ Disparo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASSO 2: ESTRUTURA */}
                {passoAtual === 2 && (
                  <div className="bg-slate-50/50 max-w-7xl mx-auto px-4 py-8 animate-fade-in">
                    <div className="mb-8 bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium w-full">
                      <strong>Dica do sistema:</strong> Defina as bases: objetivo, dinheiro e multiplicadores.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* MAIN CARD (8 colunas) */}
                      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold text-slate-900">Estrutura da Campanha</h2>
                          <p className="text-sm font-medium text-slate-500 mt-1">Configurações principais da sua estrutura</p>
                        </div>
                        
                        <div className="space-y-10">
                          {/* Identificação e Objetivo */}
                          <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">1. Identificação e Objetivo</h3>
                            <div className="space-y-6">
                              <input type="text" value={nomeCampanha} onChange={e => setNomeCampanha(e.target.value)} placeholder="Nome Base (Ex: [VENDAS] Produto X)" className={inputClass} />
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {OBJETIVOS.map(obj => (
                                  <button key={obj.value} onClick={() => setObjetivo(obj.value as Objetivo)} className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${objetivo === obj.value ? 'bg-blue-500/5 border-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${objetivo === obj.value ? 'bg-blue-600 text-white' : 'bg-white shadow-sm text-slate-500'}`}>{obj.icon}</div>
                                    <p className={`text-[10px] font-black tracking-widest uppercase text-center ${objetivo === obj.value ? 'text-slate-900' : 'text-slate-500'}`}>{obj.label}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </section>

                          {/* Painel de Orçamento */}
                          <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">2. Painel de Orçamento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                              {/* CBO/ABO */}
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Distribuição de Verba</label>
                                <div className="inline-flex p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
                                  <button onClick={() => setTipoCampanha('CBO')} className={`flex-1 px-6 py-2 rounded-md text-sm font-medium transition-all ${tipoCampanha === 'CBO' ? 'shadow-sm bg-white text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Campanha (CBO)</button>
                                  <button onClick={() => setTipoCampanha('ABO')} className={`flex-1 px-6 py-2 rounded-md text-sm font-medium transition-all ${tipoCampanha === 'ABO' ? 'shadow-sm bg-white text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Conjunto (ABO)</button>
                                </div>
                              </div>
                              {/* Input Orçamento */}
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Orçamento Diário</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-slate-500 font-bold text-lg">R$</span>
                                  </div>
                                  <input type="number" value={orcamento} onChange={e => setOrcamento(e.target.value)} placeholder="Seu orçamento aqui" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                                </div>
                              </div>
                            </div>
                          </section>

                          {/* Multiplicador & Lances */}
                          <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">3. Multiplicador & Lances</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4 block">Multiplicador de Estrutura</label>
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Campanhas</label>
                                    <input type="number" min="1" value={quantidadeCampanhas} onChange={e => setQuantidadeCampanhas(e.target.value)} className={inputClass} />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Conjuntos por Camp.</label>
                                    <input type="number" min="1" value={quantidadeConjuntos} onChange={e => setQuantidadeConjuntos(e.target.value)} className={inputClass} />
                                  </div>
                                </div>
                              </div>
                              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4 block">Estratégia de Lance (Bid Strategy)</label>
                                <select value={estrategiaLance} onChange={e => setEstrategiaLance(e.target.value as EstrategiaLance)} className={inputClass}>
                                  {ESTRATEGIAS_LANCE.map(est => <option key={est.value} value={est.value}>{est.label}</option>)}
                                </select>
                                {estrategiaLance !== 'LOWEST_COST' && (
                                  <div className="mt-4 animate-slide-up">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Valor do Limite / ROAS (R$ / X)</label>
                                    <input type="number" step="0.1" value={valorLance} onChange={e => setValorLance(e.target.value)} placeholder="Ex: 20.00" className={inputClass} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* SIDE PANEL (4 colunas) */}
                      <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                          <h3 className="text-lg font-bold text-slate-900 mb-6">Poder de Fogo</h3>
                          <div className="space-y-6">
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{casSelecionadas.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Contas de Anúncio</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{Number(quantidadeCampanhas) || 0}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Campanhas Base</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{totalConjuntos}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Total de Conjuntos</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{imagens.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Mídias p/ Disparo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASSO 3: RASTREAMENTO */}
                {passoAtual === 3 && (
                  <div className="bg-slate-50/50 max-w-7xl mx-auto px-4 py-8 animate-fade-in">
                    <div className="mb-8 bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium w-full">
                      <strong>Dica do sistema:</strong> Para onde vamos mandar os clientes e como vamos rastrear?
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* MAIN CARD (8 colunas) */}
                      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold text-slate-900">Rastreamento & Destino</h2>
                          <p className="text-sm font-medium text-slate-500 mt-1">Configure as URLs e o rastreamento via Pixel/UTM.</p>
                        </div>
                        
                        <div className="space-y-10">
                          {/* Ponto de Conversão */}
                          <section>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold mb-4">1</div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-6">Ponto de Conversão</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Local de Conversão</label>
                                <select value={localConversao} onChange={e => setLocalConversao(e.target.value as LocalConversao)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all">
                                  {LOCAIS_CONVERSAO.map(loc => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Link de Destino</label>
                                <input type="text" value={link} onChange={e => setLink(e.target.value)} placeholder="https://seudominio.com/oferta" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                              </div>
                            </div>
                            
                            {['WHATSAPP', 'MESSENGER', 'INSTAGRAM_DIRECT'].includes(localConversao) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-slide-up">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">DDI (Código do País)</label>
                                  <input type="text" value={whatsappDdi} onChange={e => setWhatsappDdi(e.target.value)} placeholder="+55" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Número do WhatsApp / Telefone</label>
                                  <input type="text" value={whatsappNumero} onChange={e => setWhatsappNumero(e.target.value)} placeholder="11999999999" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                                </div>
                              </div>
                            )}
                          </section>

                          {/* Inteligência de Dados */}
                          <section>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold mb-4">2</div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-6">Inteligência de Dados (Pixel & UTM)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">ID do Pixel Meta</label>
                                <input type="text" value={pixelId} onChange={handlePixelId} placeholder="123456789098765" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-blue-600 font-mono focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Parâmetros UTM (Sem o ?)</label>
                                <input type="text" value={parametrosUtm} onChange={e => setParametrosUtm(e.target.value)} placeholder="utm_source=fb&utm_medium=cpc" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 font-mono focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* SIDE PANEL (4 colunas) */}
                      <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                          <h3 className="text-lg font-bold text-slate-900 mb-6">Poder de Fogo</h3>
                          <div className="space-y-6">
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{casSelecionadas.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Contas de Anúncio</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{Number(quantidadeCampanhas) || 0}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Campanhas Base</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{totalConjuntos}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Total de Conjuntos</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{imagens.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Mídias p/ Disparo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASSO 4: PÚBLICO */}
                {passoAtual === 4 && (
                  <div className="bg-slate-50/50 max-w-7xl mx-auto px-4 py-8 animate-fade-in">
                    <div className="mb-8 bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium w-full">
                      <strong>Dica do sistema:</strong> Quem vai ver os seus anúncios na internet? Configure o público ideal.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* MAIN CARD (8 colunas) */}
                      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold text-slate-900">Público Alvo</h2>
                          <p className="text-sm font-medium text-slate-500 mt-1">Defina a demografia e a localização das suas campanhas.</p>
                        </div>
                        
                        <div className="space-y-10">
                          {/* Demografia Base */}
                          <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Demografia Base</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Idade Mínima</label>
                                <input type="number" min="18" max="65" value={idadeMin} onChange={e => setIdadeMin(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Idade Máxima</label>
                                <input type="number" min="18" max="65" value={idadeMax} onChange={e => setIdadeMax(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Gênero</label>
                                <select value={genero} onChange={e => setGenero(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none">
                                  <option value="todos">Todos os Gêneros</option>
                                  <option value="homens">Somente Homens</option>
                                  <option value="mulheres">Somente Mulheres</option>
                                </select>
                              </div>
                            </div>
                          </section>

                          {/* Localização Geográfica */}
                          <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Localização Geográfica</h3>
                            <div className="flex flex-wrap gap-3">
                              {PAISES_POPULARES.map(p => {
                                const isActive = paises.includes(p.value);
                                return (
                                  <button key={p.value} onClick={() => togglePais(p.value)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-sm border border-blue-600' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                    {p.label}
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* SIDE PANEL (4 colunas) */}
                      <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                          <h3 className="text-lg font-bold text-slate-900 mb-6">Poder de Fogo</h3>
                          <div className="space-y-6">
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{casSelecionadas.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Contas de Anúncio</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{Number(quantidadeCampanhas) || 0}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Campanhas Base</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{totalConjuntos}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Total de Conjuntos</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{imagens.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Mídias p/ Disparo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASSO 5: IA META */}
                {passoAtual === 5 && (
                  <div className="bg-slate-50/50 max-w-7xl mx-auto px-4 py-8 animate-fade-in">
                    <div className="mb-8 bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium w-full">
                      <strong>Dica do sistema:</strong> Potencialize seus resultados ativando o algoritmo Advantage+.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* MAIN CARD (8 colunas) */}
                      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold text-slate-900">Inteligência Meta</h2>
                          <p className="text-sm font-medium text-slate-500 mt-1">Configure os parâmetros da inteligência artificial Advantage+.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-5 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-blue-200 transition-all duration-300">
                            <div className="pr-4">
                              <h4 className="font-semibold text-slate-900">Público Advantage+</h4>
                              <p className="text-sm text-slate-500 mt-1">A Meta encontrará pessoas fora das suas restrições demográficas se houver alta probabilidade de conversão.</p>
                            </div>
                            <button type="button" onClick={() => setAdvantageAudience(!advantageAudience)} className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${advantageAudience ? 'bg-blue-600' : 'bg-slate-300'}`}>
                              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${advantageAudience ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-5 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-blue-200 transition-all duration-300">
                            <div className="pr-4">
                              <h4 className="font-semibold text-slate-900">Posicionamentos Advantage+</h4>
                              <p className="text-sm text-slate-500 mt-1">Distribuição automática e inteligente de orçamento entre Instagram, Facebook, Reels, Stories, etc.</p>
                            </div>
                            <button type="button" onClick={() => setAdvantagePlacement(!advantagePlacement)} className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${advantagePlacement ? 'bg-blue-600' : 'bg-slate-300'}`}>
                              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${advantagePlacement ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-5 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-blue-200 transition-all duration-300">
                            <div className="pr-4">
                              <h4 className="font-semibold text-slate-900">Criativo Advantage+</h4>
                              <p className="text-sm text-slate-500 mt-1">Otimiza brilho, contraste e aplica melhorias visuais e textos automáticos na mídia do seu anúncio.</p>
                            </div>
                            <button type="button" onClick={() => setAdvantageCreative(!advantageCreative)} className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${advantageCreative ? 'bg-blue-600' : 'bg-slate-300'}`}>
                              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${advantageCreative ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SIDE PANEL (4 colunas) */}
                      <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                          <h3 className="text-lg font-bold text-slate-900 mb-6">Poder de Fogo</h3>
                          <div className="space-y-6">
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{casSelecionadas.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Contas de Anúncio</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{Number(quantidadeCampanhas) || 0}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Campanhas Base</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{totalConjuntos}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Total de Conjuntos</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{imagens.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Mídias p/ Disparo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASSO 6: CRIATIVOS */}
                {passoAtual === 6 && (
                  <div className="bg-slate-50/50 max-w-7xl mx-auto px-4 py-8 animate-fade-in">
                    <div className="mb-8 bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium w-full">
                      <strong>Dica do sistema:</strong> Escreva a copy, importe os arquivos e inicie o lançamento.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* MAIN CARD (8 colunas) */}
                      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold text-slate-900">Criativos & Disparo</h2>
                          <p className="text-sm font-medium text-slate-500 mt-1">Última etapa. Adicione as mídias e lance suas campanhas.</p>
                        </div>
                        
                        <div className="space-y-8 flex-1">
                          {/* Seção 1: Seleção de Mídias */}
                          <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">1. Selecionar Mídias</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <button onClick={() => setIsModalCofreOpen(true)} className="flex-1 border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 rounded-xl p-6 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                  {IconCloud}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Abrir Cofre</p>
                                  <p className="text-xs font-semibold text-slate-500 mt-1">Biblioteca Nuvem</p>
                                </div>
                              </button>

                              <div className="flex-1 relative group cursor-pointer border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3">
                                <input type="file" multiple accept="image/*,video/*" onChange={handleImagens} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Upload PC</p>
                                  <p className="text-xs font-semibold text-slate-500 mt-1">Arrastar Arquivos</p>
                                </div>
                              </div>
                            </div>

                            {imagens.length > 0 && (
                              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Fila de Disparo ({imagens.length} Arquivos)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {imagens.map((file, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-200 group">
                                      {file.type.startsWith('video/') ? (
                                        <video src={previewUrls[idx]} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                      ) : (
                                        <img src={previewUrls[idx]} alt="Preview" className="w-full h-full object-cover" />
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                                      <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-white truncate z-10">{file.name}</span>
                                      <button onClick={() => removerImagem(idx)} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-xs">✕</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </section>

                          {/* Seção 2: Nomenclatura */}
                          <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">2. Nomenclatura</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <button onClick={() => setRegraNomeacao('arquivo')} className={`flex-1 p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${regraNomeacao === 'arquivo' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regraNomeacao === 'arquivo' ? 'border-blue-600' : 'border-slate-400'}`}>
                                    {regraNomeacao === 'arquivo' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                  </div>
                                  <span className={`text-sm font-bold uppercase tracking-widest ${regraNomeacao === 'arquivo' ? 'text-blue-700' : 'text-slate-700'}`}>Nome do Arquivo</span>
                                </div>
                                <span className="text-xs text-slate-500 ml-8">Ex: video_venda.mp4</span>
                              </button>
                              <button onClick={() => setRegraNomeacao('sistema')} className={`flex-1 p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${regraNomeacao === 'sistema' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regraNomeacao === 'sistema' ? 'border-blue-600' : 'border-slate-400'}`}>
                                    {regraNomeacao === 'sistema' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                  </div>
                                  <span className={`text-sm font-bold uppercase tracking-widest ${regraNomeacao === 'sistema' ? 'text-blue-700' : 'text-slate-700'}`}>Padrão Inteligente</span>
                                </div>
                                <span className="text-xs text-slate-500 ml-8">Ex: [AD 01] - Conversão</span>
                              </button>
                            </div>
                          </section>

                          {/* Seção 3: Textos do Anúncio (Copy) */}
                          <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">3. Textos do Anúncio (Copy)</h3>
                            <div className="space-y-6">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Texto Principal (Copy)</label>
                                <textarea value={textoAnuncio} onChange={e => setTextoAnuncio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all min-h-[120px] resize-y outline-none" placeholder="Escreva a copy persuasiva aqui..."></textarea>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Título (Headline)</label>
                                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" placeholder="Ex: Método Comprovado" />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição (Opcional)</label>
                                  <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none" placeholder="Ex: Mais de 10.000 alunos" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Botão de Ação (Call to Action)</label>
                                <select value={callToAction} onChange={e => setCallToAction(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 transition-all outline-none">
                                  <option value="SHOP_NOW">Comprar Agora</option>
                                  <option value="LEARN_MORE">Saiba Mais</option>
                                  <option value="SIGN_UP">Cadastre-se</option>
                                  <option value="SUBSCRIBE">Assinar</option>
                                  <option value="DOWNLOAD">Baixar</option>
                                  <option value="CONTACT_US">Fale Conosco</option>
                                </select>
                              </div>
                            </div>
                          </section>
                        </div>

                        {/* Botão de Disparo */}
                        <div className="mt-8 pt-8 border-t border-slate-100">
                          <button 
                            type="button" 
                            onClick={handleLancar} 
                            disabled={!podeLancar || lancando} 
                            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-extrabold text-xl py-5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {lancando ? (
                              <>
                                <span className="w-6 h-6 rounded-full border-4 border-white/30 border-t-white animate-spin"></span>
                                Subindo Campanhas...
                              </>
                            ) : (
                              <>
                                Subir Campanhas!
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* SIDE PANEL (4 colunas) */}
                      <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                          <h3 className="text-lg font-bold text-slate-900 mb-6">Poder de Fogo</h3>
                          <div className="space-y-6">
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{casSelecionadas.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Contas de Anúncio</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{Number(quantidadeCampanhas) || 0}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Campanhas Base</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{totalConjuntos}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Total de Conjuntos</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-4xl font-extrabold text-blue-600">{imagens.length}</span>
                              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Mídias p/ Disparo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(lancando || concluido || erroFinal) && (
                  <div className="m-6 p-3 bg-white shadow-sm border border-gray-200 rounded-3xl shadow-2xl animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-black uppercase text-gray-900 flex items-center gap-3">
                        {lancando && <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />}
                        {concluido ? "Disparo Concluído" : "Processando..."}
                      </span>
                      <span className="text-3xl font-black font-mono text-blue-500">{progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden border border-gray-200">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300" style={{ width: `${progresso}%` }} />
                    </div>
                    <div ref={logRef} className="bg-gray-900/60 border border-gray-200 rounded-2xl p-3 h-60 overflow-y-auto space-y-2 font-mono text-xs text-gray-500 shadow-inner scroll-smooth custom-scrollbar">
                      {logItems.map((item, i) => (<div key={i} className={item.tipo === "erro" ? "text-blue-500 font-bold" : ""}><span className="mr-2 text-blue-500">&gt;&gt;</span>{item.mensagem}</div>))}
                    </div>
                  </div>
                )}

                <div className="px-8 py-6 border-t border-gray-200 bg-gray-50/20 flex items-center justify-between">
                  {passoAtual > 1 ? (<button type="button" onClick={() => setPassoAtual(p => Math.max(p - 1, 1))} className="magnetic-btn px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-900 text-sm font-bold uppercase tracking-widest transition-all">← Voltar</button>) : <div />}
                  {passoAtual < TOTAL_PASSOS && (
                    <button type="button" onClick={() => setPassoAtual(p => Math.min(p + 1, TOTAL_PASSOS))} disabled={!podeAvançar()} className="magnetic-btn px-4 py-2 bg-white text-black hover:bg-slate-200 disabled:opacity-30 rounded-xl text-sm font-bold uppercase tracking-widest transition-all">Próximo →</button>
                  )}
                </div>
              </GlassPanel>
            </div>

            <div className="w-full xl:w-[280px] shrink-0 xl:sticky xl:top-28 space-y-4">
              <div className="antigravity-glass rounded-2xl p-2 shadow-2xl relative overflow-hidden">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">Poder de Fogo Atual</h3>
                <div className="flex flex-col gap-3">
                  <MetricCard label="Contas de Anúncio (CA)" value={casSelecionadas.length} accent="red" sub="Multi-BM configuradas" />
                  <MetricCard label="Campanhas Base" value={Number(quantidadeCampanhas) || 0} accent="purple" sub="Por Conta Ativa" />
                  <MetricCard label="Total Conjuntos" value={totalConjuntos} accent="blue" sub="Volume de disparo" />
                  <MetricCard label="Mídias p/ Disparo" value={imagens.length} accent="green" sub="Arquivos na fila" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────
            VIEW 2: GERENCIADOR DE CAMPANHA (Originally Central de Comando / Gestão)
            ──────────────────────────────────────────────────────────────────────── */}
        <div key={`tab-${abaAtiva}-gestao`} className={`flex-1 overflow-hidden flex flex-col p-8 relative ${abaAtiva === 'gestao' ? 'flex animate-fade-in' : 'hidden'}`}>
          <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Central de Comando</h2>
                <p className="text-xs font-bold text-gray-500 mt-1">Hierarquia de campanhas do Facebook Ads.</p>
              </div>

              {/* BOTÃO PARA ABRIR O DIÁRIO DE BORDO DO ROBÔ */}
              <button onClick={() => setIsDrawerLogOpen(true)} className="magnetic-btn shrink-0 flex items-center gap-3 bg-gray-100 border border-purple-500/20 hover:bg-purple-500/10 text-gray-900 font-black text-sm px-6 py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] uppercase tracking-widest">
                <div className="relative">
                  {IconRobot}
                  <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                </div>
                Diário do Sentinela
              </button>
            </div>

            <GlassPanel className="flex-1 overflow-hidden flex flex-col border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4 z-20">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest mb-4">
                    <span onClick={() => { setGestaoNivel('campanhas'); setGestaoCampanhaAtiva(null); setGestaoConjuntoAtivo(null); }} className="text-gray-500 hover:text-gray-900 cursor-pointer uppercase transition-colors flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      Mesa de Comando
                    </span>

                    {gestaoCampanhaAtiva && (
                      <>
                        <span className="text-gray-600">/</span>
                        <span onClick={() => { setGestaoNivel('conjuntos'); setGestaoConjuntoAtivo(null); }} className={`uppercase cursor-pointer transition-colors ${gestaoNivel === 'conjuntos' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-900'}`}>
                          {gestaoCampanhaAtiva.name}
                        </span>
                      </>
                    )}

                    {gestaoConjuntoAtivo && (
                      <>
                        <span className="text-gray-600">/</span>
                        <span className="text-blue-500 uppercase">{gestaoConjuntoAtivo.name}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm font-black uppercase tracking-widest">
                    <button onClick={() => { setGestaoNivel('campanhas'); setGestaoCampanhaAtiva(null); setGestaoConjuntoAtivo(null); }} className={`pb-3 border-b-2 transition-all ${gestaoNivel === 'campanhas' ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Campanhas</button>
                    <button onClick={() => { if (gestaoCampanhaAtiva) { setGestaoNivel('conjuntos'); setGestaoConjuntoAtivo(null); } }} className={`pb-3 border-b-2 transition-all ${gestaoNivel === 'conjuntos' ? 'border-purple-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} ${!gestaoCampanhaAtiva ? 'opacity-30 cursor-not-allowed' : ''}`}>Conjuntos</button>
                    <button onClick={() => { if (gestaoConjuntoAtivo) setGestaoNivel('anuncios'); }} className={`pb-3 border-b-2 transition-all ${gestaoNivel === 'anuncios' ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} ${!gestaoConjuntoAtivo ? 'opacity-30 cursor-not-allowed' : ''}`}>Anúncios</button>
                  </div>
                </div>

                <div className="relative mb-1" ref={dropdownRef}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center justify-between gap-4 bg-white shadow-sm border border-gray-200 hover:border-gray-300 p-2 rounded-xl shadow-inner min-w-[280px] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <span className="text-[10px] font-black text-blue-500">CA</span>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                          {activeAdAccounts.length === 0 ? "Selecionar Contas" : activeAdAccounts.length === 1 ? activeAdAccounts[0].caName : `${activeAdAccounts.length} Contas`}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Visão Multi-Contas API</p>
                      </div>
                    </div>
                    {IconChevronDown}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-[350px] bg-gray-50/95 border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-slide-up duration-200">
                      <div className="p-4 border-b border-gray-200 bg-white">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Selecione as contas para operar</p>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {bms.map(bm => (
                          <div key={bm.id} className="mb-4 last:mb-0">
                            <p className="px-2 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{bm.name}</p>
                            {bm.contas.map((ca: any) => {
                              const isSelected = activeAdAccounts.some(acc => acc.caId === ca.id);
                              return (
                                <button key={ca.id} onClick={() => toggleGestaoAccount({ caId: ca.id, caName: ca.name, bmName: bm.name, bmId: bm.id, paginaId: "" })} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${isSelected ? 'bg-blue-500/10' : 'hover:bg-gray-50'}`}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-500' : 'border-slate-700 bg-slate-950/40'}`}>
                                    {isSelected && <svg className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <div className="text-left truncate">
                                    <p className={`text-xs font-black truncate ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{ca.name}</p>
                                    <p className="text-[9px] font-mono text-gray-400 mt-0.5">ID: {ca.id}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      {activeAdAccounts.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-white">
                          <button onClick={() => setActiveAdAccounts([])} className="w-full py-2.5 rounded-lg bg-gray-50 hover:bg-white/[0.05] text-[10px] font-black uppercase text-gray-500 hover:text-gray-900 transition-colors">Limpar Seleção</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col relative z-10 bg-gray-50/20">
                {gestaoLoading ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/60 backdrop-blur-sm">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Sincronizando Motores da API...</p>
                  </div>
                ) : activeAdAccounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 mb-6"><svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">Ponto de Observação Vazio</h3>
                    <p className="text-sm text-gray-500 max-w-md">Selecione uma ou mais contas de anúncio no menu superior para puxar os dados de monitoramento.</p>
                  </div>
                ) : dataError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <p className="text-blue-500 font-bold text-lg">{dataError}</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {(gestaoNivel === 'campanhas' || gestaoNivel === 'conjuntos') && (
                      <table className="w-full text-left border-collapse font-sans">
                        <thead className="sticky top-0 bg-slate-900 z-10">
                          <tr className="border-b border-slate-800">
                            <th className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap w-40">Status (Meta)</th>
                            <th className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nome do {gestaoNivel === 'campanhas' ? 'Campanha' : 'Conjunto'}</th>
                            <th className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Orçamento</th>
                            <th className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Defesa Automática</th>
                            <th className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(gestaoNivel === 'campanhas' ? campaigns : adSets).map((item, index, arr) => {
                            const roboAtivo = robosAtivos[item.id];
                            return (
                              <tr key={item.id} className={`bg-slate-900/50 hover:bg-slate-800 transition-colors duration-150 group border-b border-slate-800 ${index === arr.length - 1 ? 'border-b-0' : ''}`}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm"><StatusIndicator status={item.status} /></td>
                                <td className="px-3 py-2 text-sm">
                                  <p onClick={() => {
                                    if (gestaoNivel === 'campanhas') { setGestaoCampanhaAtiva(item as Campaign); setGestaoNivel('conjuntos'); }
                                    else if (gestaoNivel === 'conjuntos') { setGestaoConjuntoAtivo(item as AdSet); setGestaoNivel('anuncios'); }
                                  }} className="text-base font-semibold text-white hover:text-blue-500 cursor-pointer transition-colors inline-block truncate max-w-[400px]">{item.name}</p>

                                  <div className="flex items-center gap-3 mt-1.5">
                                    <p className="text-xs text-gray-400 font-mono">ID: {item.id}</p>
                                    {item._originName && (
                                      <span className="bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                                        CA: {item._originName}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  <span className="text-base font-bold text-white">{formatCurrency((item as any).daily_budget || (item as any).lifetime_budget)}</span>
                                </td>

                                <td className="px-3 py-2 text-center">
                                  <button onClick={() => abrirModalRobo(item)} className={`w-6 h-6 flex items-center justify-center transition-colors relative group/robo mx-auto ${roboAtivo ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-white'}`} title="Configurar Robô Sentinela">
                                    {roboAtivo && (
                                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-black"></span>
                                      </span>
                                    )}
                                    {IconRobot}
                                  </button>
                                </td>

                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button type="button" onClick={() => handleToggleStatusReal(item, gestaoNivel === 'campanhas' ? 'campaign' : 'adset')} className={`relative w-12 h-6 rounded-full shrink-0 transition-all duration-300 focus:outline-none ${item.status === 'ACTIVE' ? 'bg-[#22C55E]' : 'bg-[#6B7280]'}`}>
                                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${item.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <button onClick={() => setItemEditando({ ...item, tipo: gestaoNivel })} className="border border-gray-600 text-gray-300 rounded-lg px-3 py-1.5 text-xs hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-200">
                                      Editar Campanha
                                    </button>
                                    <button onClick={() => {
                                      if (gestaoNivel === 'campanhas') { setGestaoCampanhaAtiva(item as Campaign); setGestaoNivel('conjuntos'); }
                                      else if (gestaoNivel === 'conjuntos') { setGestaoConjuntoAtivo(item as AdSet); setGestaoNivel('anuncios'); }
                                    }} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:scale-105 transition-all duration-200">
                                      Ver {gestaoNivel === 'campanhas' ? 'Conjuntos' : 'Anúncios'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {gestaoNivel === 'anuncios' && (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 font-sans">
                        {ads.map((ad) => (
                          <div key={ad.id} className="cursor-pointer bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden flex flex-col group hover:border-blue-500/20 hover:shadow-md transition-all">
                            <div className="aspect-video bg-gray-50 border-b border-gray-200 relative flex items-center justify-center">

                              {(ad.creative?.thumbnail_url || ad.creative?.image_url) ? (
                                <>
                                  <img src={ad.creative.thumbnail_url || ad.creative.image_url} alt={ad.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />

                                  {ad.creative?.video_id && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-10 h-10 bg-gray-900/60 backdrop-blur-md rounded-full border border-gray-300 flex items-center justify-center shadow-2xl">
                                        <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : ad.creative?.video_id ? (
                                <div className="w-full h-full bg-gray-900/60 flex flex-col items-center justify-center p-4 text-center text-gray-500">
                                  <span className="text-[10px] font-black uppercase tracking-widest mb-1.5">Vídeo Meta</span>
                                  <span className="text-[9px] font-mono">ID: {ad.creative.video_id}</span>
                                </div>
                              ) : (
                                <span className="text-gray-600 font-black font-mono text-[10px] uppercase tracking-widest">[Sem Mídia API]</span>
                              )}

                              <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200">
                                {ad.status === 'ACTIVE' ? (
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[9px] uppercase tracking-widest">
                                    <span className="relative flex h-2 w-2"><span className="animate-pulse-green absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> ON
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-gray-500 font-bold text-[9px] uppercase tracking-widest"><span className="h-2 w-2 rounded-full bg-slate-600"></span> OFF</div>
                                )}
                              </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                              <h4 className="text-base font-black text-gray-900 mb-2 leading-tight truncate">{ad.name}</h4>
                              {ad.creative?.title && <p className="text-xs font-bold text-gray-500 mb-1 truncate">{ad.creative.title}</p>}
                              {ad.creative?.body && <p className="text-[11px] font-medium text-gray-500 line-clamp-2">{ad.creative.body}</p>}

                              <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-[9px] font-mono text-gray-400 truncate max-w-[100px]">ID: {ad.id}</p>
                                <div className="flex gap-2">
                                  <button onClick={() => setItemEditando({ ...ad, tipo: 'anuncios' })} className="cursor-pointer px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">Editar</button>
                                  <button type="button" onClick={() => handleToggleStatusReal(ad, 'ad')} className={`cursor-pointer relative w-12 h-6 rounded-full shrink-0 transition-all duration-300 focus:outline-none ${ad.status === 'ACTIVE' ? 'bg-[#22C55E]' : 'bg-[#6B7280]'}`}><span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${ad.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-0'}`}></span></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>

          {/* DIÁRIO DE BORDO DRAWER */}
          {isDrawerLogOpen && (
            <>
              <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[250] transition-opacity" onClick={() => setIsDrawerLogOpen(false)}></div>
              <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-gray-50 border-l border-gray-200 shadow-2xl z-[260] flex flex-col animate-slide-up duration-300">
                <div className="p-6 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                      {IconRobot}
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Diário de Bordo</h3>
                      <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Ações do Sentinela em Tempo Real</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsDrawerLogOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl transition-all">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/20">
                  {roboLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      {IconRobot}
                      <p className="text-sm font-black uppercase tracking-widest text-gray-500 mt-4">Nenhuma ação registrada.</p>
                      <p className="text-xs font-medium text-gray-400 mt-2 max-w-[200px]">Ative o Sentinela para gravar registros automáticos.</p>
                    </div>
                  ) : (
                    roboLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-2xl bg-[#050509] border border-gray-200 shadow-inner relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.tipo === 'stop' ? 'bg-blue-500' : log.tipo === 'escala' ? 'bg-emerald-500' : log.tipo === 'info' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>

                        <div className="flex justify-between items-start mb-2 ml-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{log.dataHora}</span>
                          {log.tipo === 'stop' && <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Auto-Pause</span>}
                          {log.tipo === 'escala' && <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Escala Mágica</span>}
                          {log.tipo === 'info' && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Sistema</span>}
                        </div>
                        <h4 className="text-sm font-black text-gray-900 ml-2 mb-1 truncate">{log.campanha}</h4>
                        <p className="text-xs font-medium text-gray-500 ml-2 leading-relaxed">{log.mensagem}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────
            VIEW 3: COFRE DE CRIATIVO (Originally Biblioteca de Mídia)
            ──────────────────────────────────────────────────────────────────────── */}
        <div key={`tab-${abaAtiva}-biblioteca`} className={`flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth ${abaAtiva === 'biblioteca' ? 'block animate-fade-in' : 'hidden'}`}>
          <div className="w-full max-w-[1600px] mx-auto flex flex-col space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Cofre de Criativo</h2>
                <p className="text-sm font-bold text-gray-500 mt-1">Sua galeria de arquivos de alta conversão salvos na nuvem.</p>
              </div>

              <div className="relative group shrink-0">
                <input type="file" multiple accept="image/*,video/*" onChange={handleImagensCofre} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <button className="cursor-pointer magnetic-btn flex items-center gap-3 bg-blue-600 hover:bg-blue-700 hover:brightness-110 text-gray-900 font-black text-sm px-6 py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)] uppercase tracking-widest">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Fazer Upload
                </button>
              </div>
            </div>

            <GlassPanel className="flex-1 min-h-[500px] p-6 bg-gray-50/20">
              {cofreArquivos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-3xl p-12 bg-white shadow-sm">
                  <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-500 shadow-inner">
                    {IconCloud}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-3">Seu Cofre está vazio</h3>
                  <p className="text-sm text-gray-500 max-w-md mb-8">Faça o upload dos seus vídeos e imagens campeões. Eles ficarão salvos na nuvem para lançamentos rápidos.</p>

                  <div className="relative group cursor-pointer inline-block">
                    <input type="file" multiple accept="image/*,video/*" onChange={handleImagensCofre} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <button className="cursor-pointer magnetic-btn bg-gray-100 border border-gray-200 hover:bg-white/[0.05] text-gray-900 font-black text-xs px-6 py-3.5 rounded-xl transition-all uppercase tracking-widest">
                      Adicionar Primeiros Arquivos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {cofreArquivos.map((arquivo) => (
                    <div key={arquivo.id} className="group relative bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden shadow-inner hover:border-blue-500/30 transition-all duration-300">
                      <div className="aspect-[4/5] relative bg-[#010103] flex items-center justify-center">
                        {arquivo.type === 'video' ? (
                          <video src={arquivo.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" autoPlay muted loop playsInline />
                        ) : (
                          <img src={arquivo.url} alt={arquivo.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        )}

                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button onClick={() => setCofreArquivos(prev => prev.filter(a => a.id !== arquivo.id))} className="w-8 h-8 bg-blue-600/90 text-gray-900 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-xl text-xs hover:bg-blue-500">✕</button>
                        </div>
                      </div>
                      <div className="p-3 border-t border-gray-200">
                        <p className="text-xs font-black text-gray-900 truncate">{arquivo.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Salvo em: {arquivo.data}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────
            VIEW 4: WORKSPACE (Originally Gerenciador de Ofertas)
            ──────────────────────────────────────────────────────────────────────── */}
        <div key={`tab-${abaAtiva}-workspaces`} className={`flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth ${abaAtiva === 'workspaces' ? 'block animate-fade-in' : 'hidden'}`}>
          <div className="w-full max-w-[1600px] mx-auto flex flex-col space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Workspace</h2>
                <p className="text-sm font-bold text-gray-500 mt-1">Configure o ecossistema de cada produto. Salve para preenchimento em 1 clique.</p>
              </div>

              <button onClick={() => { setWsForm({ id: '', nomeProduto: '', nomeOferta: '', status: 'teste', link: '', pixelId: '', parametrosUtm: '' }); setIsModalWsOpen(true); }} className="magnetic-btn shrink-0 flex items-center gap-3 bg-blue-600 hover:bg-blue-700 hover:brightness-110 text-gray-900 font-black text-sm px-6 py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)] uppercase tracking-widest">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Nova Oferta
              </button>
            </div>

            <GlassPanel className="flex-1 min-h-[500px] p-6 bg-gray-50/20">
              {workspacesList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-3xl p-12 bg-white shadow-sm">
                  <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-500">
                    {IconWorkspace}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-3">Nenhuma Oferta Salva</h3>
                  <p className="text-sm text-gray-500 max-w-md mb-8">Crie perfis para cada produto ou funil. O sistema injeta os links e pixels automaticamente no Lançador.</p>

                  <button onClick={() => { setWsForm({ id: '', nomeProduto: '', nomeOferta: '', status: 'teste', link: '', pixelId: '', parametrosUtm: '' }); setIsModalWsOpen(true); }} className="magnetic-btn bg-gray-100 border border-gray-200 hover:bg-white/[0.05] text-gray-900 font-black text-xs px-6 py-3.5 rounded-xl transition-all uppercase tracking-widest">
                    Criar Primeira Oferta
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {workspacesList.map((ws) => {
                    const isAtivo = wsAtivo?.id === ws.id;
                    const isValidada = ws.status === 'validada';
                    return (
                      <div key={ws.id} className={`group flex flex-col bg-white shadow-sm border rounded-3xl overflow-hidden transition-all duration-300 ${isAtivo ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.15)] scale-[1.02]' : 'border-gray-200 hover:border-white/15'}`}>

                        <div className="p-6 border-b border-gray-200 bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAtivo ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-slate-900/40 text-gray-500 border border-gray-200'}`}>
                              {IconWorkspace}
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              {isAtivo && <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-blue-500/20">Operando</span>}
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded border ${isValidada ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                {isValidada ? '✅ Validada' : '🧪 Teste'}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{ws.nomeProduto}</p>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight truncate mt-1">{ws.nomeOferta}</h3>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> Link de Destino</p>
                            <p className="text-xs font-mono text-gray-700 truncate">{ws.link || 'Não definido'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> Pixel ID</p>
                            <p className="text-xs font-mono text-gray-700 truncate">{ws.pixelId || 'Não definido'}</p>
                          </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-white shadow-sm flex gap-3">
                          <button onClick={() => ativarWorkspace(ws)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isAtivo ? 'bg-slate-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-gray-900 border border-blue-500/20'}`}>
                            {isAtivo ? 'Operando' : 'Ativar Oferta'}
                          </button>
                          <button onClick={() => { setWsForm(ws); setIsModalWsOpen(true); }} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-white/[0.05] text-gray-500 hover:text-gray-900 rounded-xl transition-all">
                            {IconEdit}
                          </button>
                          <button onClick={() => {
                            const novaLista = workspacesList.filter(w => w.id !== ws.id);
                            setWorkspacesList(novaLista);
                            localStorage.setItem("autoads_workspaces_list", JSON.stringify(novaLista));
                            if (isAtivo) setWsAtivo(null);
                          }} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-blue-500/10 text-gray-500 hover:text-blue-500 rounded-xl transition-all text-sm font-bold">
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassPanel>
          </div>
        </div>

      </main>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAIS PREMIUM FLUTUANTES (Blurs e Glassmorphism)
          ──────────────────────────────────────────────────────────────────────── */}

      {/* MODAL COFRE DE CRIATIVOS (FULLY INTEGRATED) */}
      {isModalCofreOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="p-8 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  {IconFolder}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Selecionar do Cofre</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Escolha criativos para o disparo imediato</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsModalCofreOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl transition-all text-lg">✕</button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-gray-50/20">
              {cofreArquivos.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-white shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400 mb-4">{IconCloud}</div>
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Nenhum arquivo no cofre</p>
                  <p className="text-xs text-gray-400 mt-1">Faça upload de mídias na aba "Cofre de Criativo" antes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {cofreArquivos.map(arquivo => (
                    <div key={arquivo.id} onClick={() => selecionarDoCofre(arquivo)} className="cursor-pointer group relative bg-slate-900/40 border border-gray-200 rounded-xl overflow-hidden hover:border-blue-500/40 transition-all duration-300">
                      <div className="aspect-[4/5] bg-slate-950 flex items-center justify-center overflow-hidden">
                        {arquivo.type === 'video' ? (
                          <video src={arquivo.url} className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500" muted />
                        ) : (
                          <img src={arquivo.url} alt={arquivo.name} className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-0 bg-blue-500/0 hover:bg-blue-500/10 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-blue-600 text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg transition-all duration-300">Selecionar</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <p className="text-[10px] font-bold text-gray-900 truncate">{arquivo.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-white shadow-sm border-t border-gray-200 flex justify-end">
              <button type="button" onClick={() => setIsModalCofreOpen(false)} className="magnetic-btn px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors border border-gray-200">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO ROBÔ */}
      {modalRoboOpen && itemRobo && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="p-8 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  {IconRobot}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Robô Sentinela</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Proteção e escala automática 24/7</p>
                </div>
              </div>
              <button type="button" onClick={() => setModalRoboOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl transition-all text-lg">✕</button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-gray-50/20">

              <div className="bg-white shadow-sm p-5 rounded-2xl border border-gray-200">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Alvo do Robô</p>
                <p className="text-lg font-black text-gray-900 truncate">{itemRobo.name}</p>
              </div>

              {/* REGRA 1: STOP LOSS */}
              <div>
                <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Defesa (Stop-Loss)
                </h4>
                <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Pausar campanha se gastar (R$) sem fazer vendas:</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-black font-mono">R$</span>
                    <input type="number" value={formRobo.stopLossGasto} onChange={(e) => setFormRobo({ ...formRobo, stopLossGasto: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl pl-16 pr-6 py-3.5 text-xl font-black font-mono text-gray-900 focus:border-blue-500 transition-all outline-none" placeholder="50.00" />
                  </div>
                </div>
              </div>

              {/* REGRA 2: ESCALA */}
              <div>
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ataque (Escala)
                </h4>
                <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">ROAS Mínimo (Gatilho)</label>
                    <input type="number" step="0.1" value={formRobo.escalaRoas} onChange={(e) => setFormRobo({ ...formRobo, escalaRoas: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-xl font-black font-mono text-gray-900 focus:border-emerald-500 transition-all outline-none" placeholder="3.0" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Aumentar Orçamento em (%)</label>
                    <div className="relative">
                      <input type="number" value={formRobo.escalaAumento} onChange={(e) => setFormRobo({ ...formRobo, escalaAumento: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-xl font-black font-mono text-gray-900 focus:border-emerald-500 transition-all outline-none" placeholder="20" />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-black font-mono">%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-8 bg-white shadow-sm border-t border-gray-200 flex items-center justify-between gap-4">
              {robosAtivos[itemRobo.id] ? (
                <button type="button" onClick={desativarRobo} className="cursor-pointer px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 transition-colors">Desativar Robô</button>
              ) : <div></div>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setModalRoboOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-white/[0.05] transition-colors">Cancelar</button>
                <button type="button" onClick={salvarRegraRobo} className="cursor-pointer magnetic-btn px-8 py-3 bg-purple-600 hover:bg-purple-500 text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2">
                  Salvar Regras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO FLUTUANTE SIMULADO (GESTÃO) */}
      {itemEditando && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="p-8 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Editar Configuração</h3>
                  <p className="text-xs font-mono text-gray-500 mt-1">Meta ID: {itemEditando.id}</p>
                </div>
                <button type="button" onClick={() => setItemEditando(null)} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl transition-all text-lg">✕</button>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-gray-50/20">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">Nome de Visualização</label>
                <input type="text" defaultValue={itemEditando.name} className={inputClass} />
              </div>

              {(itemEditando.daily_budget !== undefined || itemEditando.lifetime_budget !== undefined) && (
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">Orçamento Diário (R$)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-black font-mono">R$</span>
                    <input type="number" defaultValue={(itemEditando.daily_budget || itemEditando.lifetime_budget) / 100} className="w-full bg-white border border-gray-200 rounded-xl pl-16 pr-6 py-3.5 text-lg font-black font-mono text-gray-900 focus:bg-white focus:border-blue-500 transition-all outline-none shadow-inner" />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Toggle enabled={itemEditando.status === "ACTIVE"} onChange={() => { handleToggleStatusReal(itemEditando, itemEditando.tipo === 'campanhas' ? 'campaign' : itemEditando.tipo === 'conjuntos' ? 'adset' : 'ad'); setItemEditando(null); }} label="Permitir Entrega" desc="Se desligado, a Meta pausa as impressões imediatamente." />
              </div>
            </div>

            <div className="p-8 bg-white shadow-sm border-t border-gray-200 flex items-center justify-end gap-4">
              <button type="button" onClick={() => setItemEditando(null)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors">Cancelar</button>
              <button type="button" onClick={() => { setItemEditando(null); showToast("No futuro, conectaremos este salvamento de nome/orçamento na API também.", "success"); }} className="magnetic-btn px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">Sincronizar API</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DOS WORKSPACES */}
      {isModalWsOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col relative">

            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${wsForm.status === 'validada' ? 'bg-emerald-600/10' : 'bg-yellow-600/10'}`}></div>

            <div className="p-8 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  {IconWorkspace}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">{wsForm.id ? 'Editar Configuração' : 'Nova Oferta'}</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Ajuste os parâmetros para lançamentos rápidos</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsModalWsOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl transition-all text-lg">✕</button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-gray-50/20">

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Fase da Oferta
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setWsForm({ ...wsForm, status: 'teste' })} className={`p-6 rounded-2xl border flex items-center gap-4 transition-all text-left group ${wsForm.status === 'teste' ? 'bg-yellow-500/5 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-white shadow-sm border-gray-200 hover:border-gray-200'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${wsForm.status === 'teste' ? 'bg-yellow-500 text-black' : 'bg-gray-50 text-gray-500 group-hover:text-yellow-500'}`}>
                      {IconTest}
                    </div>
                    <div>
                      <p className={`text-base font-black uppercase tracking-widest ${wsForm.status === 'teste' ? 'text-yellow-500' : 'text-gray-700'}`}>Fase de Teste</p>
                      <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">Validação de Criativo/Público</p>
                    </div>
                  </button>

                  <button onClick={() => setWsForm({ ...wsForm, status: 'validada' })} className={`p-6 rounded-2xl border flex items-center gap-4 transition-all text-left group ${wsForm.status === 'validada' ? 'bg-emerald-500/5 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white shadow-sm border-gray-200 hover:border-gray-200'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${wsForm.status === 'validada' ? 'bg-emerald-500 text-black' : 'bg-gray-50 text-gray-500 group-hover:text-emerald-500'}`}>
                      {IconValid}
                    </div>
                    <div>
                      <p className={`text-base font-black uppercase tracking-widest ${wsForm.status === 'validada' ? 'text-emerald-400' : 'text-gray-700'}`}>Oferta Validada</p>
                      <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">Campanhas Oficiais de Escala</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-white shadow-sm border border-gray-200 rounded-2xl">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  Identificação
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Produto / Vertical</label>
                    <input type="text" value={wsForm.nomeProduto} onChange={e => setWsForm({ ...wsForm, nomeProduto: e.target.value })} className={inputClass} placeholder="Ex: Capsulas XYZ" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nome da Oferta</label>
                    <input type="text" value={wsForm.nomeOferta} onChange={e => setWsForm({ ...wsForm, nomeOferta: e.target.value })} className={inputClass} placeholder="Ex: Black Friday 50%" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white shadow-sm border border-gray-200 rounded-2xl space-y-6">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Destino &amp; Rastreamento
                </h4>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Link de Destino Padrão</label>
                  <input type="text" value={wsForm.link} onChange={e => setWsForm({ ...wsForm, link: e.target.value })} className={inputClass} placeholder="https://seudominio.com/oferta" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">ID do Pixel Meta Principal</label>
                    <input type="text" value={wsForm.pixelId} onChange={e => setWsForm({ ...wsForm, pixelId: e.target.value.replace(/\D/g, '') })} className={`${inputClass} font-mono text-blue-400`} placeholder="123456789098765" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">UTMs Padrão (Sem o ?)</label>
                    <input type="text" value={wsForm.parametrosUtm} onChange={e => setWsForm({ ...wsForm, parametrosUtm: e.target.value })} className={`${inputClass} font-mono`} placeholder="utm_source=fb&utm_medium=cpc" />
                  </div>
                </div>
              </div>

            </div>

            <div className="p-8 bg-white shadow-sm border-t border-gray-200 flex items-center justify-end gap-4">
              <button type="button" onClick={() => setIsModalWsOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-white/[0.05] transition-colors">Cancelar</button>
              <button type="button" onClick={salvarWorkspace} disabled={!wsForm.nomeProduto || !wsForm.nomeOferta} className="cursor-pointer magnetic-btn px-8 py-3 bg-blue-600 disabled:opacity-30 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}