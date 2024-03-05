import { IClientMeta } from '@walletconnect/legacy-types'
import { CoreTypes } from '@walletconnect/types'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { activeDappSelector } from 'src/dapps/selectors'
import { useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logos from 'src/walletConnect/screens/Logos'

export interface RequestDetail {
  label: string
  value: ReactElement | string | null
}

interface BaseProps {
  dappName: string
  dappUrl?: string
  dappImageUrl?: string
  title: string
  description: string | null
  requestDetails?: RequestDetail[]
  testId: string
  children?: React.ReactNode
  buttonText?: string | null
}

interface ConfirmProps extends BaseProps {
  type: 'confirm'
  onAccept(): void
  onDeny(): void
}

interface DismissProps extends BaseProps {
  type: 'dismiss'
  onDismiss(): void
}

type Props = ConfirmProps | DismissProps

export const useDappMetadata = (metadata?: IClientMeta | CoreTypes.Metadata | null) => {
  const activeDapp = useSelector(activeDappSelector)

  if (!metadata) {
    // should never happen
    return {
      url: '',
      dappName: '',
      dappImageUrl: '',
    }
  }

  const { url, name, icons } = metadata

  let dappOrigin = ''
  let dappHostname = ''
  try {
    const dappUrl = new URL(url)
    dappHostname = dappUrl.hostname
    dappOrigin = dappUrl.origin
  } catch {
    // do nothing if an invalid url is received, use fallback values
  }

  // create a display name in case the WC request contains an empty string
  const dappName =
    name ||
    (!!activeDapp && new URL(activeDapp.dappUrl).origin === dappOrigin
      ? activeDapp.name
      : dappHostname)
  const dappImageUrl = icons[0] ?? `${url}/favicon.ico`

  return {
    url,
    dappName,
    dappImageUrl,
  }
}

function RequestContent(props: Props) {
  const {
    type,
    dappName,
    dappImageUrl,
    title,
    description,
    requestDetails,
    testId,
    children,
    buttonText,
  } = props
  const { t } = useTranslation()
  const [isPressed, setIsPressed] = useState(false)
  const isPressedRef = useRef(false)

  const onPress = () => {
    setIsPressed(true)
  }

  useEffect(() => {
    isPressedRef.current = isPressed
    if (isPressed) {
      switch (props.type) {
        case 'confirm':
          props.onAccept()
          break
        case 'dismiss':
          props.onDismiss()
          break
        default:
          break
      }
    }
  }, [isPressed])

  useEffect(() => {
    // This makes sure that the onDeny/onDismiss callback is called when the component is unmounted
    return () => {
      if (!isPressedRef.current) {
        switch (props.type) {
          case 'confirm':
            props.onDeny()
            break
          case 'dismiss':
            props.onDismiss()
            break
          default:
            break
        }
      }
    }
  }, [])

  return (
    <>
      <Logos dappName={dappName} dappImageUrl={dappImageUrl} />
      <Text style={styles.header} testID={`${testId}Header`}>
        {title}
      </Text>
      {!!description && <Text style={styles.description}>{description}</Text>}

      {requestDetails && (
        <View style={styles.requestDetailsContainer}>
          {requestDetails.map(({ label, value }, index) =>
            value ? (
              <React.Fragment key={label}>
                <Text
                  style={[
                    styles.requestDetailLabel,
                    index > 0 ? { marginTop: Spacing.Regular16 } : undefined,
                  ]}
                >
                  {label}
                </Text>
                {React.isValidElement(value) ? (
                  value
                ) : (
                  <Text style={styles.requestDetailValue} numberOfLines={1} ellipsizeMode="tail">
                    {value}
                  </Text>
                )}
              </React.Fragment>
            ) : null
          )}
        </View>
      )}

      {children}

      {type == 'confirm' && (
        <Button
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          text={buttonText ?? t('allow')}
          showLoading={isPressed}
          disabled={isPressed}
          onPress={onPress}
          testID={`${testId}/Allow`}
        />
      )}
      {type == 'dismiss' && (
        <Button
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          text={buttonText ?? t('dismiss')}
          showLoading={isPressed}
          disabled={isPressed}
          onPress={onPress}
          testID={`${testId}/Dismiss`}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  requestDetailsContainer: {
    marginBottom: Spacing.Thick24,
  },
  header: {
    ...typeScale.titleSmall,
    color: Colors.black,
    paddingVertical: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodySmall,
    color: Colors.black,
    marginBottom: Spacing.Thick24,
  },
  requestDetailLabel: {
    ...typeScale.labelXSmall,
    color: Colors.gray4,
    marginBottom: 4,
  },
  requestDetailValue: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
})

export default RequestContent
