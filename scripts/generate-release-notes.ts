// This script is used to generate release notes for a given release.
// It correctly ignores cherry-picked commits from previous patch releases.

import chalk from 'chalk'
import shell from 'shelljs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

interface Commit {
  hash: string
  type: string
  message: string
}

const argv = yargs(hideBin(process.argv))
  .option('lastTag', {
    type: 'string',
    description: 'The last release tag (optional)',
  })
  .option('toRef', {
    type: 'string',
    description: 'The reference to generate release notes up to',
    default: 'HEAD',
  })
  .option('verbose', {
    type: 'boolean',
    description: 'Enable verbose logging',
    default: true,
  })
  .parseSync()

function log(message: string) {
  if (argv.verbose) {
    console.error(message)
  }
}

function getLastTag(): string {
  log(chalk.blue('Fetching the last tag...'))
  // Get all tags sorted by version, then filter for those that look like semantic version tags
  // Note: We can't use `git describe --tags --abbrev=0` because that returns the latest tag that is a direct ancestor of the current branch
  // But patch releases are not direct ancestors
  const result = shell.exec(
    'git tag --sort=-v:refname | grep -E "^.*[0-9]+\\.[0-9]+\\.[0-9]+" | head -n 1',
    {
      silent: true,
    }
  )
  if (result.code !== 0) {
    console.error(chalk.red('Error fetching last tag:', result.stderr))
    process.exit(1)
  }
  return result.stdout.trim()
}

function getTagPrefix(tag: string): string {
  const match = tag.match(/^(.*)v?\d+\.\d+\.\d+$/)
  return match ? match[1] : ''
}

function getCommits(lastTag: string, toRef: string): Commit[] {
  log(chalk.blue(`Fetching commits between ${lastTag} and ${toRef}...`))
  const range = `${lastTag}..${toRef}`

  // Assume GNU toolchain, unless on darwin then assume BSD toolchain.
  let reverseCommand = 'tac'
  if (process.platform === 'darwin') {
    reverseCommand = 'tail -r'
  }
  const result = shell.exec(`git rev-list ${range} --oneline | ${reverseCommand}`, { silent: true })

  if (result.code !== 0) {
    console.error(chalk.red('Error fetching git commits:', result.stderr))
    process.exit(1)
  }

  return result.stdout
    .trim()
    .split('\n')
    .map((line) => {
      const [hash, ...messageParts] = line.split(' ')
      const message = messageParts.join(' ')
      const match = message.match(/^(\w+)(\(.*?\))?:/)
      const type = match ? match[1] : 'other'
      return { hash, type, message }
    })
}

function generateMainReleaseNotes(commits: Commit[], version: string): string {
  const features = commits.filter((c) => c.type === 'feat')
  const fixes = commits.filter((c) => c.type === 'fix')
  const others = commits.filter((c) => !['feat', 'fix'].includes(c.type))

  let notes = `# Summary

We've updated the app to fix bugs, enhance our features, and improve overall performance.

`

  if (features.length > 0) {
    notes += `## Features

${features.map((c) => `${c.hash} ${c.message}`).join('\n')}

`
  }

  if (fixes.length > 0) {
    notes += `## Bug Fixes

${fixes.map((c) => `${c.hash} ${c.message}`).join('\n')}

`
  }

  if (others.length > 0) {
    notes += `## Other

${others.map((c) => `${c.hash} ${c.message}`).join('\n')}
`
  }

  return notes.trim()
}

function generatePatchReleaseNotes(commits: Commit[], version: string): string {
  const [major, minor, patch] = version.split('.')
  const previousVersion = `${major}.${minor}.${parseInt(patch) - 1}`

  return `# Summary

This release is a patch on top of v${previousVersion}, with additional commits.

## Commits included

${commits.map((c) => `${c.hash} ${c.message}`).join('\n')}
`
}

function main() {
  const { lastTag: userProvidedLastTag, toRef } = argv

  const packageJson = require('../package.json')
  const currentVersion = packageJson.version

  log(chalk.blue(`Generating release notes for ${currentVersion}...`))

  const lastTag = userProvidedLastTag || getLastTag()
  log(chalk.green(`Using last tag: ${lastTag}`))

  const tagPrefix = getTagPrefix(lastTag)
  log(chalk.green(`Detected tag prefix: "${tagPrefix}"`))

  let commits = getCommits(lastTag, toRef)
  log(chalk.green(`Found ${commits.length} commits`))

  // Determine if it's a patch release
  const isPatchRelease = currentVersion.split('.')[2] !== '0'

  if (!isPatchRelease) {
    // For main releases, remove cherry-picked commits from the previous main release
    const [major, minor] = currentVersion.split('.')
    const lastMainTag = `${tagPrefix}${major}.${parseInt(minor) - 1}.0`

    if (lastMainTag !== lastTag) {
      const possibleCherryPickedCommits = getCommits(lastMainTag, lastTag)
      const possibleCherryPickedMessages = new Set(
        possibleCherryPickedCommits.map((commit) => commit.message)
      )
      const cherryPickedCommits = commits.filter((commit) =>
        possibleCherryPickedMessages.has(commit.message)
      )
      commits = commits.filter((commit) => !possibleCherryPickedMessages.has(commit.message))
      log(chalk.yellow(`Possible cherry-picked commits: ${possibleCherryPickedCommits.length}`))
      log(chalk.yellow(`Skipping ${cherryPickedCommits.length} cherry-picked commits`))
      cherryPickedCommits.forEach((commit) => {
        log(chalk.yellow(`  ${commit.hash} ${commit.message}`))
      })
    }
  }

  const releaseNotes = isPatchRelease
    ? generatePatchReleaseNotes(commits, currentVersion)
    : generateMainReleaseNotes(commits, currentVersion)

  // Output release notes to stdout
  console.log(releaseNotes)

  log(chalk.green('Release notes generated successfully'))
}

main()
