// Minimal plugin types for compatibility

export type Plugin = {
  id: string
  name: string
  type: string
}

export type PluginConfig = {
  enabled: boolean
  plugins: Plugin[]
}
