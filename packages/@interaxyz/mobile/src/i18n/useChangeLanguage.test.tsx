import { renderHook } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import i18n from 'src/i18n'
import * as I18nSlice from 'src/i18n/slice'
import useChangeLanguage from 'src/i18n/useChangeLanguage'
import Logger from 'src/utils/Logger'
import { createMockStore } from 'test/utils'

jest.mock('src/i18n')

const mockedI18n = jest.mocked(i18n)

const setLanguageSpy = jest.spyOn(I18nSlice, 'setLanguage')
const loggerErrorSpy = jest.spyOn(Logger, 'error')

const renderHookWithProvider = () => {
  const store = createMockStore()
  return renderHook(() => useChangeLanguage(), {
    wrapper: (component) => (
      <Provider store={store}>{component?.children ? component.children : component}</Provider>
    ),
  })
}

describe('useChangeLanguage', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should handle changing language', async () => {
    const changeLanguageSpy = jest.fn().mockResolvedValue(true)
    mockedI18n.changeLanguage.mockImplementationOnce(changeLanguageSpy)

    const { result } = renderHookWithProvider()
    await result.current('pt-BR')

    expect(setLanguageSpy).toHaveBeenCalledWith('pt-BR')
    expect(changeLanguageSpy).toHaveBeenCalledWith('pt-BR')
  })

  it('should handle error when changing language', async () => {
    const changeLanguageSpy = jest.fn().mockRejectedValue(true)
    mockedI18n.changeLanguage.mockImplementationOnce(changeLanguageSpy)

    const { result } = renderHookWithProvider()
    await result.current('pt-BR')

    expect(setLanguageSpy).toHaveBeenCalledWith('pt-BR')
    expect(changeLanguageSpy).toHaveBeenCalledWith('pt-BR')
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
  })
})
