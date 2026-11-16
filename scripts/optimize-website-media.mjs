import { spawnSync } from 'node:child_process'
import { mkdir, stat, copyFile, rename, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const imageJobs = [
  { source: 'media-source/home-page-featured-photo.png', output: 'public/home-page-featured-photo.webp', width: 640, quality: 90, alpha: true },
  { source: 'media-source/about-headshot.jpg', output: 'public/about-headshot.webp', width: 640, quality: 90 },
  { source: 'media-source/about-scrapbook/football-team.jpg', output: 'public/about-scrapbook/football-team.webp', width: 640, quality: 88 },
  { source: 'media-source/about-scrapbook/japan-garden.jpg', output: 'public/about-scrapbook/japan-garden.webp', width: 640, quality: 88 },
  { source: 'media-source/about-scrapbook/evening-with-friends.jpg', output: 'public/about-scrapbook/evening-with-friends.webp', width: 640, quality: 88 },
  { source: 'media-source/about-scrapbook/fish-eye.jpg', output: 'public/about-scrapbook/fish-eye.webp', width: 640, quality: 88 },
  { source: 'media-source/bodies-cover.jpeg', output: 'public/bodies-cover.webp', quality: 92 },
  { source: 'media-source/late-registration-cover.jpg', output: 'public/late-registration-cover.webp', quality: 92 },
  { source: 'media-source/nujabes-album-cover.jpg', output: 'public/nujabes-album-cover.webp', quality: 76 },
  { source: 'media-source/muas-website-preview.png', output: 'public/muas/muas-website-preview.webp', width: 960, quality: 90 },
  { source: 'media-source/rotating-eye-static.png', output: 'public/rotating-eye-static.webp', lossless: true },
  { source: 'media-source/company-logos/deloitte-digital.jpeg', output: 'public/company-logos/deloitte-digital.webp', quality: 96 },
  { source: 'media-source/company-logos/campion-education.jpeg', output: 'public/company-logos/campion-education.webp', quality: 96 },
  { source: 'media-source/company-logos/lake-press.jpeg', output: 'public/company-logos/lake-press.webp', quality: 96 },
  { source: 'media-source/company-logos/monash-connected-autonomous-vehicle.jpeg', output: 'public/company-logos/monash-connected-autonomous-vehicle.webp', quality: 96 },
  { source: 'media-source/company-logos/monash-uncrewed-aerial-systems.jpeg', output: 'public/company-logos/monash-uncrewed-aerial-systems.webp', quality: 96 },
  { source: 'media-source/company-logos/nandos-australia-new-zealand.jpeg', output: 'public/company-logos/nandos-australia-new-zealand.webp', quality: 96 },
]

const videoJobs = [
  // VP9 was compared against H.264 for these two clips and was larger, so H.264 is the deployed format.
  { source: 'media-source/roam.io/hazard_video.mp4', webm: null, mp4: 'public/roam.io/hazard_video.mp4' },
  { source: 'media-source/unilinq/Unilinq Demo.mp4', webm: null, mp4: 'public/unilinq/Unilinq Demo.mp4' },
]

async function size(path) {
  return (await stat(resolve(root, path))).size
}

async function isCurrent(source, output) {
  try {
    const [sourceInfo, outputInfo] = await Promise.all([stat(resolve(root, source)), stat(resolve(root, output))])
    return outputInfo.mtimeMs >= sourceInfo.mtimeMs
  } catch {
    return false
  }
}

function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: 'inherit' })
  if (result.error) throw new Error(`Could not run ${command} for ${label}: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`${command} failed for ${label} (status ${result.status})`)
}

async function convertImage(job) {
  const sourcePath = resolve(root, job.source)
  const outputPath = resolve(root, job.output)
  await mkdir(dirname(outputPath), { recursive: true })
  if (!(await isCurrent(job.source, job.output))) {
    const args = job.lossless
      ? ['-quiet', '-lossless', '-z', '9', sourcePath, '-o', outputPath]
      : ['-quiet', '-m', '6', '-q', String(job.quality), sourcePath, '-o', outputPath]
    if (job.alpha) args.splice(5, 0, '-alpha_q', '100')
    run('cwebp', args, job.source)
  }

  const reports = [`${job.source} → ${job.output}: ${await size(job.source)} → ${await size(job.output)} bytes`]
  if (job.width) {
    const smallOutput = job.output.replace(/\.webp$/i, `-${job.width}.webp`)
    if (!(await isCurrent(job.source, smallOutput))) {
      run('cwebp', ['-quiet', '-m', '6', '-q', String(job.quality), '-resize', String(job.width), '0', sourcePath, '-o', resolve(root, smallOutput)], job.source)
    }
    reports.push(`${job.width}px variant ${await size(smallOutput)} bytes`)
  }
  console.log(reports.join('; '))
}

async function convertVideo(job) {
  const sourcePath = resolve(root, job.source)
  const webmPath = job.webm ? resolve(root, job.webm) : null
  const mp4Path = resolve(root, job.mp4)
  const webmTmp = webmPath ? `${webmPath}.tmp.webm` : null
  const mp4Tmp = `${mp4Path}.tmp.mp4`
  await mkdir(dirname(mp4Path), { recursive: true })

  if (job.webm && !(await isCurrent(job.source, job.webm))) {
    await rm(webmTmp, { force: true })
    run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', sourcePath,
      '-map', '0:v:0', '-map', '0:a?', '-fps_mode', 'passthrough',
      '-c:v', 'libvpx-vp9', '-crf', '35', '-b:v', '0', '-row-mt', '1', '-deadline', 'realtime', '-cpu-used', '8',
      '-pix_fmt', 'yuv420p', '-c:a', 'libopus', '-b:a', '96k', '-map_metadata', '-1', webmTmp,
    ], job.source)
    await rename(webmTmp, webmPath)
  }

  if (!(await isCurrent(job.source, job.mp4))) {
    await rm(mp4Tmp, { force: true })
    run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', sourcePath,
      '-map', '0:v:0', '-map', '0:a?', '-fps_mode', 'passthrough',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-map_metadata', '-1', mp4Tmp,
    ], job.source)
    if ((await size(mp4Tmp)) < (await size(job.source))) await rename(mp4Tmp, mp4Path)
    else {
      await copyFile(sourcePath, mp4Path)
      await rm(mp4Tmp, { force: true })
    }
  }

  if (job.webm && (await size(job.webm)) >= (await size(job.mp4))) {
    await rm(webmPath, { force: true })
    console.log(`${job.source}: VP9 WebM was larger; using H.264 MP4 only (${await size(job.source)} → ${await size(job.mp4)} bytes)`)
  } else if (job.webm) {
    console.log(`${job.source} → ${job.webm}: ${await size(job.source)} → ${await size(job.webm)} bytes; H.264 fallback ${await size(job.mp4)} bytes`)
  } else {
    console.log(`${job.source} → ${job.mp4}: ${await size(job.source)} → ${await size(job.mp4)} bytes; VP9 output was larger and is omitted`)
  }
}

for (const job of imageJobs) await convertImage(job)
for (const job of videoJobs) await convertVideo(job)
