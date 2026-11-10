/** Props para renombrar en línea dentro del tablero (ids "item:<key>", "section:<key>"). */
export interface RenameProps {
  renamingId: string | null;
  onStartRename: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onCancelRename: () => void;
}
