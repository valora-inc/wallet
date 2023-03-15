const colors = {
  bold: [1, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  white: [37, 39],
  grey: [90, 39],
  black: [30, 39],
  blue: [34, 39],
  cyan: [36, 39],
  green: [32, 39],
  magenta: [35, 39],
  red: [31, 39],
  yellow: [33, 39],
}

/**
 * Add colors to the specified string, for colorized output in terminals
 */
export function stylize(str: string, color: keyof typeof colors) {
  if (!str) {
    return ''
  }

  const codes = colors[color]
  if (codes) {
    return '\x1B[' + codes[0] + 'm' + str + '\x1B[' + codes[1] + 'm'
  }
  return str
}
