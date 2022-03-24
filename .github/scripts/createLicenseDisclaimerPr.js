const { echo, cd, exec, ShellString, env } = require('shelljs')

const branchName = new ShellString(env.BRANCH_NAME)

cd('packages/mobile')

// ensure that we are using ssh
exec('git remote set-url origin git@github.com:valora-inc/wallet.git')

echo('Create version bump branch from main')
exec(`git checkout -b ${branchName}`, { fatal: true })

echo('Generate licences and disclaimer')
exec('yarn deploy:update-disclaimer', { fatal: true })

echo('Push changes to branch')
exec('git add .')
exec('git config user.email "valorabot@valoraapp.com"')
exec('git config user.name "valora-bot"')
exec('git commit -m "Update licenses and disclaimer"')
exec(`git push --set-upstream origin ${branchName}`, { fatal: true })

echo('Open licenses and disclaimer PR')
exec(
  `
  curl -u "valora-bot:$VALORA_BOT_TOKEN" \
    -X POST \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/valora-inc/wallet/pulls \
    -d '{ "head": "'${branchName}'", "base": "main", "title": "Update licenses and disclaimer" }'
`,
  { fatal: true }
)
