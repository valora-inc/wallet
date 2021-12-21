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

/**
 * @param {Object} obj - An object.
 * @param {GitHub} obj.github
 * @param {Context} obj.context
 */
module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo

  console.log('Looking for Crowdin PR')
  const res = await github.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    head: `${context.repo.owner}:${CROWDIN_BRANCH}`,
  })
  const pr = res.data.filter((pr) => pr.user?.login === CROWDIN_PR_USER)[0]
  if (!pr) {
    console.log('No Crowdin PR found')
    return
  }

  console.log(`Approving Crowdin PR: ${pr.number}`)
  await github.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pr.number,
    event: 'APPROVE',
    body: `Approved from the ${context.workflow} workflow.`,
  })

  console.log('Adding automerge label')
  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pr.number,
    labels: ['automerge'],
  })
  console.log('Done')
}
