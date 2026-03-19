import React from 'react'

interface PhotoSelectedActionsProps {
  selectedItems: { record_id: string; record_status?: string }[]
  children?: React.ReactNode | ((selectedItems: { record_id: string; record_status?: string }[]) => React.ReactNode)
}

const PhotoSelectedActions = ({ selectedItems, children }: PhotoSelectedActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      {typeof children === "function" ? children(selectedItems) : children}
    </div>
  );
}

export default PhotoSelectedActions