/**
 * A fake GraphQL template literal tag that turns GraphQL queries into just the original query string.
 * It helps with syntax highlighting and formatting.
 */
export function gql(strings: TemplateStringsArray, ...values: any[]): string {
  // Using String.raw to get the raw string representation
  return String.raw(strings, ...values)
}
