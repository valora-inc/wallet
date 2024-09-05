import { appendFileSync } from 'fs'
import { config, exec, exit } from 'shelljs'

config.fatal = true
config.verbose = true

const GITHUB_ENV = process.env.GITHUB_ENV
if (!GITHUB_ENV) {
  console.error('Error: GITHUB_ENV is not set')
  exit(1)
}

const CURRENT_RELEASE_SHA = process.env.CURRENT_RELEASE_SHA
if (!CURRENT_RELEASE_SHA) {
  console.error('Error: CURRENT_RELEASE_SHA is not set')
  exit(1)
}

const nightlyTagName = 'nightly'

console.log('Get previous nightly release commit')
const previousReleaseSha = exec(`git show-ref -s tags/${nightlyTagName}`, {
  silent: true,
}).stdout.trim()

const commitMessages = exec(
  `git rev-list "${previousReleaseSha}..${CURRENT_RELEASE_SHA}" --oneline`,
  {
    silent: true,
  }
).stdout.trim()

console.log(
  `Store commits between previous release ${previousReleaseSha} and current release ${CURRENT_RELEASE_SHA}`
)
appendFileSync(GITHUB_ENV, `RELEASE_NOTES<<EOF\n${commitMessages}\nEOF\n`)

console.log('Delete previous nightly release tag')
exec(`git tag -d ${nightlyTagName}`)
// --no-verify to bypass pre-push script in wallet that is preventing tag deletion
exec(`git push origin --delete tags/${nightlyTagName} --no-verify`)

console.log('Tag new nightly release')
exec(`git tag ${nightlyTagName} "${CURRENT_RELEASE_SHA}"`)
exec('git push origin --tags')
