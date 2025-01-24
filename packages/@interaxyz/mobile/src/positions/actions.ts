export enum Actions {
  REFRESH_POSITIONS = 'POSITIONS/REFRESH_POSITIONS',
}

interface RefreshPositionsAction {
  type: Actions.REFRESH_POSITIONS
}

export const refreshPositions = (): RefreshPositionsAction => ({
  type: Actions.REFRESH_POSITIONS,
})
