import { Contract, Event, indexEvents } from './index'

export async function handleAttestations() {
  await indexEvents(
    Contract.Attestations,
    Event.AttestationCompleted,
    'attestations_completed',
    ({ returnValues: { identifier, account, issuer } }) => ({
      identifier,
      account,
      issuer,
    })
  )
}
