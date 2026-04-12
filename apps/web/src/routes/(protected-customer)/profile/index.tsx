import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Label,
  TextField,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import {
  Pencil,
  TrashBin,
  CirclePlus,
  GeoPin,
  Envelope,
} from "@gravity-ui/icons";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { authenticatedFetch } from "@repo/lib";
import type { AddressEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import { useUserContext } from "../../../providers/useUserContext";

interface AddressFormData {
  street: string;
  streetNumber: string;
  zipCode: string;
  city: string;
}

const emptyForm: AddressFormData = {
  street: "",
  streetNumber: "",
  zipCode: "",
  city: "",
};

function ProfilePage() {
  const { userContext } = useUserContext();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: addresses = [], isLoading } = useApiQuery<AddressEntity[]>({
    request: { url: "/v1/address" },
    queryKey: ["addresses"],
  });

  const invalidateAddresses = () => {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
  };

  const createMutation = useApiMutation<AddressEntity, Error, AddressFormData>({
    request: { url: "/v1/address", method: "POST" },
    success: () => {
      invalidateAddresses();
      closeForm();
    },
  });

  const updateMutation = useApiMutation<
    AddressEntity,
    Error,
    AddressFormData
  >({
    mutationFn: (data) =>
      authenticatedFetch(`/v1/address/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<AddressEntity>,
    success: () => {
      invalidateAddresses();
      closeForm();
    },
  });

  const deleteMutation = useApiMutation<void, Error, string>({
    mutationFn: (id) =>
      authenticatedFetch(`/v1/address/${id}`, {
        method: "DELETE",
      }) as Promise<void>,
    success: () => {
      invalidateAddresses();
      setDeleteId(null);
    },
  });

  const setDefaultMutation = useApiMutation<AddressEntity, Error, string>({
    mutationFn: (id) =>
      authenticatedFetch(`/v1/address/${id}/default`, {
        method: "PATCH",
      }) as Promise<AddressEntity>,
    success: invalidateAddresses,
  });

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (address: AddressEntity) => {
    setEditingId(address.$id);
    setFormData({
      street: address.street,
      streetNumber: address.streetNumber,
      zipCode: address.zipCode,
      city: address.city,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate(addressId);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const userName = userContext?.appwriteUser.name || "-";
  const userEmail = userContext?.appwriteUser.email || "-";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent text-xl font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">
            {userName}
          </h1>
          <div className="flex items-center gap-1.5 text-muted">
            <Envelope className="size-3.5 shrink-0" />
            <span className="text-sm truncate">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* Addresses Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GeoPin className="size-5 text-muted" />
          <h2 className="text-lg font-semibold text-foreground">
            Meine Adressen
          </h2>
        </div>
        <Button
          size="sm"
          className="bg-accent text-accent-foreground font-medium"
          startContent={<CirclePlus className="size-4" />}
          onPress={openCreateForm}
        >
          Neue Adresse
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted py-8 text-center">Laden...</p>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GeoPin className="size-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">
              Du hast noch keine Adressen gespeichert.
            </p>
            <Button
              size="sm"
              variant="flat"
              className="mt-3"
              onPress={openCreateForm}
            >
              Adresse hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <Card key={address.$id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-secondary shrink-0 mt-0.5">
                      <GeoPin className="size-4 text-muted" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {address.street} {address.streetNumber}
                        </span>
                        {address.isDefault && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="text-xs"
                          >
                            Standard
                          </Chip>
                        )}
                      </div>
                      <span className="text-xs text-muted">
                        {address.zipCode} {address.city}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!address.isDefault && (
                      <Button
                        size="sm"
                        variant="flat"
                        className="text-xs"
                        onPress={() => handleSetDefault(address.$id)}
                      >
                        Als Standard
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      aria-label="Bearbeiten"
                      onPress={() => openEditForm(address)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      color="danger"
                      aria-label="Löschen"
                      onPress={() => setDeleteId(address.$id)}
                    >
                      <TrashBin className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      <Modal isOpen={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <ModalBackdrop>
        <ModalContainer size="lg">
        <ModalDialog>
          <ModalHeader>
            {editingId ? "Adresse bearbeiten" : "Neue Adresse"}
          </ModalHeader>
          <ModalBody className="flex flex-col gap-3">
            <div className="flex gap-3">
              <TextField
                value={formData.street}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, street: v }))
                }
                className="flex-1"
              >
                <Label>Straße</Label>
                <Input />
              </TextField>
              <TextField
                value={formData.streetNumber}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, streetNumber: v }))
                }
                className="w-28"
              >
                <Label>Hausnummer</Label>
                <Input />
              </TextField>
            </div>
            <div className="flex gap-3">
              <TextField
                value={formData.zipCode}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, zipCode: v }))
                }
                className="w-28"
              >
                <Label>PLZ</Label>
                <Input />
              </TextField>
              <TextField
                value={formData.city}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, city: v }))
                }
                className="flex-1"
              >
                <Label>Stadt</Label>
                <Input />
              </TextField>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={closeForm}>
              Abbrechen
            </Button>
            <Button
              className="bg-accent text-accent-foreground font-medium"
              onPress={handleSubmit}
              isLoading={isSaving}
            >
              {editingId ? "Speichern" : "Hinzufügen"}
            </Button>
          </ModalFooter>
        </ModalDialog>
        </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Adresse löschen"
        description="Möchtest du diese Adresse wirklich löschen?"
        confirmLabel="Löschen"
        variant="danger"
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-customer)/profile/")({
  component: ProfilePage,
  staticData: { showHeader: true, showFooter: true },
});
