import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";

type ConfirmDeleteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  close: () => void
  title?: string
  description?: string
  /** For the destructive-but-not-a-deletion cases, e.g. leaving a pot. */
  confirmLabel?: string
}

function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm,
  close,
  title = "Delete item?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
}: ConfirmDeleteProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDelete