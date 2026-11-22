import type { FC } from 'react'

type UpgradeBtnProps = {
  className?: string
  children?: React.ReactNode
}

const UpgradeBtn: FC<UpgradeBtnProps> = ({ className, children }) => {
  return (
    <button className={`btn btn-disabled ${className}`} disabled>
      {children || 'Upgrade (Not Available)'}
    </button>
  )
}

export default UpgradeBtn
