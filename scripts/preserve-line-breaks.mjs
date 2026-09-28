import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? 'content/posts')
const sourceRoot = process.argv[3]

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return markdownFiles(filePath)
    return entry.isFile() && entry.name.endsWith('.md') ? [filePath] : []
  })
}

for (const filePath of markdownFiles(root)) {
  const original = readFileSync(filePath, 'utf8')
  let source = original
  if (sourceRoot) {
    const sourcePath = path.join(sourceRoot, path.relative(root, filePath))
    const created = new Date(statSync(sourcePath).birthtimeMs).toISOString()
    if (source.startsWith('---\n')) {
      const frontMatterEnd = source.indexOf('\n---', 4)
      if (frontMatterEnd === -1) throw new Error(`Unclosed frontmatter: ${sourcePath}`)
      if (!/^created:/m.test(source.slice(4, frontMatterEnd))) {
        source = source.replace('---\n', `---\ncreated: ${created}\n`)
      }
    } else {
      source = `---\ncreated: ${created}\n---\n\n${source}`
    }
  }
  let inFence = false
  let inFrontMatter = false

  const output = source.split('\n').map((line, index) => {
    if (index === 0 && line.trim() === '---') {
      inFrontMatter = true
      return line
    }
    if (inFrontMatter && line.trim() === '---') {
      inFrontMatter = false
      return line
    }

    const isFence = /^\s{0,3}(`{3,}|~{3,})/.test(line)
    if (isFence) {
      inFence = !inFence
      return line
    }

    if (
      inFence ||
      inFrontMatter ||
      line.trim() === '' ||
      / {2,}$/.test(line)
    ) {
      return line
    }

    return `${line}  `
  }).join('\n')

  if (output !== original) writeFileSync(filePath, output)
}
