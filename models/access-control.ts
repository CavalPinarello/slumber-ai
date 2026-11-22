// Minimal access control types for compatibility

export type AccessControl = {
  enabled: boolean
}

export enum AccessMode {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
}

export const defaultAccessControl: AccessControl = {
  enabled: false,
}
