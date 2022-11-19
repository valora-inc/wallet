import { config, echo, env, exec, ShellString } from 'shelljs'

config.fatal = true

const branchName = new ShellString(env.BRANCH_NAME ?? '')
const VALORA_BOT_TOKEN = new ShellString(env.VALORA_BOT_TOKEN ?? '')

// ensure that we are using ssh
exec('git remote set-url origin git@github.com:valora-inc/wallet.git')

echo('Create version bump branch from main')
exec(`git checkout -b ${branchName}`)

echo('Generate licences and disclaimer')
exec('yarn deploy:update-disclaimer')

config.fatal = false
if (exec('git diff --exit-code', { silent: true }).code === 0) {
  console.log('LicenseDisclaimer.txt unchanged')
  process.exit(0)
}
config.fatal = true

echo('Push changes to branch')
exec('git add .')
exec('git config user.email "valorabot@valoraapp.com"')
exec('git config user.name "valora-bot"')
exec('git commit -m "Update licenses and disclaimer"')
exec(`git push --set-upstream origin ${branchName}`)

echo('Open licenses and disclaimer PR')
exec(
  `
  curl -u "valora-bot:${VALORA_BOT_TOKEN}" \
    -X POST \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/valora-inc/wallet/pulls \
    -d '${JSON.stringify({
      head: branchName,
      base: 'main',
      title: 'chore: update licenses and disclaimer',
    })}'
`
)
