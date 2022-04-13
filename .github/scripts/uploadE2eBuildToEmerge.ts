import * as fs from 'fs'
import * as $ from 'shelljs'

$.config.fatal = true

function getPRNumber(refName: string): string | undefined {
  if (refName === '') {
    return undefined
  }

  if (!refName.includes('pull')) {
    return undefined
  }

  const splits = refName.split('/')
  return splits[2]
}

// Adapted from https://github.com/EmergeTools/emerge-upload-action/blob/d2f4fc1627edd5b8c346d75d77565da83a97f443/src/inputs.ts
function getGitHubInfo() {
  // On PRs, the GITHUB_SHA refers to the merge commit instead
  // of the commit that triggered this action.
  // Therefore, on a PR we need to explicitly get the head sha from the event json data.
  let sha
  let baseSha
  let branchName
  const eventFile = fs.readFileSync(process.env.GITHUB_EVENT_PATH ?? '', {
    encoding: 'utf8',
  })
  const eventFileJson = JSON.parse(eventFile)
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    sha = eventFileJson?.pull_request?.head?.sha ?? process.env.GITHUB_SHA ?? ''
    baseSha = eventFileJson?.pull_request?.base?.sha ?? ''
    branchName = process.env.GITHUB_HEAD_REF ?? ''
  } else if (process.env.GITHUB_EVENT_NAME === 'push') {
    sha = process.env.GITHUB_SHA ?? ''
    // Get the SHA of the previous commit, which will be the baseSha in the case of a push event.
    baseSha = eventFileJson?.before ?? ''

    const ref = process.env.GITHUB_REF ?? ''
    if (ref !== '') {
      const refSplits = ref.split('/')
      branchName = refSplits[refSplits.length - 1]
    }
  } else {
    throw new Error(`Unsupported action trigger: ${process.env.GITHUB_EVENT_NAME}`)
  }

  if (!sha) {
    throw new Error('Could not get SHA of the head branch.')
  }
  if (!baseSha) {
    throw new Error('Could not get SHA of the base branch.')
  }
  // branchName is optional, so we won't fail if not present
  if (!branchName) {
    // Explicitly set to undefined so we won't send an empty string to the Emerge API
    branchName = undefined
  }

  const repoName = process.env.GITHUB_REPOSITORY ?? ''
  if (repoName === '') {
    throw new Error('Could not get repository name.')
  }

  // Required for PRs
  const refName = process.env.GITHUB_REF ?? ''
  const prNumber = getPRNumber(refName)
  if (refName.includes('pull') && !prNumber) {
    throw new Error('Could not get prNumber for a PR triggered build.')
  }

  return {
    sha,
    baseSha,
    repoName,
    prNumber,
    branchName,
  }
}

$.cd('packages/mobile')

const { sha, baseSha, repoName, prNumber, branchName } = getGitHubInfo()

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' }))
const filePath = packageJson.detox.apps[process.env.DETOX_CONFIG ?? ''].binaryPath

// Note: we're not using the Emerge GitHub Action directly because it doesn't support packaging .app into a xcarchive
// The fastlane action does support it though
// Also this requires the EMERGE_API_TOKEN env var to be set
$.exec(`bundle exec fastlane run emerge \
  file_path:${filePath} \
  repo_name:${repoName} \
  sha:${sha} \
  base_sha:${baseSha} \
  branch:${branchName} \
  pr_number:${prNumber} \
  build_type:e2e
`)
