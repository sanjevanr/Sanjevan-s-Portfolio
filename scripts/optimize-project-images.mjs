import { spawnSync } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const assets = [
  ['public/roam.io/roam.io_team_photo.png', 'public/roam.io/roam.io_team_photo.webp'],
  ['public/roam.io/social-feed_roam.io.png', 'public/roam.io/social-feed_roam.io.webp'],
  ['public/roam.io/milestones_roam.io.png', 'public/roam.io/milestones_roam.io.webp'],
  ['public/unilinq/unilinq-poc-pitch.jpg', 'public/unilinq/unilinq-poc-pitch.webp'],
  ['public/spotto/login-page.jpg', 'public/spotto/login-page.webp'],
  ['public/spotto/profile-view.PNG', 'public/spotto/profile-view.webp'],
  ['public/spotto/spotto-map-view.jpg', 'public/spotto/spotto-map-view.webp'],
  ['public/spotto/reporting-tool.PNG', 'public/spotto/reporting-tool.webp'],
]

async function convert(source, destination) {
  for (const width of [640, 'full']) {
    const output = width === 'full' ? destination : destination.replace(/\.webp$/, `-${width}.webp`)
    const args = ['-quiet', '-q', '86', '-m', '6', source, '-o', output]
    if (width !== 'full') args.splice(3, 0, '-resize', String(width), '0')
    const result = spawnSync('cwebp', args, { cwd: root, encoding: 'utf8' })
    if (result.error) throw new Error(`Could not run cwebp: ${result.error.message}`)
    if (result.status !== 0) throw new Error(`cwebp failed for ${source}: ${result.stderr}`)
  }
  const before = (await stat(resolve(root, source))).size
  const after = (await stat(resolve(root, destination))).size
  const small = (await stat(resolve(root, destination.replace(/\.webp$/, '-640.webp')))).size
  console.log(`${source} -> ${destination}: ${before} -> ${after} bytes; 640px ${small} bytes`)
}

for (const [source, destination] of assets) await convert(source, destination)

const muasScreenshotSource = 'media-source/muas-website-preview.png'
for (const width of [960, 1920]) {
  const destination = width === 1920
    ? 'public/muas/muas-website-preview.webp'
    : `public/muas/muas-website-preview-${width}.webp`
  const result = spawnSync('cwebp', ['-quiet', '-q', '90', '-m', '6', '-resize', String(width), '0', muasScreenshotSource, '-o', destination], { cwd: root, encoding: 'utf8' })
  if (result.error) throw new Error(`Could not run cwebp for the MUAS screenshot: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`cwebp failed for the MUAS screenshot: ${result.stderr}`)
}
const muasSourceSize = (await stat(resolve(root, muasScreenshotSource))).size
const muasOptimizedSize = (await stat(resolve(root, 'public/muas/muas-website-preview.webp'))).size
console.log(`${muasScreenshotSource} -> public/muas/muas-website-preview.webp: ${muasSourceSize} -> ${muasOptimizedSize} bytes; 960px ${await stat(resolve(root, 'public/muas/muas-website-preview-960.webp')).then(({ size }) => size)} bytes`)
