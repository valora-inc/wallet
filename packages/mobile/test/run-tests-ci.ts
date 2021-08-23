import { execSync } from 'child_process'
import glob from 'glob'
import { uniqueId } from 'lodash'

const shell = (cmd: string) => execSync(cmd, { stdio: 'inherit' })

const run = async () => {
  console.info(
    'Running tests in batches to avoid memory leak issue... this means you will see jest start up multiple times.'
  )

  const files = await glob.sync('./**/*.test.{tsx,ts}')

  const batchSize = 40
  let batch: string[] = []
  const runBatch = () => {
    if (batch.length) {
      shell(
        `jest ${batch.join(' ')} --silent --coverageDirectory=./coverage/${uniqueId()} --coverage`
      )
      batch = []
    }
  }

  for (const file of files) {
    batch.push(file)
    if (batch.length === batchSize) {
      runBatch()
    }
  }

  runBatch()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
