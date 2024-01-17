// Taken from https://github.com/i18next/react-i18next/blob/master/example/test-jest/__mocks__/react-i18next.js
const React = require('react')
const reactI18next = require('react-i18next')

const renderTrans = ({ i18nKey, tOptions, children }) => {
  return (
    <React.Fragment>
      {translationFunction(i18nKey, tOptions)}
      {children}
    </React.Fragment>
  )
}

// Output the key and any params sent to the translation function.
const translationFunction = (key, params) => {
  if (typeof params !== 'object' || Object.keys(params).length === 0) {
    return key
  }
  return [key, JSON.stringify(params)].join(', ')
}

const useMock = [translationFunction, {}]
useMock.t = translationFunction
useMock.i18n = { language: 'en' }

module.exports = {
  // this mock makes sure any components using the translate HoC receive the t function as a prop
  withTranslation: () => (Component) => (props) => (
    <Component t={translationFunction} i18n={{ language: 'en' }} {...props} />
  ),
  Trans: renderTrans,
  Translation: ({ children }) => children(translationFunction, { i18n: {} }),
  useTranslation: () => useMock,

  // mock if needed
  I18nextProvider: reactI18next.I18nextProvider,
  initReactI18next: reactI18next.initReactI18next,
  setDefaults: reactI18next.setDefaults,
  getDefaults: reactI18next.getDefaults,
  setI18n: reactI18next.setI18n,
  getI18n: reactI18next.getI18n,
}
