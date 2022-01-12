import { renderHook } from '@testing-library/react-hooks'
import React from 'react'
import { Provider } from 'react-redux'
import useRegistrationStep from 'src/onboarding/registration/useRegistrationStep'
import { createMockStore } from 'test/utils'

const renderHookWithProvider = (choseToRestoreAccount: boolean) => {
  const store = createMockStore({
    account: {
      choseToRestoreAccount,
    },
  })
  return renderHook(() => useRegistrationStep(1), {
    wrapper: (component) => (
      <Provider store={store}>{component?.children ? component.children : component}</Provider>
    ),
  })
}

describe('useRegistrationStep', () => {
  it('should return the correct restore account step', async () => {
    const { result } = renderHookWithProvider(true)

    expect(result.current).toEqual('restoreAccountSteps, {"step":1,"totalSteps":4}')
  })

  it('should return the correct create account step', async () => {
    const { result } = renderHookWithProvider(false)

    expect(result.current).toEqual('createAccountSteps, {"step":1,"totalSteps":3}')
  })
})
