// This script uses JSDoc annotations to get TypeScript checks
// Why aren't we using TypeScript directly here?
// `actions/github-script` doesn't support TypeScript scripts directly :/

/**
 * Note: we can remove typeof below once we upgrade TypeScript
 * otherwise we get a crash, see https://github.com/microsoft/TypeScript/issues/36830
 * @typedef {ReturnType<typeof import('@actions/github').getOctokit>} GitHub
 * @typedef {import('@actions/github').context} Context
 */

const CROWDIN_BRANCH = 'l10n/develop'
const CROWDIN_PR_USER = 'kolektivo-translate'
const AUTOMERGE_LABEL = 'automerge'

const ALLOWED_UPDATED_FILE_MATCHER = `locales\/.*\/translation\.json`
const DISALLOWED_UPDATED_FILE = 'locales/base/translation.json'

/**
 * @param {Object} obj - An object.
 * @param {GitHub} obj.github
 * @param {Context} obj.context
 */
module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo

  console.log('Looking for Crowdin PR')
  const listPrs = await github.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    head: `${context.repo.owner}:${CROWDIN_BRANCH}`,
  })
  // As of writing this, github-script uses node 12 which doesn't support optional chaining (pr.user?.login)
  const pr = listPrs.data.filter((pr) => pr.user && pr.user.login === CROWDIN_PR_USER)[0]
  if (!pr) {
    console.log('No Crowdin PR found')
    return
  }

  console.log(`Verifying that only expected files are modified for PR #${pr.number}`)
  const listFiles = await github.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pr.number,
  })
  const unexpectedFiles = listFiles.data.filter(
    ({ filename }) =>
      filename === DISALLOWED_UPDATED_FILE ||
      !filename.match(new RegExp(ALLOWED_UPDATED_FILE_MATCHER))
  )
  if (unexpectedFiles.length > 0) {
    console.log(
      `Files updated in PR #${pr.number} do not match the expectation, please check manually`
    )
    await github.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      event: 'REQUEST_CHANGES',
      body: `Changes requested from [${context.workflow} #${context.runNumber}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}), as the updated files in this PR did not match the expectation. Please check.`,
    })
    return
  }

  console.log(`Fetching reviews for ${pr.number}`)
  const listReviews = await github.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pr.number,
  })
  const isReviewed = listReviews.data.some(
    (review) => review.state === 'APPROVED' || review.state === 'REQUEST_CHANGES'
  )
  if (!isReviewed) {
    console.log(`Approving Crowdin PR: ${pr.number}`)
    await github.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      event: 'APPROVE',
      body: `Approved from [${context.workflow} #${context.runNumber}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}).`,
    })
  } else {
    console.log(`Already reviewed`)
  }

  const hasAutomergeLabel = pr.labels.some((label) => label.name === AUTOMERGE_LABEL)
  if (!hasAutomergeLabel) {
    console.log(`Adding ${AUTOMERGE_LABEL} label`)
    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: [AUTOMERGE_LABEL],
    })
  } else {
    console.log(`Already labelled with ${AUTOMERGE_LABEL}`)
  }
  console.log('Done')
}
