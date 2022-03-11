// This script uses JSDoc annotations to get TypeScript checks
// Why aren't we using TypeScript directly here?
// `actions/github-script` doesn't support TypeScript scripts directly :/

/**
 * Note: we can remove typeof below once we upgrade TypeScript
 * otherwise we get a crash, see https://github.com/microsoft/TypeScript/issues/36830
 * @typedef {ReturnType<typeof import('@actions/github').getOctokit>} GitHub
 * @typedef {import('@actions/github').context} Context
 */

const AUTOMERGE_LABEL = 'automerge'

/**
 * @param {Object} obj - An object.
 * @param {GitHub} obj.github
 * @param {Context} obj.context
 */
module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo
  const { BRANCH_NAME } = process.env

  console.log('Looking for version bump PR')
  const listPrs = await github.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    head: `${context.repo.owner}:${BRANCH_NAME}`,
  })
  const pr = listPrs.data[0]

  if (!pr) {
    console.log('No version bump PR found')
    return
  }

  console.log(`Approving PR: ${pr.number}`)
  await github.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pr.number,
    event: 'APPROVE',
    body: `Approved from [${context.workflow} #${context.runNumber}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}).`,
  })

  console.log(`Adding ${AUTOMERGE_LABEL} label`)
  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pr.number,
    labels: [AUTOMERGE_LABEL],
  })

  console.log('Done')
}
