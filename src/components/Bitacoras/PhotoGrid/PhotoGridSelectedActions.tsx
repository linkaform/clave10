import { Button } from '@/components/ui/button'
import React from 'react'
import { Action } from '@/types/bitacoras'

interface PhotoSelectedActionsProps {
  selectedIds: string[]
  actions: Action[]
}

const PhotoSelectedActions = ({ selectedIds, actions }: PhotoSelectedActionsProps) => {
  return (
    <>
      {actions.map((action, index) => (
        <Button 
          key={index}
          variant={action.variant || "outline"} 
          size="sm" 
          onClick={() => action.onClick(selectedIds)}
        >
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      ))}
    </>
  );
}

export default PhotoSelectedActions