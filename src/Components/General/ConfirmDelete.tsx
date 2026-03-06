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
}

function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm,
  close,
  title = "Delete item?",
  description = "This action cannot be undone.",
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
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDelete