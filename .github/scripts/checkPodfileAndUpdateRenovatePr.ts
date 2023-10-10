import * as $ from 'shelljs'

const RENOVATE_USER = 'renovate[bot]'

const exitCode = $.exec('git diff --exit-code').code
if (exitCode === 0) {
  console.log('No diff found')
  process.exit(0)
}

console.log('Diff found')

$.config.fatal = true

const lastCommitAuthor = $.exec('git log -1 --pretty=format:%an', { silent: true }).stdout.trim()
const branchName = process.env.GITHUB_HEAD_REF

// Check if this is invoked from a PR, branch name starts with renovate and the
// last commit was from renovate (to avoid infinite loop, in case a diff is
// generated every time).
if (
  process.env.GITHUB_EVENT_NAME === 'pull_request' &&
  branchName?.startsWith('renovate/') &&
  lastCommitAuthor === RENOVATE_USER
) {
  console.log('Renovate PR, pushing Podfile changes')
  // Since github checkouts the PR as a single "merge commit", this doesn't have
  // the complete PR branch. Stash the changes and reset the branch to the HEAD
  // of the PR and apply changes on top.
  $.exec('git stash')
  $.exec('git remote set-url origin git@github.com:valora-inc/wallet.git')
  $.exec(`git checkout -b ${branchName}`)
  $.exec('git fetch')
  $.exec(`git reset --hard origin/${branchName}`)
  $.exec('git stash pop')
  // this assumes the diff is from Podfile.lock only
  $.exec('git add ios/Podfile.lock')
  $.exec('git config user.email "valorabot@valoraapp.com"')
  $.exec('git config user.name "valora-bot"')
  $.exec('git commit -m "update podfile.lock"')

  // ensure that we are using ssh
  $.exec(`git push --set-upstream origin ${branchName}`)
} else {
  console.log('Not a renovate PR')
}

// Exit with non-zero exit code regardless, since a new commit on the renovate
// PR will trigger a new job anyway.
process.exit(exitCode)
