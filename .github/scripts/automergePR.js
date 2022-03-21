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
  const { BRANCH_NAME, EXPECTED_UPDATED_FILES } = process.env
  // As of writing this, github-script uses node 12 which doesn't support optional chaining (pr.user?.login)
  const expectedUpdatedFiles = EXPECTED_UPDATED_FILES ? EXPECTED_UPDATED_FILES.split(',') : []

  console.log('======expectedUpdatedFiles', expectedUpdatedFiles)

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

  console.log(`Verifying that expected files are modified for ${pr.number}`)
  const listFiles = await github.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pr.number,
  })

  console.log('======listFiles', listFiles)

  console.log(
    '======listFiles some files updated are not expected',
    listFiles.data.some(({ filename }) => !expectedUpdatedFiles.includes(filename))
  )

  if (
    listFiles.data.length !== expectedUpdatedFiles.length ||
    listFiles.data.some(({ filename }) => !expectedUpdatedFiles.includes(filename))
  ) {
    console.log(`${pr.number} has more than expected files modified`)
    return
  }

  console.log(`Approving PR #${pr.number}`)
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
