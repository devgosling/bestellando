import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import {
  Pencil,
  TrashBin,
  CirclePlus,
  Person,
  GeoPin,
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

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      {/* User Info */}
      <Card className="mb-6">
        <CardHeader className="flex gap-3">
          <Person className="size-6 text-accent" />
          <h1 className="text-xl font-bold">Profil</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-muted text-sm">Name</span>
            <span className="text-sm font-medium">
              {userContext?.appwriteUser.name || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted text-sm">E-Mail</span>
            <span className="text-sm font-medium">
              {userContext?.appwriteUser.email || "-"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GeoPin className="size-6 text-accent" />
            <h2 className="text-xl font-bold">Meine Adressen</h2>
          </div>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground font-semibold"
            startContent={<CirclePlus className="size-4" />}
            onPress={openCreateForm}
          >
            Neue Adresse
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted">Laden...</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-muted">
              Du hast noch keine Adressen gespeichert.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map((address) => (
                <div
                  key={address.$id}
                  className="flex items-start justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {address.street} {address.streetNumber}
                      </span>
                      {address.isDefault && (
                        <Chip size="sm" className="bg-accent/10 text-accent">
                          Standardadresse
                        </Chip>
                      )}
                    </div>
                    <span className="text-xs text-muted">
                      {address.zipCode} {address.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!address.isDefault && (
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => handleSetDefault(address.$id)}
                      >
                        Standard
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
                      aria-label="Loeschen"
                      onPress={() => setDeleteId(address.$id)}
                    >
                      <TrashBin className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Form Modal */}
      <Modal isOpen={formOpen} onClose={closeForm} size="lg">
        <ModalDialog>
          <ModalHeader>
            {editingId ? "Adresse bearbeiten" : "Neue Adresse"}
          </ModalHeader>
          <ModalBody className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Input
                label="Strasse"
                value={formData.street}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, street: v }))
                }
                className="flex-1"
              />
              <Input
                label="Hausnummer"
                value={formData.streetNumber}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, streetNumber: v }))
                }
                className="w-28"
              />
            </div>
            <div className="flex gap-3">
              <Input
                label="PLZ"
                value={formData.zipCode}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, zipCode: v }))
                }
                className="w-28"
              />
              <Input
                label="Stadt"
                value={formData.city}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, city: v }))
                }
                className="flex-1"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={closeForm}>
              Abbrechen
            </Button>
            <Button
              className="bg-accent text-accent-foreground font-semibold"
              onPress={handleSubmit}
              isLoading={isSaving}
            >
              {editingId ? "Speichern" : "Hinzufuegen"}
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Adresse loeschen"
        description="Moechtest du diese Adresse wirklich loeschen?"
        confirmLabel="Loeschen"
        variant="danger"
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-customer)/profile/")({
  component: ProfilePage,
  staticData: { showHeader: true, showFooter: true },
});
