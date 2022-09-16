import { Pdf } from 'react-native-html-to-pdf'
import { call, put, select, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getLocalCurrencyCode, localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import { Actions, savePdf } from 'src/pdf/actions'
import { pdfDataSelector } from 'src/pdf/reducer'
import { createTransactionSummary } from 'src/pdf/utils'
import { TokenBalanceWithUsdPrice, tokensListSelector } from 'src/tokens/selectors'
import { transactionsWithUsdPrice } from 'src/transactions/utils'
import Logger from 'src/utils/Logger'
import { accountAddressSelector } from 'src/web3/selectors'

const TAG = 'pdf/saga'

export function* generatePdf(): any {
  try {
    Logger.info(TAG, '@generatePDF', 'PDF requested')
    const payload = yield select(pdfDataSelector)
    const account = yield select(accountAddressSelector)
    const tokenUsdPrices: TokenBalanceWithUsdPrice[] = yield select(tokensListSelector)
    const localCurrencyCode = yield select(getLocalCurrencyCode)
    const localCurrencyExchangeRate = yield select(localCurrencyToUsdSelector)
    const transactions = yield transactionsWithUsdPrice(
      payload,
      tokenUsdPrices,
      localCurrencyCode,
      localCurrencyExchangeRate
    )
    const file: Pdf = yield call(createTransactionSummary, {
      account,
      transactions,
      localCurrencyCode,
      tokenUsdPrices,
    })
    if (!file.filePath) throw new Error('Unable to generate Pdf')
    yield put(savePdf(file.filePath))
    Logger.info(TAG, '@generatePDF', 'PDF created')
  } catch (error: any) {
    Logger.error(TAG, 'Error while saving document', error)
    yield put(showError(ErrorMessages.CREATE_PDF_FAILED))
  }
}

export function* pdfSaga() {
  yield takeLeading(Actions.GENERATE_PDF, generatePdf)
}
