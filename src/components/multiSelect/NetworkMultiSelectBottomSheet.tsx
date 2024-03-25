import GorhomBottomSheet from '@gorhom/bottom-sheet'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MultiSelectBottomSheet from 'src/components/multiSelect/MultiSelectBottomSheet'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { networksIconSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  onClose?: () => void
  onOpen?: () => void
  allNetworkIds: NetworkId[]
  selectedNetworkIds: NetworkId[]
  setSelectedNetworkIds: (selectedNetworkIds: NetworkId[]) => void
}

function NetworkMultiSelectBottomSheet({
  forwardedRef,
  onClose,
  onOpen,
  allNetworkIds,
  selectedNetworkIds,
  setSelectedNetworkIds,
}: Props) {
  const { t } = useTranslation()

  const networkIconByNetworkId = useSelector((state) => networksIconSelector(state, allNetworkIds))

  const options = useMemo(
    () =>
      allNetworkIds.map((networkId) => ({
        text: NETWORK_NAMES[networkId],
        iconUrl: networkIconByNetworkId[networkId],
        id: networkId,
      })),
    [allNetworkIds, networkIconByNetworkId]
  )


  return (
    <MultiSelectBottomSheet<NetworkId>
      forwardedRef={forwardedRef}
      onClose={onClose}
      onOpen={onOpen}
      options={options}
      selectedOptions={selectedNetworkIds}
      setSelectedOptions={setSelectedNetworkIds}
      selectAllText={t('multiSelect.allNetworks')}
      title={t('multiSelect.switchNetwork')}
    />
  )
}

export default NetworkMultiSelectBottomSheet
