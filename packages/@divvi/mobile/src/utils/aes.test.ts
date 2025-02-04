// This test was initially copied from https://github.com/RaisinTen/aes-crypto-js/blob/2978af8e004d47539d767e751def003fe134b6e2/test.js
// And adapted for this project
import { aesDecrypt, aesEncrypt } from './aes'

describe.each([
  [
    'normal characters',
    'Hello, world!',
    'umm, shhh ...',
    'U2FsdGVkX1+W9o0WI1QJGehALRoGMaRfoN2YH36BGTk=',
  ],
  [
    'weird characters in secret',
    'Hello, world!',
    'umm, šhhh ... 😀D◌̇랆탆𝐿 𑒹◌̴◌𑒺',
    'U2FsdGVkX1/Eq6lXayqOFwfqTdefS3Zqi7LqOeWKrtA=',
  ],
  [
    'bytes corresponding to a single character that are split between two buffers',
    '\u{30a8}\u{30b9}\u{30af}\u{30fc}\u{30c8}\u{3099}',
    'umm, shhh ...',
    'U2FsdGVkX18JW+58n/s+37y5831hmabBUuwtVf+JkaDZjeVyRNDHc+I/1w8kpAEA',
  ],
])('AES encryption and decryption: %s', (scenario, plainText, secret, encryptedByCryptoJS) => {
  it('decrypts strings encrypted by crypto-js', () => {
    // Note: encryptedByCryptoJS is the result of CryptoJS.AES.encrypt(plainText, secret).toString()
    const decrypted = aesDecrypt(encryptedByCryptoJS, secret)
    expect(decrypted).toBe(plainText)
  })

  it('decrypts strings encrypted with encryptAES', () => {
    const encrypted = aesEncrypt(plainText, secret)
    const decrypted = aesDecrypt(encrypted, secret)
    expect(decrypted).toBe(plainText)
  })
})
