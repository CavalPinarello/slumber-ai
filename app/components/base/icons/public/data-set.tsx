import type { FC } from 'react'

type Props = {
    className?: string
}

const DataSetIcon: FC<Props> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
        <path d="M3 15h18" stroke="currentColor" strokeWidth="2" />
    </svg>
)

export default DataSetIcon 