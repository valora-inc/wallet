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
const TRANSLATION_USERS = ['mpgaarciaa', 'lukasawagner']
const BASE_TRANSLATION_FILENAME = 'packages/mobile/locales/base/translation.json'

/**
 * @param {Object} obj - An object.
 * @param {GitHub} obj.github
 * @param {Context} obj.context
 */
module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo

  console.log('Looking for translation PRs')
  const listPrs = await github.rest.pulls.list({
    owner,
    repo,
    state: 'open',
  })
  // As of writing this, github-script uses node 12 which doesn't support optional chaining (pr.user?.login)
  const translationPrs = listPrs.data.filter(
    (pr) => pr.user && TRANSLATION_USERS.includes(pr.user.login)
  )

  if (!translationPrs.length) {
    console.log('No translation PRs found')
    return
  }

  for (const translationPr of translationPrs) {
    console.log(`Verifying that only base translations are modified for ${translationPr.number}`)
    const listFiles = await github.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: translationPr.number,
    })

    if (listFiles.data.length > 1 || listFiles.data[0].filename !== BASE_TRANSLATION_FILENAME) {
      console.log(`${translationPr.number} has more than base translations modified, skipping...`)
      continue
    }

    console.log(`Fetching reviews for ${translationPr.number}`)
    const listReviews = await github.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: translationPr.number,
    })
    const isApproved = listReviews.data.some((review) => review.state === 'APPROVED')
    if (!isApproved) {
      console.log(`Approving translation PR: ${translationPr.number}`)
      await github.rest.pulls.createReview({
        owner,
        repo,
        pull_number: translationPr.number,
        event: 'APPROVE',
        body: `Approved from [${context.workflow} #${context.runNumber}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}).`,
      })
    } else {
      console.log(`Already approved`)
    }

    const hasAutomergeLabel = translationPr.labels.some((label) => label.name === AUTOMERGE_LABEL)
    if (!hasAutomergeLabel) {
      console.log(`Adding ${AUTOMERGE_LABEL} label`)
      await github.rest.issues.addLabels({
        owner,
        repo,
        issue_number: translationPr.number,
        labels: [AUTOMERGE_LABEL],
      })
    } else {
      console.log(`Already labelled with ${AUTOMERGE_LABEL}`)
    }
  }

  console.log('Done')
}
