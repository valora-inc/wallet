function groupNumber(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))(?<!\.\d*)/g, 'group')
}

function actualTest(value: string, decimalSeparator: string, groupingSeparator: string) {
  return groupNumber(value).replaceAll('.', decimalSeparator).replaceAll('group', groupingSeparator)
}

console.log(actualTest('1.234.567,9999', ',', '.')) // 1,234,567.9999
