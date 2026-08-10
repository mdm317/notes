import {
  readdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? 'content/posts')

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return markdownFiles(filePath)
    return entry.isFile() && entry.name.endsWith('.md') ? [filePath] : []
  })
}

for (const filePath of markdownFiles(root)) {
  const source = readFileSync(filePath, 'utf8')
  let inFence = false
  let inFrontMatter = false
  let changed = false

  const output = source.split('\n').map((line, index) => {
    if (index === 0 && line.trim() === '---') inFrontMatter = true
    else if (inFrontMatter && line.trim() === '---') inFrontMatter = false

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

    changed = true
    return `${line}  `
  }).join('\n')

  if (changed) writeFileSync(filePath, output)
}
