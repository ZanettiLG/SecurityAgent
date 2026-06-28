/**
 * Prompt Auditor — Hook de UserPromptSubmit
 *
 * Executado antes de cada prompt ser enviado ao agente.
 * Funções:
 *   1. Audita o prompt do usuário em busca de padrões conhecidos
 *   2. Enriquece o prompt com contexto do projeto quando relevante
 *   3. Sugere redirecionamento para o agente especializado correto
 *
 * Interface: lê o prompt de uma das seguintes formas (por ordem):
 *   1. Argumento CLI (argv[2])
 *   2. Variável de ambiente VSCODE_PROMPT
 *   3. Linhas de stdin até EOF
 * Escreve o prompt (possivelmente modificado) em stdout.
 */

import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Domínios conhecidos do projeto ──────────────────────────────

const AGENTS = [
  "main", "coder", "planner", "researcher",
  "code-reviewer", "test-runner", "orchestrator",
];

const SKILLS = [
  "new-api-route", "new-chain", "new-frontend-page",
  "new-pipeline", "run-tests", "context7-mcp", "game-components",
];

const HANDOFF_COMMANDS = ["/handoff", "/start", "/status", "/resume"];

const DOMAIN_KEYWORDS = [
  // Vigia core
  "câmera", "camera", "vigia", "segurança", "security",
  "veículo", "vehicle", "pessoa", "person", "unknown",
  "rotina", "routine", "padrão", "pattern", "anomalia", "anomaly",
  "hipótese", "hypothesis", "predição", "prediction",
  // Técnico
  "pipeline", "agente", "agent", "handoff", "hook",
  "memória", "memory", "config", "skill",
  // Ações
  "alert", "alerta", "monitor", "investigar", "investigate",
  "relatório", "report", "dashboard",
];

// ── Utilitários ─────────────────────────────────────────────────

/** @returns {Promise<string>} */
async function readPrompt() {
  // 1. Argumento CLI
  const arg = process.argv[2];
  if (arg && arg.length > 0) return arg.trim();

  // 2. Variável de ambiente
  const env = process.env.VSCODE_PROMPT;
  if (env && env.length > 0) return env.trim();

  // 3. Stdin (modo pipe)
  const rl = createInterface({ input: process.stdin });
  const lines = [];
  for await (const line of rl) lines.push(line);
  return lines.join("\n").trim();
}

/** @param {string} prompt @returns {string|null} */
function detectAgent(prompt) {
  const lower = prompt.toLowerCase();

  // Comandos de handoff explícitos
  if (HANDOFF_COMMANDS.some((cmd) => lower.startsWith(cmd))) {
    return "orchestrator";
  }

  // Menção direta a um agente
  for (const agent of AGENTS) {
    if (lower.includes(`@${agent}`) || lower.includes(`/${agent}`)) {
      return agent;
    }
  }

  // Menção a skill conhecida
  for (const skill of SKILLS) {
    if (lower.includes(skill)) {
      return "coder";
    }
  }

  // Domínio de planejamento/análise
  if (
    lower.includes("planejar") || lower.includes("plan") ||
    lower.includes("arquitetura") || lower.includes("architecture") ||
    lower.includes("decompor") || lower.includes("tasks")
  ) {
    return "planner";
  }

  // Domínio de pesquisa/exploração
  if (
    lower.includes("pesquisar") || lower.includes("research") ||
    lower.includes("explorar") || lower.includes("explore") ||
    lower.includes("mapear") || lower.includes("levantar requisitos")
  ) {
    return "researcher";
  }

  // Domínio de revisão
  if (
    lower.includes("revisar") || lower.includes("review") ||
    lower.includes("auditar") || lower.includes("audit")
  ) {
    return "code-reviewer";
  }

  // Domínio de teste
  if (
    lower.includes("testar") || lower.includes("test ") ||
    lower.includes("vitest") || lower.includes("coverage") ||
    lower.includes("rodar testes")
  ) {
    return "test-runner";
  }

  // Domínio de implementação (fallback)
  if (
    lower.includes("implementar") || lower.includes("implement") ||
    lower.includes("criar") || lower.includes("create") ||
    lower.includes("adicionar") || lower.includes("add") ||
    lower.includes("modificar") || lower.includes("modify") ||
    lower.includes("corrigir") || lower.includes("fix") ||
    lower.includes("codificar") || lower.includes("code")
  ) {
    return "coder";
  }

  return null;
}

/** @param {string} prompt @returns {string[]} */
function inferDomain(prompt) {
  const lower = prompt.toLowerCase();
  return DOMAIN_KEYWORDS.filter((kw) => lower.includes(kw));
}

/** @returns {string[]} */
function getProjectContext() {
  const hints = [];

  if (existsSync(join(ROOT, "src", "core", "agent.ts"))) {
    hints.push("Tipo: Vigia — Agente de Segurança Inteligente");
  }
  if (existsSync(join(ROOT, ".github", "agents"))) {
    hints.push("Tem agentes customizados (main, coder, planner, etc.)");
  }
  if (existsSync(join(ROOT, ".github", "skills"))) {
    hints.push("Tem skills disponíveis");
  }
  if (existsSync(join(ROOT, ".github", "hooks"))) {
    hints.push("Tem hooks de ciclo de vida configurados");
  }
  if (existsSync(join(ROOT, "handoff"))) {
    hints.push("Tem cartões de handoff para implementação");
  }

  return hints;
}

// ── Main ─────────────────────────────────────────────────────────

/** @returns {Promise<void>} */
async function main() {
  const prompt = await readPrompt();

  if (!prompt) {
    // Prompt vazio — deixa passar
    console.log("");
    process.exit(0);
  }

  const domain = inferDomain(prompt);
  const suggestedAgent = detectAgent(prompt);
  const projectCtx = getProjectContext();

  // Monta o prompt enriquecido (se houver sugestões)
  const enhancements = [];

  if (suggestedAgent && !prompt.includes(`@${suggestedAgent}`) && !prompt.includes(`/${suggestedAgent}`)) {
    enhancements.push(`[auditor: Sugestão de agente: @${suggestedAgent}]`);
  }

  if (domain.length > 0) {
    enhancements.push(`[auditor: Domínios detectados: ${domain.join(", ")}]`);
  }

  // Se o prompt é muito curto e fala de domínio Vigia, adiciona contexto
  if (prompt.split(" ").length < 10 && domain.length > 0 && projectCtx.length > 0) {
    enhancements.push(`[auditor: Contexto do projeto — ${projectCtx.join("; ")}]`);
  }

  if (enhancements.length > 0) {
    // Prefixa as sugestões como comentário (o agente vê mas o usuário não)
    const enriched = `${enhancements.join("\n")}\n${prompt}`;
    console.log(enriched);
  } else {
    console.log(prompt);
  }
}

await main();
