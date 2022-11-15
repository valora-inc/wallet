import { config, echo, env, exec, ShellString } from 'shelljs'

config.fatal = true

const branchName = new ShellString(env.BRANCH_NAME ?? '')
const VALORA_BOT_TOKEN = new ShellString(env.VALORA_BOT_TOKEN ?? '')

// ensure that we are using ssh
exec('git remote set-url origin git@github.com:valora-inc/wallet.git')

echo('Create version bump branch from main')
exec(`git checkout -b ${branchName}`)

echo('Bump app version')
exec('yarn pre-deploy --minor')

const appVersion = exec('node -p "require(\'./package.json\').version"')

echo('Push changes to branch')
exec('git add .')
exec('git commit -m "Bump app version to $app_version"')
exec(`git push --set-upstream origin ${branchName}`)

echo('Open version bump PR')
exec(
  `
  curl -u "valora-bot:${VALORA_BOT_TOKEN}" \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/valora-inc/wallet/pulls \
  -d '${JSON.stringify({
    head: branchName,
    base: 'main',
    title: `chore: bump app version to ${appVersion}`,
  })}'
`
)
