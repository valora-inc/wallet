// This script uses JSDoc annotations to get TypeScript checks
// Why aren't we using TypeScript directly here?
// `actions/github-script` doesn't support TypeScript scripts directly :/

/**
 * Note: we can remove typeof below once we upgrade TypeScript
 * otherwise we get a crash, see https://github.com/microsoft/TypeScript/issues/36830
 * @typedef {ReturnType<typeof import('@actions/github').getOctokit>} GitHub
 * @typedef {import('@actions/github').context} Context
 */

const enableAutomergeQuery = `mutation ($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
  enablePullRequestAutoMerge(input: {
    pullRequestId: $pullRequestId,
    mergeMethod: $mergeMethod
  }) {
    pullRequest {
      autoMergeRequest {
        enabledAt
      }
    }
  }
}`

/**
 * @param {Object} obj - An object.
 * @param {GitHub} obj.github
 * @param {Context} obj.context
 */
module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo
  const { BRANCH_NAME } = process.env

  console.log(`Looking for PR with branch name ${BRANCH_NAME}`)
  const listPrs = await github.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    head: `${context.repo.owner}:${BRANCH_NAME}`,
  })
  const pr = listPrs.data[0]

  if (!pr) {
    console.log(`No PR with branch name ${BRANCH_NAME} found`)
    return
  }

  console.log(`Enabling automerge on PR #${pr.number}`)
  await github.graphql(enableAutomergeQuery, {
    pullRequestId: pr.node_id,
    mergeMethod: 'SQUASH',
  })

  console.log('Done')
}
