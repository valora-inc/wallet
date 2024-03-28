import GorhomBottomSheet from '@gorhom/bottom-sheet'
import React, { Dispatch, SetStateAction, useMemo } from 'react'
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
  setSelectedNetworkIds: Dispatch<SetStateAction<NetworkId[]>>
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

  const networkIconByNetworkId = useSelector(networksIconSelector)

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
      mode={'select-all-or-one'}
    />
  )
}

export default NetworkMultiSelectBottomSheet
