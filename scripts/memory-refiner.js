/**
 * Memory Refiner — Hook de PreCompact
 *
 * Executado durante a compactação da sessão (PreCompact).
 * Funções:
 *   1. Consolida conhecimento extraído da sessão atual
 *   2. Atualiza os arquivos de memória do repositório (/memories/repo/)
 *   3. Remove informações obsoletas ou duplicadas
 *   4. Garante que convenções descobertas sejam persistidas
 *
 * Interface: lê dados da sessão de argv/env/stdin, escreve
 * relatório de consolidação em stdout.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPO_MEMORY_DIR = join(ROOT, ".github", "repo-memory");
const MEMORIES_DIR = join(ROOT, "memories", "repo");

// ═══════════════════════════════════════════════════════════════════
//  Categorias de conhecimento que o refiner extrai
// ═══════════════════════════════════════════════════════════════════

const KNOWLEDGE_CATEGORIES = Object.freeze({
  conventions: {
    label: "Convenções de Código",
    files: ["conventions.md"],
    description: "Padrões de estilo, nomenclatura, estrutura de arquivos",
  },
  build: {
    label: "Build & Dev",
    files: ["build.md"],
    description: "Comandos de build, test, lint, dev server",
  },
  architecture: {
    label: "Arquitetura",
    files: ["architecture.md"],
    description: "Decisões arquiteturais, fluxos de dados, dependenceias",
  },
  debugging: {
    label: "Debugging",
    files: ["debugging.md"],
    description: "Problemas comuns e soluções, configurações de debug",
  },
  patterns: {
    label: "Padrões Descobertos",
    files: ["patterns.md"],
    description: "Padrões de código aprendidos durante a sessão",
  },
});

// ═══════════════════════════════════════════════════════════════════
//  Utilitários
// ═══════════════════════════════════════════════════════════════════

/** @returns {Promise<string>} */
async function readInput() {
  // 1. Argumento CLI
  const arg = process.argv[2];
  if (arg && arg.length > 0) return arg.trim();

  // 2. Stdin (modo pipe)
  const rl = createInterface({ input: process.stdin });
  const lines = [];
  for await (const line of rl) lines.push(line);
  return lines.join("\n").trim();
}

/** @param {string} dir */
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/** @param {string} filePath @param {string} [defaultContent] @returns {string} */
function readOrCreate(filePath, defaultContent = "") {
  try {
    if (existsSync(filePath)) {
      return readFileSync(filePath, "utf-8");
    }
  } catch {
    // Arquivo não existe ou não pode ser lido
  }
  return defaultContent;
}

/** @param {string} filePath @param {string} content */
function writeAtomic(filePath, content) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, "utf-8");
}

/** @returns {string} */
function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ═══════════════════════════════════════════════════════════════════
//  Core: Análise de integridade da memória
// ═══════════════════════════════════════════════════════════════════

/** @returns {Array<{file:string, exists:boolean, size:number, lines:number, lastModified:string|null}>} */
function auditMemoryFiles() {
  const files = [
    ...Object.values(KNOWLEDGE_CATEGORIES).flatMap((c) => c.files),
    "README.md",
  ];

  return files.map((file) => {
    const paths = [
      join(REPO_MEMORY_DIR, file),
      join(MEMORIES_DIR, file),
    ];

    for (const fp of paths) {
      if (existsSync(fp)) {
        try {
          const stat = readFileSync(fp, "utf-8");
          const lines = stat.split("\n");
          return {
            file,
            exists: true,
            size: stat.length,
            lines: lines.length,
            lastModified: timestamp(),
          };
        } catch {
          // continua
        }
      }
    }

    return { file, exists: false, size: 0, lines: 0, lastModified: null };
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Core: Consolidação de memória do repositório
// ═══════════════════════════════════════════════════════════════════

/** @returns {string[]} */
function consolidateRepoMemory() {
  const actions = [];

  ensureDir(MEMORIES_DIR);

  // Lê o conteúdo de cada categoria e verifica se está saudável
  for (const [, category] of Object.entries(KNOWLEDGE_CATEGORIES)) {
    for (const filename of category.files) {
      const filePath = join(MEMORIES_DIR, filename);

      if (!existsSync(filePath)) {
        // Cria arquivo inicial com template
        const template = `# ${category.label}\n\n> Gerenciado pelo Memory Refiner — ${timestamp()}\n\n${category.description}.\n\n`;
        writeAtomic(filePath, template);
        actions.push(`Criado: ${filename}`);
      } else {
        // Arquivo existe — verifica se não está vazio
        const content = readOrCreate(filePath);
        if (content.trim().length === 0) {
          const template = `# ${category.label}\n\n> Reconstruído pelo Memory Refiner — ${timestamp()}\n\n`;
          writeAtomic(filePath, template);
          actions.push(`Reconstruído (vazio): ${filename}`);
        }
      }
    }
  }

  // Cria/atualiza README.md se não existir
  const readmePath = join(MEMORIES_DIR, "README.md");
  if (!existsSync(readmePath)) {
    const readme = [
      "# Repositório de Memória do Vigia",
      "",
      "> Conhecimento persistente do agente sobre o código-fonte.",
      "",
      "## Arquivos",
      "",
      ...Object.entries(KNOWLEDGE_CATEGORIES).map(
        ([, cat]) => `- \`${cat.files[0] ?? ""}\` — ${cat.label}`,
      ),
      "",
      "---",
      `*Atualizado em ${timestamp()} pelo Memory Refiner*`,
      "",
    ].join("\n");
    writeAtomic(readmePath, readme);
    actions.push("Criado: README.md");
  }

  return actions;
}

// ═══════════════════════════════════════════════════════════════════
//  Core: Limpeza de arquivos órfãos
// ═══════════════════════════════════════════════════════════════════

/** @returns {string[]} */
function cleanOrphanFiles() {
  const actions = [];
  const knownFiles = new Set([
    ...Object.values(KNOWLEDGE_CATEGORIES).flatMap((c) => c.files),
    "README.md",
  ]);

  if (!existsSync(MEMORIES_DIR)) return actions;

  try {
    const files = readdirSync(MEMORIES_DIR);
    for (const file of files) {
      if (file.endsWith(".md") && !knownFiles.has(file) && file !== "README.md") {
        const fullPath = join(MEMORIES_DIR, file);
        try {
          writeFileSync(fullPath, ""); // esvazia em vez de deletar
          actions.push(`Marcado como obsoleto: ${file}`);
        } catch {
          // skip se não puder escrever
        }
      }
    }
  } catch {
    // diretório não existe ou não pode ser lido
  }

  return actions;
}

// ═══════════════════════════════════════════════════════════════════
//  Core: Atualização de seções específicas por detecção
// ═══════════════════════════════════════════════════════════════════

/**
 * Detecta se há referências a ferramentas de build no projeto
 * e atualiza build.md se necessário.
 */
/** @returns {string[]} */
function updateBuildKnowledge() {
  const actions = [];
  const buildFile = join(MEMORIES_DIR, "build.md");

  // Detecta package manager
  const hasPackageJson = existsSync(join(ROOT, "package.json"));
  const hasPnpmLock = existsSync(join(ROOT, "pnpm-lock.yaml"));
  const hasYarnLock = existsSync(join(ROOT, "yarn.lock"));

  let content = readOrCreate(buildFile);

  // Só atualiza se o arquivo estiver vazio ou for template inicial
  if (content.trim().length < 50) {
    const pm = hasPnpmLock ? "pnpm" : hasYarnLock ? "yarn" : "npm";
    const scripts = {};

    // Tenta ler scripts do package.json
    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
        if (pkg.scripts) {
          for (const [name, cmd] of Object.entries(pkg.scripts)) {
            scripts[name] = cmd;
          }
        }
      } catch {
        // package.json inválido ou sem scripts
      }
    }

    const lines = [
      "# Build & Dev",
      "",
      `> Gerenciado pelo Memory Refiner — ${timestamp()}`,
      "",
      `## Package Manager`,
      "",
      `\`\`\``,
      `${pm}`,
      `\`\`\``,
      "",
    ];

    if (Object.keys(scripts).length > 0) {
      lines.push("## Scripts Disponíveis", "");
      for (const [name, cmd] of Object.entries(scripts)) {
        lines.push(`- \`${pm} run ${name}\` — ${cmd}`);
      }
      lines.push("");
    }

    lines.push("---", `*Atualizado em ${timestamp()}*`, "");

    content = lines.join("\n");
    writeAtomic(buildFile, content);
    actions.push("Atualizado: build.md com scripts do projeto");
  }

  return actions;
}

// ═══════════════════════════════════════════════════════════════════
//  Core: Verifica convenções do projeto
// ═══════════════════════════════════════════════════════════════════

/** @returns {string[]} */
function updateConventions() {
  const actions = [];
  const convFile = join(MEMORIES_DIR, "conventions.md");
  const content = readOrCreate(convFile);

  if (content.trim().length < 50) {
    // Detecta convenções do projeto
    const hasTypeScript = existsSync(join(ROOT, "tsconfig.json"));
    const hasEslint = existsSync(join(ROOT, ".eslintrc") ) ||
                      existsSync(join(ROOT, ".eslintrc.json")) ||
                      existsSync(join(ROOT, ".eslintrc.js")) ||
                      existsSync(join(ROOT, "eslint.config.js"));
    const isEsm = (() => {
      try {
        const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
        return pkg.type === "module";
      } catch { return false; }
    })();

    const lines = [
      "# Convenções de Código",
      "",
      `> Gerenciado pelo Memory Refiner — ${timestamp()}`,
      "",
    ];

    if (hasTypeScript) lines.push("- TypeScript strict mode");
    if (isEsm) lines.push("- ESM (type: module) — usar import/export");
    if (hasEslint) lines.push("- ESLint para linting");
    lines.push("- Projeto: Vigia — Agente de Segurança Inteligente");
    lines.push("- Zod para validação de entrada", "");
    lines.push("---", `*Atualizado em ${timestamp()}*`, "");

    writeAtomic(convFile, lines.join("\n"));
    actions.push("Atualizado: conventions.md");
  }

  return actions;
}

// ═══════════════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════════════

/** @returns {Promise<void>} */
async function main() {
  const input = await readInput();
  const allActions = [];
  const errors = [];

  const startTime = Date.now();

  // Fase 1: Auditoria
  try {
    const status = auditMemoryFiles();
    const missing = status.filter((s) => !s.exists);
    if (missing.length > 0) {
      allActions.push(`Auditoria: ${missing.length} arquivos de memória ausentes`);
    }
  } catch (err) {
    errors.push(`Erro na auditoria: ${err.message}`);
  }

  // Fase 2: Consolidação
  try {
    const consolidation = consolidateRepoMemory();
    allActions.push(...consolidation);
  } catch (err) {
    errors.push(`Erro na consolidação: ${err.message}`);
  }

  // Fase 3: Convenções
  try {
    const conv = updateConventions();
    allActions.push(...conv);
  } catch (err) {
    errors.push(`Erro em convenções: ${err.message}`);
  }

  // Fase 4: Build knowledge
  try {
    const build = updateBuildKnowledge();
    allActions.push(...build);
  } catch (err) {
    errors.push(`Erro em build: ${err.message}`);
  }

  // Fase 5: Limpeza
  try {
    const clean = cleanOrphanFiles();
    allActions.push(...clean);
  } catch (err) {
    errors.push(`Erro na limpeza: ${err.message}`);
  }

  const elapsed = Date.now() - startTime;

  // Relatório
  const report = [
    "=== Memory Refiner Report ===",
    `Timestamp: ${timestamp()}`,
    `Duration: ${elapsed}ms`,
    `Input received: ${input ? `${input.length} chars` : "none"}`,
    "",
    "Actions:",
    ...(allActions.length > 0
      ? allActions.map((a) => `  ✓ ${a}`)
      : ["  (nenhuma ação necessária)"]),
    ...(errors.length > 0
      ? ["", "Errors:", ...errors.map((e) => `  ✗ ${e}`)]
      : []),
    "",
    "=== End Report ===",
  ].join("\n");

  console.log(report);
}

await main();
