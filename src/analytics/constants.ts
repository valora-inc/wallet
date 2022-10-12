import { StatsigLayers } from 'src/analytics/types'

export const ExperimentParams = {
  [StatsigLayers.NAME_AND_PICTURE_SCREEN]: {
    showSkipButton: {
      paramName: 'showSkipButton',
      defaultValue: false,
    },
    nameType: {
      paramName: 'nameType',
      defaultValue: 'first_and_last',
    },
    showNameGeneratorButton: {
      paramName: 'showNameGeneratorButton',
      defaultValue: false,
    },
    namePlaceholder: {
      paramName: 'namePlaceholder',
      defaultValue: 'fullNamePlaceholder',
    },
  },
}
