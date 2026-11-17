"use client";

import { useEffect, useMemo, useState } from "react";

type Section = "inicio" | "rotina" | "financas" | "corpo" | "mente" | "avatar";
type Habit = { id: number; title: string; time: string; done: boolean };
const initialHabits: Habit[] = [
  { id: 1, title: "Acordar sem adiar o despertador", time: "06:30", done: true },
  { id: 2, title: "Treinar ou movimentar o corpo", time: "17:00", done: false },
  { id: 3, title: "Estudar por pelo menos 30 minutos", time: "19:00", done: false },
];
const quotes = [
  "Você não precisa vencer o mundo hoje. Só precisa não desistir de si.",
  "A sua próxima versão é construída nas escolhas que ninguém vê.",
  "Disciplina é continuar mesmo quando a motivação tira folga.",
  "Não negocie com a versão de você que quer ficar no mesmo lugar.",
];

const nav: { id: Section; label: string; icon: string }[] = [
  { id: "inicio", label: "Visão geral", icon: "✳" },
  { id: "rotina", label: "Rotina", icon: "◷" },
  { id: "financas", label: "Finanças", icon: "↗" },
  { id: "corpo", label: "Corpo", icon: "◇" },
  { id: "mente", label: "Mente", icon: "☼" },
  { id: "avatar", label: "Meu personagem", icon: "♙" },
];

const avatarHeads = ["◉", "●", "◍", "◌"];
const avatarHair = ["Corte clássico", "Degradê", "Cacheado", "Longo"];
const avatarColors = ["#f5b78f", "#d99670", "#8b5b43", "#f0d0b2"];
const avatarFits = ["Jaqueta", "Moletom", "Esportivo", "Minimalista"];

export default function ForgeV2() {
  const [section, setSection] = useState<Section>("inicio");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWelcomeNext, setShowWelcomeNext] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [habits, setHabits] = useState(initialHabits);
  const [newHabit, setNewHabit] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [income, setIncome] = useState("0");
  const [expense, setExpense] = useState("0");
  const [saved, setSaved] = useState("0");
  const [goal, setGoal] = useState("3500");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [reflection, setReflection] = useState("");
  const [mood, setMood] = useState("🙂");
  const [hair, setHair] = useState(1);
  const [skin, setSkin] = useState(0);
  const [outfit, setOutfit] = useState(1);
  const [accent, setAccent] = useState("#f0445f");
  const [avatarName, setAvatarName] = useState("Minha evolução");
  const [dark, setDark] = useState(true);

  useEffect(() => {\n    const preference = window.localStorage.getItem("forge-v2:show-motivation");\n    setShowWelcome(preference !== "false");\n    setShowWelcomeNext(preference !== "false");\n  }, []);\n\n  function startDay() {\n    window.localStorage.setItem("forge-v2:show-motivation", showWelcomeNext ? "true" : "false");\n    setShowWelcome(false);\n  }\n\n  const doneCount = habits.filter((h) => h.done).length;
  const progress = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;
  const balance = useMemo(() => Math.max(0, Number(income || 0) - Number(expense || 0)), [income, expense]);
  const savedProgress = Math.min(100, Math.round((Number(saved || 0) / Math.max(1, Number(goal || 1))) * 100));

  function addHabit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newHabit.trim()) return;
    setHabits((current) => [...current, { id: Date.now(), title: newHabit.trim(), time: newTime, done: false }]);
    setNewHabit("");
  }

  function toggleHabit(id: number) {
    setHabits((current) => current.map((h) => h.id === id ? { ...h, done: !h.done } : h));
  }

  const shell = dark ? "forge-v2 dark" : "forge-v2 light";
  return (
    <main className={shell}>
      {showWelcome && (
        <div className="welcome-screen">
          <div className="welcome-orb orb-one" /><div className="welcome-orb orb-two" />
          <div className="welcome-content">
            <span className="eyebrow"><span className="spark">✦</span> FORGE · O SEU AMANHÃ</span>
            <div className="welcome-mark">F<span>.</span></div>
            <p className="welcome-kicker">UMA NOVA FASE COMEÇA AGORA</p>
            <h1>{quotes[quoteIndex]}</h1>
            <p className="welcome-sub">Pequenas atitudes. Progresso real. Uma versão sua que você vai ter orgulho de conhecer.</p>
            <div className="welcome-actions">
              <button className="primary-button" onClick={startDay}>Começar meu dia <span>↗</span></button>
              <button className="quiet-button" onClick={() => setQuoteIndex((quoteIndex + 1) % quotes.length)}>Outra mensagem ↻</button>
            </div>
            <label className="welcome-choice"><input type="checkbox" checked={showWelcomeNext} onChange={(e) => setShowWelcomeNext(e.target.checked)} /> Mostrar esta página quando eu abrir o Forge</label>
          </div>
          <div className="welcome-bottom"><span>CONSTRUA · EVOLUA · REPITA</span><span>01 / 06</span></div>
        </div>
      )}

      <div className="app-layout">
        <aside className="sidebar">
          <button className="brand" onClick={() => setSection("inicio")}><span className="brand-symbol">F</span><span>forge<small>O SEU AMANHÃ</small></span></button>
          <div className="side-caption">SEU ESPAÇO</div>
          <nav>{nav.map((item) => <button key={item.id} className={section === item.id ? "nav-item active" : "nav-item"} onClick={() => setSection(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{section === item.id && <i />}</button>)}</nav>
          <div className="sidebar-bottom">
            <div className="mini-avatar" style={{ borderColor: accent }}>F</div>
            <div className="profile-mini"><strong>Seu progresso</strong><span>Começando uma nova fase</span></div>
            <button className="icon-button" title="Alternar tema" onClick={() => setDark(!dark)}>◐</button>
          </div>
        </aside>

        <section className="main-panel">
          <header className="topbar"><div><span className="breadcrumb">FORGE <b>/</b> {nav.find((n) => n.id === section)?.label.toUpperCase()}</span><h2>{section === "inicio" ? "Seu amanhã começa hoje." : nav.find((n) => n.id === section)?.label}</h2></div><div className="top-actions"><span className="date-chip">✦ Sua jornada, no seu ritmo</span><button className="avatar-button" onClick={() => setSection("avatar")}>F</button></div></header>

          {section === "inicio" && <div className="content-grid">
            <section className="hero-card"><div className="hero-copy"><span className="eyebrow">✦ NÃO É SOBRE PERFEIÇÃO</span><h1>Um passo de cada vez.<br /><em>Sem parar de avançar.</em></h1><p>O que você faz hoje está moldando a pessoa que você será amanhã.</p><button className="primary-button" onClick={() => setSection("rotina")}>Ver minha rotina <span>↗</span></button></div><div className="hero-art"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="hero-character" style={{ borderColor: accent }}><span>F</span></div><div className="float-tag tag-top">+1% HOJE</div><div className="float-tag tag-bottom">EVOLUÇÃO CONSTANTE</div></div></section>
            <div className="stats-row"><article className="stat-card"><span>ROTINA CONCLUÍDA</span><strong>{progress}<small>%</small></strong><div className="progress-track"><i style={{ width: progress + "%" }} /></div><p>{doneCount} de {habits.length} hábitos concluídos</p></article><article className="stat-card"><span>SALDO DISPONÍVEL</span><strong>R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><p>Entradas menos despesas registradas</p></article><article className="stat-card"><span>OBJETIVO DE POUPANÇA</span><strong>{savedProgress}<small>%</small></strong><div className="progress-track orange"><i style={{ width: savedProgress + "%" }} /></div><p>R$ {Number(saved || 0).toLocaleString("pt-BR")} de R$ {Number(goal || 0).toLocaleString("pt-BR")}</p></article></div>
            <div className="lower-grid"><article className="surface-card"><div className="card-heading"><div><span className="eyebrow">SEU DIA</span><h3>Próximos passos</h3></div><button className="text-link" onClick={() => setSection("rotina")}>Ver rotina ↗</button></div>{habits.slice(0, 3).map((h) => <button className="habit-row" key={h.id} onClick={() => toggleHabit(h.id)}><span className={h.done ? "check done" : "check"}>{h.done ? "✓" : ""}</span><span className="habit-name">{h.title}<small>{h.time}</small></span><span className={h.done ? "habit-status done-text" : "habit-status"}>{h.done ? "Concluído" : "Pendente"}</span></button>)}</article><article className="quote-card"><span className="eyebrow">LEMBRETE DO DIA</span><div className="quote-mark">“</div><h3>{quotes[quoteIndex]}</h3><button className="text-link" onClick={() => setQuoteIndex((quoteIndex + 1) % quotes.length)}>Nova inspiração ↻</button></article></div>
          </div>}

          {section === "rotina" && <div className="section-wrap"><div className="section-intro"><span className="eyebrow">CONSISTÊNCIA ACIMA DE INTENSIDADE</span><h1>Faça o que importa.</h1><p>Organize seus hábitos e celebre cada pequena vitória.</p></div><div className="routine-summary"><div><span>PROGRESSO DE HOJE</span><strong>{progress}%</strong></div><div className="big-progress"><i style={{ width: progress + "%" }} /></div><small>{doneCount} de {habits.length} tarefas concluídas</small></div><form className="add-form" onSubmit={addHabit}><input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="Qual hábito você quer construir?" /><input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} /><button className="primary-button">Adicionar +</button></form><div className="surface-card habit-list"><div className="card-heading"><h3>Seus hábitos</h3><span className="date-chip">HOJE</span></div>{habits.map((h) => <div className="habit-row" key={h.id}><button className={h.done ? "check done" : "check"} onClick={() => toggleHabit(h.id)}>{h.done ? "✓" : ""}</button><span className="habit-name">{h.title}<small>{h.time}</small></span><span className={h.done ? "habit-status done-text" : "habit-status"}>{h.done ? "Concluído" : "Em aberto"}</span></div>)}</div></div>}

          {section === "financas" && <div className="section-wrap"><div className="section-intro"><span className="eyebrow">LIBERDADE TAMBÉM É PLANEJAMENTO</span><h1>Seu dinheiro, suas escolhas.</h1><p>Tenha clareza do que entra, sai e do que você está construindo.</p></div><div className="finance-cards"><label className="surface-card"><span>ENTRADAS (R$)</span><input type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} /></label><label className="surface-card"><span>DESPESAS (R$)</span><input type="number" min="0" value={expense} onChange={(e) => setExpense(e.target.value)} /></label><div className="surface-card balance-card"><span>SALDO CALCULADO</span><strong>R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div></div><div className="surface-card savings-panel"><span className="eyebrow">META DE POUPANÇA</span><h3>O futuro que você está financiando.</h3><div className="finance-fields"><label>Já guardado (R$)<input type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} /></label><label>Meta (R$)<input type="number" min="1" value={goal} onChange={(e) => setGoal(e.target.value)} /></label></div><div className="big-progress"><i style={{ width: savedProgress + "%" }} /></div><p>{savedProgress}% do objetivo alcançado</p></div><p className="prototype-note">Prévia interativa: estes valores ficam apenas nesta sessão de demonstração. A integração com sua conta e o banco será conectada na etapa de backend.</p></div>}

          {section === "corpo" && <div className="section-wrap"><div className="section-intro"><span className="eyebrow">CUIDAR DE SI É UM COMPROMISSO</span><h1>Seu corpo, sua jornada.</h1><p>Acompanhe seus dados e evolução sem comparações injustas.</p></div><div className="finance-fields"><label className="surface-card">Altura (cm)<input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ex.: 175" /></label><label className="surface-card">Peso (kg)<input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex.: 68" /></label></div><div className="surface-card privacy-panel"><span className="privacy-icon">▣</span><h3>Seu espaço privado de evolução</h3><p>Fotos corporais são pessoais. A futura integração usará armazenamento privado, acesso por conta e opção de exclusão. Nenhuma foto será publicada ou enviada para IA sem consentimento explícito.</p><button className="secondary-button" disabled>Adicionar foto · integração segura em construção</button></div><p className="prototype-note">Os campos de medidas são demonstrativos nesta versão de interface; não substituem orientação profissional ou avaliação médica.</p></div>}

          {section === "mente" && <div className="section-wrap"><div className="section-intro"><span className="eyebrow">VOCÊ TAMBÉM MERECE PAUSA</span><h1>Como você está de verdade?</h1><p>Um espaço sem julgamento para perceber o que está acontecendo aí dentro.</p></div><div className="surface-card mind-panel"><h3>Como está seu dia?</h3><div className="mood-row">{["😞","😕","😐","🙂","😄"].map((m) => <button key={m} className={mood === m ? "mood active" : "mood"} onClick={() => setMood(m)}>{m}</button>)}</div><label className="reflection-label">Se quiser, escreva um pouco sobre isso<textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="O que está ocupando sua cabeça hoje?" rows={6} /></label><p className="prototype-note">Seu registro ainda não é salvo em uma conta. A persistência privada será ligada ao backend antes de produção.</p></div></div>}

          {section === "avatar" && <div className="section-wrap"><div className="section-intro"><span className="eyebrow">SUA IDENTIDADE NO FORGE</span><h1>Crie seu personagem.</h1><p>Monte um avatar que represente sua jornada. Personalize agora; geração a partir de foto virá com consentimento e provedor aprovado.</p></div><div className="avatar-builder"><div className="avatar-preview"><div className="avatar-halo" style={{ background: accent + "22" }} /><div className="avatar-figure" style={{ "--skin": avatarColors[skin], "--accent": accent } as React.CSSProperties}><div className="avatar-hair" data-style={hair} /><div className="avatar-face"><span /><span /></div><div className="avatar-body" data-outfit={outfit}><b>F</b></div></div><strong>{avatarName}</strong><span className="preview-caption">PRÉVIA DO PERSONAGEM</span></div><div className="avatar-controls"><label>Nome do personagem<input value={avatarName} onChange={(e) => setAvatarName(e.target.value)} maxLength={24} /></label><div className="control-group"><span>Estilo de cabelo</span><div className="choice-grid">{avatarHair.map((v, i) => <button key={v} className={hair === i ? "choice selected" : "choice"} onClick={() => setHair(i)}>{v}</button>)}</div></div><div className="control-group"><span>Tom de pele</span><div className="swatches">{avatarColors.map((v, i) => <button aria-label={"Tom de pele " + (i + 1)} key={v} className={skin === i ? "swatch selected" : "swatch"} style={{ background: v }} onClick={() => setSkin(i)} />)}</div></div><div className="control-group"><span>Roupa</span><div className="choice-grid">{avatarFits.map((v, i) => <button key={v} className={outfit === i ? "choice selected" : "choice"} onClick={() => setOutfit(i)}>{v}</button>)}</div></div><div className="control-group"><span>Cor de destaque</span><div className="swatches">{["#f0445f","#fb923c","#8b5cf6","#14b8a6","#60a5fa"].map((v) => <button aria-label={"Cor " + v} key={v} className={accent === v ? "swatch selected" : "swatch"} style={{ background: v }} onClick={() => setAccent(v)} />)}</div></div><div className="avatar-note">✦ Em breve: enviar uma foto sua e transformá-la em avatar ilustrado. A foto só será processada após confirmação de consentimento; você poderá apagar a imagem e o avatar.</div><button className="primary-button" onClick={() => setSection("inicio")}>Usar meu personagem <span>↗</span></button></div></div></div>}
          <footer className="app-footer"><span>FORGE · O SEU AMANHÃ</span><span>CONSTRUÍDO UM DIA DE CADA VEZ.</span></footer>
        </section>
      </div>
    </main>
  );
}
