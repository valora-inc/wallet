import * as fs from 'fs-extra'
import * as yargs from 'yargs'
const { createCoverageMap } = require('istanbul-lib-coverage')
const { createReporter } = require('istanbul-api')
const rimraf = require('rimraf')

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function main() {
  const argv = yargs.options({
    report: {
      type: 'array',
      desc: 'Path of json coverage report file',
      demandOption: true,
    },
    reporters: {
      type: 'array',
      default: ['json', 'lcov', 'clover'],
    },
  }).argv

  const reportFiles = argv.report as string[]
  const reporters = argv.reporters as string[]

  const map = createCoverageMap({})

  reportFiles.forEach((file) => {
    const r = fs.readJsonSync(file)
    map.merge(r)
    // Remove individual coverage directories reports after combination
    rimraf.sync(file.split('/coverage-final.json')[0])
  })

  const reporter = createReporter()
  reporter.addAll(reporters)
  reporter.write(map)
  console.log('Created a merged coverage report in ./coverage')
}
