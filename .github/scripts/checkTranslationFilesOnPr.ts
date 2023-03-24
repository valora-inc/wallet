import { config, echo, exec } from 'shelljs'

config.fatal = true

// matches all translation.json and InfoPlist.strings files except for the base ones
const TRANSLATION_FILES = new RegExp(
  /^locales\/(?!base\/)[^\/]+\/translation\.json$|^ios\/celo\/(?!Base\b)\w+\.lproj\/InfoPlist\.strings$/
)

echo('Checking modified files')
const updatedFilenames = exec('git diff --name-only origin/main HEAD', {
  silent: true,
}).stdout.split(/\n/)
const modifiedTranslationFiles = updatedFilenames.filter((filename) => {
  return filename.match(TRANSLATION_FILES)
})

if (modifiedTranslationFiles.length > 0) {
  echo(
    `❌ Only base translation files should be modified! The following files should not be modified:`
  )
  echo(modifiedTranslationFiles.join('\n'))
  process.exit(1)
}

echo('✅ All good to go 🚀')
