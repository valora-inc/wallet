import { config, echo } from 'shelljs'

config.fatal = true

// matches all translation.json and InfoPlist.strings files except for the base ones
const TRANSLATION_FILES = new RegExp(
  /^locales\/(?!base\/)[^\/]+\/translation\.json$|^ios\/celo\/(?!Base\b)\w+\.lproj\/InfoPlist\.strings$/
)

echo('Checking modified files')
const updatedFilenames = process.argv[2]
echo(`argv 2 ${updatedFilenames}`)
const modifiedTranslationFiles = updatedFilenames.split(',').filter((filename) => {
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
