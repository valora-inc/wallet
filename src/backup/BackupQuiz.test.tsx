import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import BackupQuiz, { BackupQuiz as BackupQuizRaw, navOptionsForQuiz } from 'src/backup/BackupQuiz'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockI18nProps, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockMnemonic } from 'test/values'

jest.mock('lodash', () => ({
  ...(jest.requireActual('lodash') as any),
  shuffle: jest.fn((array) => array),
}))

const mockGetStoredMnemonic = jest.fn(() => mockMnemonic)
jest.mock('src/backup/utils', () => ({
  ...(jest.requireActual('src/backup/utils') as any),
  getStoredMnemonic: () => mockGetStoredMnemonic(),
}))

const mockScreenProps = getMockStackScreenProps(Screens.BackupQuiz)

describe('BackupQuiz', () => {
  const store = createMockStore()
  it('renders correctly', async () => {
    const { getByTestId, toJSON } = render(
      <Provider store={store}>
        <BackupQuiz {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => getByTestId('selected-word-0'))
    expect(toJSON()).toMatchSnapshot()
  })

  it('Cancel navigates correctly when no settingScreen passed', () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={BackupQuiz} options={navOptionsForQuiz} />
      </Provider>
    )

    fireEvent.press(getByTestId('CancelButton'))
    expect(getByText('cancelDialog.title')).toBeTruthy()
    expect(getByText('cancelDialog.body')).toBeTruthy()
  })

  it('Cancel navigates correctly when settingsScreen is passed', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={BackupQuiz}
          params={{ settingsScreen: Screens.Settings }}
          options={navOptionsForQuiz}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('CancelButton'))
    expect(navigate).toBeCalledWith(Screens.Settings)
  })

  describe('when word is pressed', () => {
    it('removes it from the options adds it to chosen words', async () => {
      const mockSetBackupCompleted = jest.fn()
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <BackupQuizRaw
            {...getMockStackScreenProps(Screens.BackupQuiz)}
            setBackupCompleted={mockSetBackupCompleted}
            showError={jest.fn()}
            account={mockAccount}
            {...getMockI18nProps()}
          />
        </Provider>
      )

      await waitFor(() => getByTestId('selected-word-0'))

      expect(getByTestId('selected-word-0').props.children).toEqual(1)

      const words = mockMnemonic.split(' ')
      const firstWord = words[0]
      const secondWord = words[1]

      fireEvent.press(getByText(firstWord))

      await waitFor(() =>
        getByTestId('selected-word-0').find((node) => node.props.children === firstWord)
      )

      expect(getByTestId('selected-word-0').props.children).toEqual(firstWord)

      expect(getByText(secondWord)).toBeTruthy()
    })
  })

  it('can complete the quiz correctly', async () => {
    jest.useFakeTimers()
    const mockSetBackupCompleted = jest.fn()
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <BackupQuizRaw
          {...mockScreenProps}
          setBackupCompleted={mockSetBackupCompleted}
          showError={jest.fn()}
          account={mockAccount}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    for (const word of mockMnemonic.split(' ')) {
      await waitFor(() => getByText(word))
      fireEvent.press(getByText(word))
    }

    fireEvent.press(getByTestId('QuizSubmit'))
    jest.advanceTimersByTime(2000)
    expect(mockSetBackupCompleted).toHaveBeenCalled()
  })
})
