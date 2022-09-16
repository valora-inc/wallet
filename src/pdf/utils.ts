import BigNumber from 'bignumber.js'
import { find, map } from 'lodash'
import * as RNFS from 'react-native-fs'
import PDFMaker, { Pdf } from 'react-native-html-to-pdf'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import i18n from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { TokenBalanceWithUsdPrice } from 'src/tokens/selectors'
import { TokenTransaction, TokenTransactionTypeV2, TokenTransfer } from 'src/transactions/types'
import Logger from 'src/utils/Logger'

const TAG = 'PdfUtil'

export const getPdfPath = (type: string) => {
  return `${RNFS.DocumentDirectoryPath}/${type}`
}

export const getPdfFile = (type: string) => {
  return `${getPdfPath(type)}/${Date.now()}.pdf`
}

export const getFolder = (filePath: string) => {
  return filePath.substr(0, filePath.lastIndexOf('/'))
}

export const createTransactionSummary = async ({
  account,
  transactions,
  localCurrencyCode,
  tokenUsdPrices: tokenInfos,
}: {
  account: string
  transactions: TokenTransaction[]
  localCurrencyCode: LocalCurrencyCode
  tokenUsdPrices: TokenBalanceWithUsdPrice[]
}): Promise<Pdf> => {
  const DynamicHtml = (logo: any, content: TokenTransaction[]) => {
    const table = (value: string) => {
      return `<table class="tx_summary_table">${value}</table>`
    }

    const header = () => {
      return `
      <tr class="tx_summary_header">
      <th>${i18n.t('txSummary.0')}</th>
      <th>${i18n.t('txSummary.1')}</th>
      <th>${i18n.t('txSummary.2')}</th>
      <th>${i18n.t('txSummary.3')}</th>
      <th>${i18n.t('txSummary.4')}</th>
      <th>${i18n.t('txSummary.5')}</th>
      <th>${i18n.t('txSummary.6')}</th>
      <th>${i18n.t('txSummary.7')}</th>
      </tr>`
    }

    const row = (transaction: TokenTransfer) => {
      const { type, timestamp, amount, address } = transaction

      const sender = formatShortenedAddress(
        type == TokenTransactionTypeV2.Received ? address : account
      )
      const recipient = formatShortenedAddress(
        type == TokenTransactionTypeV2.Sent ? address : account
      )
      const localAmount = formatValueToDisplay((amount.localAmount?.value ?? 0) as BigNumber)
      const contract = find(tokenInfos, (tokenInfo) => tokenInfo.address === amount.tokenAddress)
      const contractAddress = formatShortenedAddress(contract?.address ?? '')
      const contractSymbol = contract?.symbol
      const date = new Date(timestamp).toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'short',
      })

      return `
      <tr class="tx_line_item">
      <td>${type}</td>
      <td>${date}</td>
      <td>${sender}</td>
      <td>${recipient}</td>
      <td>${contractAddress}</td>
      <td>${contractSymbol}</td>
      <td class="decimal-value">${amount.value} ${contractSymbol}</td>
      <td class="decimal-value">$${localAmount}</td>
      </tr>
      `
    }

    const footer = () => {
      return
    }

    const styles = `
    <style>
    * {
      font-family: '',
    }

    .tx_summary_table {
      width: 100%
    }
    
    tr {
      text-align: center
    }
    
    tr:nth-child(odd) {
      background: #EDEDED
    }

    .decimal-value {
      text-align: right
    }
    </style>
    `
    const tableHeader = header()
    const tableRows = map(content, (tx: TokenTransfer) => row(tx)).join('')
    const result = table(tableHeader + tableRows)
    return styles + result
  }

  const options = {
    html: DynamicHtml(null, transactions),
    fileName: Date.now().toString(),
    directory: 'Documents',
  }

  try {
    const file = await PDFMaker.convert(options)
    return file
  } catch (e) {
    throw e
  }
}

export const writePdfFile = async (content: Pdf) => {
  try {
    const fileName = Date.now().toString()
    const file = getPdfFile(fileName)
    if (!content.base64) throw new Error('Pdf file contents corrupted.')
    await RNFS.mkdir(getFolder(file))
    Logger.info(TAG, '@writePdfFile Wrote Documents Folder', file)
    await RNFS.writeFile(file, content.base64, 'base64')
  } catch (error: any) {
    Logger.error(TAG, '@writePdfFile Unable to write PDF', error)
    throw error
  }
}
