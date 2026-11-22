import type { FC } from 'react'
import type { NodeTracing } from '../../types'

type TracingPanelProps = {
  list: NodeTracing[]
  workflowProcess?: any
  hideNodeInfo?: boolean
  hideProcessDetail?: boolean
  className?: string
}

const TracingPanel: FC<TracingPanelProps> = ({
  list,
  workflowProcess,
  hideNodeInfo = false,
  hideProcessDetail = false,
  className = '',
}) => {
  return (
    <div className={`tracing-panel ${className}`}>
      <div className="text-sm text-gray-500">
        Workflow execution trace ({list.length} steps)
      </div>
      {list.map((item, index) => (
        <div key={item.node_id} className="border-l-2 border-gray-200 pl-4 py-2">
          <div className="font-medium">{item.node_title}</div>
          <div className="text-xs text-gray-500">
            {item.status} • {item.elapsed_time}ms
          </div>
        </div>
      ))}
    </div>
  )
}

export default TracingPanel
