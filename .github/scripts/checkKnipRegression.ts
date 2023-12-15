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
  baseKnipResults: Record<string, number>,
  branchKnipResults: Record<string, number>
): boolean {
  let shouldFail = false
  const rows: Array<Record<string, string | number>> = []
  for (const [category, baseProblems] of Object.entries(baseKnipResults)) {
    const branchProblems = branchKnipResults[category] ?? 0
    rows.push({
      'Issue Category': category.trim(),
      'Base Branch': baseProblems,
      'PR Branch': branchProblems,
    })
    if (branchProblems > baseProblems) {
      shouldFail = true
    }
  }
  console.table(rows)
  return shouldFail
}

if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
  const branchKnipOutput = $.exec('yarn knip --no-gitignore').stdout.trim()
  const branchKnipResults = parseKnipOutput(branchKnipOutput)

  // checkout pr base. More info here: https://github.com/actions/checkout/tree/v3?tab=readme-ov-file#checkout-v3
  $.exec('git checkout HEAD^')

  const baseKnipOutput = $.exec('yarn knip --no-gitignore').stdout.trim()
  const baseKnipResults = parseKnipOutput(baseKnipOutput)

  if (compareKnipResults(baseKnipResults, branchKnipResults)) {
    console.log('Knip check failed. PR branch reported more problems than base branch.')
    process.exit(1)
  }
}

process.exit(0)
