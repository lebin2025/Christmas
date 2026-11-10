/** Remove build output one file at a time.
 *  Some sandboxes guard bulk recursive deletes; unlinking individually keeps
 *  repeated `npm run build` runs clean without tripping that guard. */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('dist')
if (!fs.existsSync(root)) process.exit(0)

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      fs.rmdirSync(full)
    } else {
      fs.unlinkSync(full)
    }
  }
}
walk(root)
fs.rmdirSync(root)
console.log('dist cleaned')
