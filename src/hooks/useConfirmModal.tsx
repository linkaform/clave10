import { useState } from "react";

export function useConfirmModal() {
  const [open, setOpen] = useState(false);

  return {
    isOpen: open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}