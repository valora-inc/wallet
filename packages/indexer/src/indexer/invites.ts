import { Contract, Event, indexEvents } from './index'

enum Action {
  Transfer = 'Transfer',
  Withdraw = 'Withdraw',
  Revocation = 'Revocation',
}

export async function handleInvites() {
  await indexEvents(
    Contract.Escrow,
    Event.Withdrawal,
    'escrow',
    ({ returnValues: { identifier, to, token, value, paymentId } }) => ({
      action: Action.Withdraw,
      from: to,
      identifier,
      token,
      value,
      paymentId,
    })
  )
  await indexEvents(
    Contract.Escrow,
    Event.Transfer,
    'escrow',
    ({ returnValues: { from, identifier, token, value, paymentId } }) => ({
      action: Action.Transfer,
      from,
      identifier,
      token,
      value,
      paymentId,
    })
  )
  await indexEvents(
    Contract.Escrow,
    Event.Revocation,
    'escrow',
    ({ returnValues: { identifier, by, token, value, paymentId } }) => ({
      action: Action.Revocation,
      from: by,
      identifier,
      token,
      value,
      paymentId,
    })
  )
}
