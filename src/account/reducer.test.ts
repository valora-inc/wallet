import { Actions, ChooseCreateAccountAction } from 'src/account/actions'
import { reducer } from 'src/account/reducer'

const initialState = reducer(undefined, { type: 'INIT' } as any)

describe('account reducer', () => {
  describe('CHOOSE_CREATE_ACCOUNT action', () => {
    it('updates onboarding time', () => {
      const action: ChooseCreateAccountAction = { type: Actions.CHOOSE_CREATE_ACCOUNT, now: 123 }
      const expectedState = { ...initialState, startOnboardingTime: 123 }
      expect(reducer(initialState, action)).toEqual(expectedState)
    })
    it('does not update onboarding time if already set', () => {
      const action: ChooseCreateAccountAction = { type: Actions.CHOOSE_CREATE_ACCOUNT, now: 456 }
      const expectedState = { ...initialState, startOnboardingTime: 123 }
      expect(reducer(expectedState, action)).toEqual(expectedState)
    })
    it('sets choseToRestoreAccount to false', () => {
      const action: ChooseCreateAccountAction = { type: Actions.CHOOSE_CREATE_ACCOUNT, now: 123 }
      const expectedState = {
        ...initialState,
        choseToRestoreAccount: false,
        startOnboardingTime: 123,
      }
      expect(reducer(initialState, action)).toEqual(expectedState)
    })
  })
})
