export enum Actions {
  GENERATE_PDF = 'PDF/GENERATING_PDF',
  SAVING_PDF = 'PDF/SAVING_PDF',
  OPENING_PDF = 'PDF/OPENING_PDF',
  CLOSE_EXPORT = 'PDF/CLOSE_EXPORT',
}

export interface GeneratePdfAction {
  type: Actions.GENERATE_PDF
  content: any
}

export interface SavePdfAction {
  type: Actions.SAVING_PDF
  filePath: string
}

export interface OpenPdfAction {
  type: Actions.OPENING_PDF
}

export interface CloseExportAction {
  type: Actions.CLOSE_EXPORT
}

export const generatePdf = (content: any): GeneratePdfAction => ({
  type: Actions.GENERATE_PDF,
  content,
})

export const savePdf = (filePath: string): SavePdfAction => ({
  type: Actions.SAVING_PDF,
  filePath,
})

export const openPdf = (): OpenPdfAction => ({
  type: Actions.OPENING_PDF,
})

export const closeExport = (): CloseExportAction => ({
  type: Actions.CLOSE_EXPORT,
})

export type ActionTypes = GeneratePdfAction | OpenPdfAction | SavePdfAction | CloseExportAction
