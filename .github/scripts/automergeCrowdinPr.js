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

const ALLOWED_UPDATED_FILE_MATCHER = new RegExp(
  `locales\/.*\/translation\.json|ios/MobileStack\/.*\/InfoPlist.strings`
)
const DISALLOWED_UPDATED_FILES = [
  'locales/base/translation.json',
  'ios/MobileStack/Base.lproj/InfoPlist.strings',
]
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

  console.log(`Fetching reviews for ${pr.number}`)
  const listReviews = await github.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pr.number,
  })
  const isRejected = listReviews.data.some((review) => review.state === 'REQUEST_CHANGES')
  const isApproved = listReviews.data.some((review) => review.state === 'APPROVED')

  if (isRejected) {
    console.log('Changes requested for this PR already, ending workflow')
    return
  }

  // often the base translation file shows as changed due to the crowdin PR
  // becoming out of date with main, so update the branch before checking
  // the files changed
  console.log(`Bringing PR #${pr.number} up to date with main branch`)
  await github.rest.pulls.updateBranch({
    owner,
    repo,
    pull_number: pr.number,
  })

  if (isApproved) {
    console.log('Already approved')
  } else {
    // wait until the branch is properly updated
    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log(`Verifying that only expected files are modified for PR #${pr.number}`)
    const listFiles = await github.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr.number,
    })
    const unexpectedFiles = listFiles.data.filter(
      ({ filename }) =>
        DISALLOWED_UPDATED_FILES.includes(filename) || !filename.match(ALLOWED_UPDATED_FILE_MATCHER)
    )
    if (unexpectedFiles.length > 0) {
      console.log(
        `The following files updated do not match the expectation: 
        ${unexpectedFiles.map((file) => file.filename).join('\n')}.
        Please check manually.`
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

    console.log(`Approving Crowdin PR: ${pr.number}`)
    await github.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      event: 'APPROVE',
      body: `Approved from [${context.workflow} #${context.runNumber}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}).`,
    })
  }

  console.log(`Enabling automerge on PR #${pr.number}`)
  await github.graphql(enableAutomergeQuery, {
    pullRequestId: pr.node_id,
    mergeMethod: 'SQUASH',
  })

  console.log('Done')
}
