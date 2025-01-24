import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AppEvents } from 'src/analytics/Events'
import ErrorScreen from 'src/app/ErrorScreen'
import { withTranslation } from 'src/i18n'
import { getErrorMessage } from 'src/utils/displayFormatting'

interface State {
  childError: Error | null
}

interface OwnProps {
  children: React.ReactChild
}

type Props = OwnProps & WithTranslation

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    childError: null,
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ childError: error })
    AppAnalytics.track(AppEvents.error_displayed, { error: error.message })
    Sentry.captureException(error)
  }

  render() {
    const { childError } = this.state
    if (childError) {
      return <ErrorScreen errorMessage={getErrorMessage(childError)} />
    }

    return this.props.children
  }
}

export default withTranslation<Props>()(ErrorBoundary)
