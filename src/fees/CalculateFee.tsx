import React, { FunctionComponent, useEffect } from 'react'
import { useAsync, UseAsyncReturn } from 'react-async-hook'
import { useDispatch } from 'react-redux'
import { showErrorOrFallback } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { getReclaimEscrowFee } from 'src/escrow/saga'
import { FeeType } from 'src/fees/reducer'
import { FeeInfo } from 'src/fees/saga'
import { getSendFee } from 'src/send/saga'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

export type CalculateFeeChildren = (asyncResult: UseAsyncReturn<FeeInfo, any>) => React.ReactNode

interface CommonProps {
  children: CalculateFeeChildren
}

interface SendProps extends CommonProps {
  feeType: FeeType.SEND
  account: string
  recipientAddress: string
  amount: string
  currency: Currency
  comment?: string
  includeDekFee: boolean
  balance: string
}

interface ExchangeProps extends CommonProps {
  feeType: FeeType.EXCHANGE
  // TODO
}

interface ReclaimEscrowProps extends CommonProps {
  feeType: FeeType.RECLAIM_ESCROW
  account: string
  paymentID: string
}

export type PropsWithoutChildren =
  | Omit<SendProps, 'children'>
  | Omit<ExchangeProps, 'children'>
  | Omit<ReclaimEscrowProps, 'children'>

type Props = SendProps | ExchangeProps | ReclaimEscrowProps

// Max lengthed comment to fetch fee estimate before user finalizes comment
const MAX_PLACEHOLDER_COMMENT: string = '0'.repeat(MAX_COMMENT_LENGTH)

function useAsyncShowError<R, Args extends any[]>(
  asyncFunction: ((...args: Args) => Promise<R>) | (() => Promise<R>),
  params: Args
): UseAsyncReturn<R, Args> {
  const asyncResult = useAsync(asyncFunction, params)
  const dispatch = useDispatch()

  useEffect(() => {
    if (asyncResult.error) {
      Logger.error('CalculateFee', 'Error calculating fee', asyncResult.error)
      dispatch(showErrorOrFallback(asyncResult.error, ErrorMessages.CALCULATE_FEE_FAILED))
    }
  }, [asyncResult.error])

  return asyncResult
}

export const useSendFee = (props: Omit<SendProps, 'children'>): UseAsyncReturn<FeeInfo> => {
  return useAsyncShowError(
    (
      account: string,
      recipientAddress: string,
      amount: string,
      currency: Currency,
      balance: string,
      comment: string = MAX_PLACEHOLDER_COMMENT,
      includeDekFee: boolean = false
    ) =>
      getSendFee(
        account,
        currency,
        {
          recipientAddress,
          amount,
          comment,
        },
        includeDekFee,
        balance
      ),
    [
      props.account,
      props.recipientAddress,
      props.amount,
      props.currency,
      props.balance,
      props.comment,
      props.includeDekFee,
    ]
  )
}

const CalculateSendFee: FunctionComponent<SendProps> = (props) => {
  const asyncResult = useSendFee(props)
  return props.children(asyncResult) as React.ReactElement
}

const CalculateReclaimEscrowFee: FunctionComponent<ReclaimEscrowProps> = (props) => {
  const asyncResult = useAsyncShowError(getReclaimEscrowFee, [props.account, props.paymentID])
  return props.children(asyncResult) as React.ReactElement
}

const CalculateFee = (props: Props) => {
  switch (props.feeType) {
    case FeeType.SEND:
      return <CalculateSendFee {...props} />
    case FeeType.RECLAIM_ESCROW:
      return <CalculateReclaimEscrowFee {...props} />
  }

  throw new Error(`Unsupported feeType: ${props.feeType}`)
}

export default CalculateFee
