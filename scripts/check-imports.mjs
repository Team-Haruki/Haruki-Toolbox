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

const BANNED_TOKENS = [
    { token: '@/components/pages/', message: 'Use module-local views/components paths instead of "@/components/pages/*".' },
    { token: '@/components/WebLayout.vue', message: 'Use "@/modules/web/views/WebLayout.vue".' },
    { token: '@/components/Maintenance.vue', message: 'Use "@/modules/navigation/views/Maintenance.vue".' },
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

function scanFile(filePath, content) {
    const currentModule = getModuleNameFromFilePath(filePath)
    const inCurrentModuleApiDir = currentModule ? isModuleApiFile(filePath, currentModule) : false
    const lines = content.split(/\r?\n/)
    const violations = []
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i]
        for (const rule of BANNED_TOKENS) {
            if (line.includes(rule.token)) {
                violations.push({
                    filePath,
                    line: i + 1,
                    token: rule.token,
                    message: rule.message,
                })
            }
        }
        if (!currentModule) {
            continue
        }

        for (const pattern of MODULE_BARREL_PATTERNS) {
            const match = line.match(pattern)
            if (!match) {
                continue
            }

            const importedModule = match[1]
            if (importedModule !== currentModule) {
                continue
            }

            violations.push({
                filePath,
                line: i + 1,
                token: `@/modules/${importedModule}`,
                message: "Module internals must not import their own index barrel. Import concrete subpaths such as ./api, ./components, or ./composables.",
            })
            break
        }

        if (inCurrentModuleApiDir) {
            continue
        }

        for (const pattern of MODULE_API_BARREL_PATTERNS) {
            const match = line.match(pattern)
            if (!match) {
                continue
            }

            const importedModule = match[1]
            if (importedModule !== currentModule) {
                continue
            }

            violations.push({
                filePath,
                line: i + 1,
                token: `@/modules/${importedModule}/api`,
                message: "Module internals must not import their own api barrel. Import concrete api files such as ./api/user or ./api/list.",
            })
            break
        }
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
