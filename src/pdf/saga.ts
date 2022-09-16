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
    const payload = yield select(pdfDataSelector)
    const file: Pdf = yield call(createTransactionSummary, payload as FeedTokenTransaction[])

    if (!file.filePath) throw new Error('Unable to generate Pdf')

    put(savePdf(file.filePath))
  } catch (error: any) {
    Logger.error(TAG, 'Error while saving document', error)
    yield put(showError(ErrorMessages.CREATE_PDF_FAILED))
  }
}

export function* pdfSaga() {
  yield takeLeading(Actions.GENERATE_PDF, generatePdf)
}
