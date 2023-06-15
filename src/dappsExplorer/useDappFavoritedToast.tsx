import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ToastWithCTA from 'src/components/ToastWithCTA'
import { DappSection, DappV1, DappV2, isDappV2 } from 'src/dapps/types'

const TOAST_DISMISS_TIMEOUT = 5000

const useDappFavoritedToast = (sectionListRef: React.RefObject<SectionList>) => {
  const { t } = useTranslation()

  // do not use favoritedDapp to show / hide the toast, as the content of the toast depends on the dapp name during transitions
  const [favoritedDapp, setFavoritedDapp] = useState<DappV1 | DappV2 | null>(null)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowToast(false), TOAST_DISMISS_TIMEOUT)
    return () => {
      clearTimeout(timeout)
    }
  }, [favoritedDapp])

  const onPressToast = () => {
    setShowToast(false)
    sectionListRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated: true })
  }

  const getEventProperties = (dapp: DappV1 | DappV2) => ({
    section: DappSection.All,
    dappId: dapp.id,
    dappName: dapp.name,
    categories: isDappV2(dapp) ? dapp.categories : undefined,
    categoryId: !isDappV2(dapp) ? dapp.categoryId : undefined,
  })

  const onFavoriteDapp = (dapp: DappV1 | DappV2) => {
    console.log('====fav')
    setFavoritedDapp(dapp)
    setShowToast(true)
    ValoraAnalytics.track(DappExplorerEvents.dapp_favorite, getEventProperties(dapp))
  }

  const onUnfavoriteDapp = (dapp: DappV1 | DappV2) => {
    console.log('====unfav')
    ValoraAnalytics.track(DappExplorerEvents.dapp_unfavorite, getEventProperties(dapp))
  }

  const DappFavoritedToast = useMemo(
    () => (
      <ToastWithCTA
        showToast={showToast}
        title={favoritedDapp?.name}
        message={t('dappsScreen.favoritedDappToast.message')}
        labelCTA={t('dappsScreen.favoritedDappToast.labelCTA')}
        onPress={onPressToast}
      />
    ),
    [favoritedDapp, showToast]
  )

  return {
    onFavoriteDapp,
    onUnfavoriteDapp,
    DappFavoritedToast,
  }
}

export default useDappFavoritedToast
