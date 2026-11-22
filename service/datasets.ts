// Minimal datasets service stub for compatibility

export const dataSourceApiRequest = () => {
  return Promise.resolve({ data: null })
}

export const testDataSourceConnection = () => {
  return Promise.resolve({ success: false })
}
