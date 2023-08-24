const fs = require('fs')

const INPUT_PATH = process.env.INPUT_PATH
const OUTPUT_PATH = process.env.OUTPUT_PATH

function extractEnumValues(content) {
  const enumValues = content.match(/export enum (\w+) {([\s\S]*?)}/g)
  return enumValues || []
}

function generateEventDocs(enumValues) {
  const eventDocs = {}
  const enumNames = []
  enumValues.forEach((enumValue) => {
    const enumName = enumValue.match(/export enum (\w+) {/)[1]
    enumNames.push(enumName)

    const enumItems = enumValue.match(/(\w+)\s=\s'(\w+)',(\s\/\/(.+))?/g)
    if (enumItems) {
      enumItems.forEach((item) => {
        const [, itemName, itemValue, comment] = item.match(
          /(\w+)\s*=\s*'(.+?)'\s*,?(\s*\/\/(.+))?$/
        )
        eventDocs[`${enumName}.${itemName}`] = comment ? comment.replace('// ', '').trim() : ''
      })
    }
  })
  return { eventDocs, enumNames }
}

function outputEventDocs({ eventDocs, enumNames }) {
  let output = `import { AnalyticsEventType } from 'src/analytics/Properties'\n\n`
  output += `import {\n  ${enumNames.join(',\n  ')}\n} from 'src/analytics/Events'\n\n`
  output += 'export const eventDocs: Record<AnalyticsEventType, string> = {\n'
  for (const [event, comment] of Object.entries(eventDocs)) {
    output += `  [${event}]: \`${comment}\`,\n`
  }
  output += '}\n'
  return output
}

fs.readFile(INPUT_PATH, 'utf8', (err, content) => {
  if (err) {
    console.error('Error reading file:', err)
    return
  }

  const enumValues = extractEnumValues(content)
  const eventDocs = generateEventDocs(enumValues)
  const output = outputEventDocs(eventDocs)

  fs.writeFile(OUTPUT_PATH, output, (err) => {
    if (err) {
      console.error('Error writing file:', err)
    } else {
      console.log(`Event documentation written to ${OUTPUT_PATH}`)
    }
  })
})
