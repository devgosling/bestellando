import {
  Button,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  variant = "default",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalBackdrop>
      <ModalContainer size="sm">
        <ModalDialog>
          <ModalHeader>{title}</ModalHeader>
          {description && (
            <ModalBody>
              <p className="text-muted">{description}</p>
            </ModalBody>
          )}
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              {cancelLabel}
            </Button>
            <Button
              color={variant === "danger" ? "danger" : undefined}
              className={variant !== "danger" ? "bg-accent text-accent-foreground font-semibold" : undefined}
              onPress={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </ModalFooter>
        </ModalDialog>
      </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
