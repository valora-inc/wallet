import * as fs from 'fs'
import * as $ from 'shelljs'

$.config.fatal = true

// Adapted from https://github.com/EmergeTools/emerge-upload-action/blob/d2f4fc1627edd5b8c346d75d77565da83a97f443/src/inputs.ts
function getGitHubInfo() {
  // On PRs, the GITHUB_SHA refers to the merge commit instead
  // of the commit that triggered this action.
  // Therefore, on a PR we need to explicitly get the head sha from the event json data.
  let sha
  let baseSha
  let branchName
  let prNumber
  const eventFile = fs.readFileSync(process.env.GITHUB_EVENT_PATH ?? '', {
    encoding: 'utf8',
  })
  const eventFileJson = JSON.parse(eventFile)
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    sha = eventFileJson?.pull_request?.head?.sha ?? process.env.GITHUB_SHA ?? ''
    baseSha = eventFileJson?.pull_request?.base?.sha ?? ''
    branchName = process.env.GITHUB_HEAD_REF ?? ''
    prNumber = eventFileJson?.number ?? ''

    if (!prNumber) {
      throw new Error('Could not get prNumber for a PR triggered build.')
    }
  } else if (process.env.GITHUB_EVENT_NAME === 'push') {
    sha = process.env.GITHUB_SHA ?? ''
    // Get the SHA of the previous commit, which will be the baseSha in the case of a push event.
    baseSha = eventFileJson?.before ?? ''
    branchName = process.env.GITHUB_REF_NAME ?? ''
  } else if (process.env.GITHUB_EVENT_NAME === 'merge_group') {
    sha = process.env.GITHUB_SHA ?? ''
    // Get the SHA of the base commit, which will be the base_sha in the case of a merge_group event.
    baseSha = eventFileJson?.merge_group?.base_sha ?? ''
    branchName = process.env.GITHUB_REF_NAME ?? ''
  } else {
    throw new Error(`Unsupported action trigger: ${process.env.GITHUB_EVENT_NAME}`)
  }

  if (!sha) {
    throw new Error('Could not get SHA of the head branch.')
  }
  if (!baseSha) {
    throw new Error('Could not get SHA of the base branch.')
  }
  if (!branchName) {
    throw new Error('Could not get name of the branch.')
  }

  const repoName = process.env.GITHUB_REPOSITORY ?? ''
  if (repoName === '') {
    throw new Error('Could not get repository name.')
  }

  return {
    sha,
    baseSha,
    repoName,
    prNumber,
    branchName,
  }
}

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
  pr_number:${prNumber || ''} \
  build_type:e2e
`)
