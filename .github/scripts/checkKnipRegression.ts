import * as $ from 'shelljs'

const SECTION_REGEX = /[a-zA-Z ]+\([0-9]+\)/
const CATEGORY_REGEX = /[a-zA-Z ]+/
const PARENS_REGEX = /\(|\)| /

function parseKnipOutput(knipOutput: string): Record<string, number> {
  const lines = knipOutput.split('\n')
  const result: Record<string, number> = {}
  for (const line of lines) {
    if (SECTION_REGEX.test(line)) {
      const tokens = line.split(PARENS_REGEX)
      const category = (line.match(CATEGORY_REGEX) as RegExpMatchArray)[0]
      result[category] = parseInt(tokens[tokens.length - 2])
    }
  }
  return result
}

function compareKnipResults(
  mainKnipResults: Record<string, number>,
  branchKnipResults: Record<string, number>
): boolean {
  let shouldFail = false
  const rows: Array<Record<string, string | number>> = []
  for (const [category, mainProblems] of Object.entries(mainKnipResults)) {
    const branchProblems = branchKnipResults[category] ?? 0
    rows.push({
      'Issue Category': category.trim(),
      'Main Branch': mainProblems,
      'PR Branch': branchProblems,
    })
    if (branchProblems > mainProblems) {
      shouldFail = true
    }
  }
  console.table(rows)
  return shouldFail
}

if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
  const branchName = process.env.GITHUB_HEAD_REF

  const branchKnipOutput = $.exec('yarn knip --no-gitignore').stdout.trim()
  const branchKnipResults = parseKnipOutput(branchKnipOutput)

  $.exec('git checkout HEAD^') // this should be the PR base branch

  const mainKnipOutput = $.exec('yarn knip --no-gitignore').stdout.trim()
  const mainKnipResults = parseKnipOutput(mainKnipOutput)

  if (compareKnipResults(mainKnipResults, branchKnipResults)) {
    console.log('Knip check failed. Branch reported more problems than main.')
    process.exit(1)
  }
}

process.exit(0)
