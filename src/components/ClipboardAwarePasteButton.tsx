import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'

interface Props {
  getClipboardContent: () => Promise<string>
  shouldShow: boolean
  onPress: (clipboardContent: string) => void
}

export default function ClipboardAwarePasteButton({
  getClipboardContent,
  shouldShow,
  onPress,
}: Props) {
  const { t } = useTranslation()

  useLayoutEffect(() => {
    LayoutAnimation.easeInEaseOut()
  }, [shouldShow])

  async function onPressInternal() {
    onPress(await getClipboardContent())
  }

  if (!shouldShow) {
    return null
  }

  return (
    <Button
      text={t('paste')}
      type={BtnTypes.ONBOARDING}
      rounded={false}
      size={BtnSizes.FULL}
      onPress={onPressInternal}
      testID={'PasteButton'}
    />
  )
}
