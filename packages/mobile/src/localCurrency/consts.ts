// Supported local currency codes
// Please keep it sorted alphabetically
export enum LocalCurrencyCode {
  AUD = 'AUD',
  BRL = 'BRL',
  CAD = 'CAD',
  COP = 'COP',
  CVE = 'CVE',
  EUR = 'EUR',
  GBP = 'GBP',
  GHS = 'GHS',
  KES = 'KES',
  LRD = 'LRD',
  MXN = 'MXN',
  NGN = 'NGN',
  PHP = 'PHP',
  RUB = 'RUB',
  SLL = 'SLL',
  TRY = 'TRY',
  UAH = 'UAH',
  UGX = 'UGX',
  USD = 'USD',
}

export enum LocalCurrencySymbol {
  AUD = 'A$',
  BRL = 'R$',
  CAD = '$',
  COP = '$',
  CVE = '$',
  EUR = '€',
  GBP = '£',
  GHS = 'GH₵',
  KES = 'KSh',
  LRD = 'L$',
  MXN = '$',
  NGN = '₦',
  PHP = '₱',
  RUB = '₽',
  SLL = 'Le',
  TRY = '₺',
  UAH = '₴',
  UGX = 'USh',
  USD = '$',
}

export const LOCAL_CURRENCY_CODES = Object.values(LocalCurrencyCode)
