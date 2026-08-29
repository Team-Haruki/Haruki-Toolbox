import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, "src")

const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".vue", ".mjs", ".cjs"])

const MODULE_BARREL_PATTERNS = [
    /from\s+["']@\/modules\/([a-z0-9-]+)(?:\/index(?:\.[a-z]+)?|\/)?["']/,
    /import\s+["']@\/modules\/([a-z0-9-]+)(?:\/index(?:\.[a-z]+)?|\/)?["']/,
    /import\(\s*["']@\/modules\/([a-z0-9-]+)(?:\/index(?:\.[a-z]+)?|\/)?["']\s*\)/,
]

const MODULE_API_BARREL_PATTERNS = [
    /from\s+["']@\/modules\/([a-z0-9-]+)\/api(?:\/index(?:\.[a-z]+)?|\/)?["']/,
    /import\s+["']@\/modules\/([a-z0-9-]+)\/api(?:\/index(?:\.[a-z]+)?|\/)?["']/,
    /import\(\s*["']@\/modules\/([a-z0-9-]+)\/api(?:\/index(?:\.[a-z]+)?|\/)?["']\s*\)/,
]

const IMPORT_PATH_PATTERNS = [
    /from\s+["']([^"']+)["']/,
    /import\s+["']([^"']+)["']/,
    /import\(\s*["']([^"']+)["']\s*\)/,
]

const BANNED_TOKENS = [
    { token: '@/components/pages/', message: 'Use module-local views/components paths instead of "@/components/pages/*".' },
    { token: '@/components/WebLayout.vue', message: 'Use "@/modules/web/views/WebLayout.vue".' },
    { token: '@/components/Turnstile.vue', message: 'Use "@/shared/components/Turnstile.vue".' },
    { token: '@/api/', message: 'Use "@/modules/*/api" for business APIs or "@/core/http/call-api" for HTTP client.' },
    { token: 'from "@/api"', message: 'Use "@/modules/*/api" for business APIs.' },
    { token: "from '@/api'", message: 'Use "@/modules/*/api" for business APIs.' },
    { token: '@/store', message: 'Use "@/shared/stores/user".' },
    { token: '@/settingsStore', message: 'Use "@/shared/stores/settings".' },
    { token: '@/router', message: 'Use "@/core/router".' },
    { token: "from './router'", message: 'Use "@/core/router".' },
    { token: 'from "./router"', message: 'Use "@/core/router".' },
    { token: '@/lib/ticket-display', message: 'Use "@/modules/tickets/lib/display".' },
]

async function collectFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files = []
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...(await collectFiles(fullPath)))
            continue
        }
        if (!entry.isFile()) {
            continue
        }
        if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
            files.push(fullPath)
        }
    }
    return files
}

function getModuleNameFromFilePath(filePath) {
    const normalizedPath = filePath.replaceAll(path.sep, "/")
    const match = normalizedPath.match(/\/src\/modules\/([^/]+)\//)
    if (!match) {
        return null
    }
    return match[1]
}

function isModuleApiFile(filePath, moduleName) {
    const normalizedPath = filePath.replaceAll(path.sep, "/")
    return normalizedPath.includes(`/src/modules/${moduleName}/api/`)
}

function isModuleIndexFile(filePath, moduleName) {
    const normalizedPath = normalizePath(filePath)
    return new RegExp(`/src/modules/${moduleName}/index\\.[a-z]+$`).test(normalizedPath)
}

function stripKnownExtension(value) {
    for (const extension of FILE_EXTENSIONS) {
        if (value.endsWith(extension)) {
            return value.slice(0, -extension.length)
        }
    }
    return value
}

function normalizePath(value) {
    return value.replaceAll(path.sep, "/")
}

function resolveImportTarget(filePath, importPath) {
    return stripKnownExtension(normalizePath(path.resolve(path.dirname(filePath), importPath)))
}

function extractImportPaths(line) {
    const paths = []
    for (const pattern of IMPORT_PATH_PATTERNS) {
        const match = line.match(pattern)
        if (match?.[1]) {
            paths.push(match[1])
        }
    }
    return paths
}

function createViolation(filePath, line, token, message) {
    return { filePath, line, token, message }
}

function createScanContext(filePath) {
    const currentModule = getModuleNameFromFilePath(filePath)
    const moduleRootPath = currentModule
        ? normalizePath(path.join(ROOT, "src", "modules", currentModule))
        : ""
    return {
        filePath,
        currentModule,
        inCurrentModuleApiDir: currentModule ? isModuleApiFile(filePath, currentModule) : false,
        isCurrentModuleIndex: currentModule ? isModuleIndexFile(filePath, currentModule) : false,
        moduleRootPath,
        moduleApiRootPath: `${moduleRootPath}/api`,
    }
}

function scanBannedTokens(context, line, lineNumber) {
    const violations = []
    for (const rule of BANNED_TOKENS) {
        if (line.includes(rule.token)) {
            violations.push(createViolation(context.filePath, lineNumber, rule.token, rule.message))
        }
    }
    return violations
}

function findImportedCurrentModule(line, patterns, currentModule) {
    for (const pattern of patterns) {
        const match = line.match(pattern)
        if (match?.[1] === currentModule) {
            return match[1]
        }
    }
    return null
}

function scanOwnModuleBarrel(context, line, lineNumber) {
    const importedModule = findImportedCurrentModule(line, MODULE_BARREL_PATTERNS, context.currentModule)
    if (!importedModule) {
        return []
    }
    return [createViolation(
        context.filePath,
        lineNumber,
        `@/modules/${importedModule}`,
        "Module internals must not import their own index barrel. Import concrete subpaths such as ./api, ./components, or ./composables.",
    )]
}

function isOwnModuleIndexTarget(context, targetPath) {
    return targetPath === context.moduleRootPath || targetPath === `${context.moduleRootPath}/index`
}

function isOwnApiBarrelTarget(context, targetPath) {
    return targetPath === context.moduleApiRootPath || targetPath === `${context.moduleApiRootPath}/index`
}

function scanRelativeImports(context, line, lineNumber) {
    for (const importPath of extractImportPaths(line)) {
        if (!importPath.startsWith(".")) {
            continue
        }

        const targetPath = resolveImportTarget(context.filePath, importPath)
        if (isOwnModuleIndexTarget(context, targetPath)) {
            return [createViolation(
                context.filePath,
                lineNumber,
                importPath,
                "Module internals must not import their own index barrel via relative paths. Import concrete subpaths such as ./api/user or ./composables/list.",
            )]
        }

        const canImportApiBarrel = context.inCurrentModuleApiDir || context.isCurrentModuleIndex
        if (!canImportApiBarrel && isOwnApiBarrelTarget(context, targetPath)) {
            return [createViolation(
                context.filePath,
                lineNumber,
                importPath,
                "Module internals must not import their own api barrel via relative paths. Import concrete api files such as ./api/user or ./api/list.",
            )]
        }
    }
    return []
}

function scanOwnApiBarrel(context, line, lineNumber) {
    if (context.inCurrentModuleApiDir) {
        return []
    }

    const importedModule = findImportedCurrentModule(line, MODULE_API_BARREL_PATTERNS, context.currentModule)
    if (!importedModule) {
        return []
    }
    return [createViolation(
        context.filePath,
        lineNumber,
        `@/modules/${importedModule}/api`,
        "Module internals must not import their own api barrel. Import concrete api files such as ./api/user or ./api/list.",
    )]
}

function scanModuleLine(context, line, lineNumber) {
    if (!context.currentModule) {
        return []
    }
    return [
        ...scanOwnModuleBarrel(context, line, lineNumber),
        ...scanRelativeImports(context, line, lineNumber),
        ...scanOwnApiBarrel(context, line, lineNumber),
    ]
}

function scanFile(filePath, content) {
    const context = createScanContext(filePath)
    const violations = []
    for (const [index, line] of content.split(/\r?\n/).entries()) {
        const lineNumber = index + 1
        violations.push(...scanBannedTokens(context, line, lineNumber))
        violations.push(...scanModuleLine(context, line, lineNumber))
    }
    return violations
}

async function main() {
    const files = await collectFiles(SRC_DIR)
    const violations = []
    for (const file of files) {
        const content = await fs.readFile(file, "utf8")
        violations.push(...scanFile(file, content))
    }

    if (violations.length === 0) {
        return
    }

    console.error("Architecture import guard failed:")
    for (const item of violations) {
        const rel = path.relative(ROOT, item.filePath)
        console.error(`- ${rel}:${item.line} contains "${item.token}"`)
        console.error(`  ${item.message}`)
    }
    process.exit(1)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
