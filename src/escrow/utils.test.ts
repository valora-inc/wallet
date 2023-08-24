import { reclaimInviteNotificationId } from 'src/escrow/utils'

describe('Notification Id Helper', () => {
  it('Generates correct notification id for escrow payment notification', () => {
    expect(reclaimInviteNotificationId('testId')).toBe('reclaimInvite/testId')
  })
})
