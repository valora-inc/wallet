// This script uses JSDoc annotations to get TypeScript checks
// Why aren't we using TypeScript directly here?
// `actions/github-script` doesn't support TypeScript scripts directly :/

/**
 * Note: we can remove typeof below once we upgrade TypeScript
 * otherwise we get a crash, see https://github.com/microsoft/TypeScript/issues/36830
 * @typedef {ReturnType<typeof import('@actions/github').getOctokit>} GitHub
 * @typedef {import('@actions/github').context} Context
 */

const CROWDIN_BRANCH = 'l10n/main'
const CROWDIN_PR_USER = 'valora-bot-crowdin'
const AUTOMERGE_LABEL = 'automerge'

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
  const pr = listPrs.data.filter((pr) => pr.user?.login === CROWDIN_PR_USER)[0]
  if (!pr) {
    console.log('No Crowdin PR found')
    return
  }

  console.log(`Fetching reviews for ${pr.number}`)
  const listReviews = await github.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pr.number,
  })
  const isApproved = listReviews.data.some((review) => review.state === 'APPROVED')
  if (!isApproved) {
    console.log(`Approving Crowdin PR: ${pr.number}`)
    await github.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      event: 'APPROVE',
      body: `Approved from the '${context.workflow}' workflow.`,
    })
  } else {
    console.log(`Already approved`)
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
