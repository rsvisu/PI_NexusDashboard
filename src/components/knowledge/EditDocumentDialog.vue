<script setup>
import { ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import ApiService from "@/services/api";
import { getErrorMessage } from "@/utils/apiError";

// ## Props:
const props = defineProps({
  folders: {
    type: Array,
    required: true,
  },
  // Documento a editar; null mientras el diálogo está cerrado
  document: {
    type: Object,
    required: false,
    default: null,
  },
});

// ## Modelo y eventos:
const visible = defineModel("visible", { type: Boolean });
const emit = defineEmits(["updated"]);

// ## Servicios:
const toast = useToast();

// ## Estado del formulario:
const editName = ref("");
const editFolderId = ref(null);
const editExpiresAt = ref(null);
const isSaving = ref(false);

// Rellenamos el formulario con los datos del documento cada vez que se abre
watch(visible, (isOpen) => {
  if (isOpen && props.document) {
    editName.value = props.document.name;
    editFolderId.value = props.document.folder_id;
    // El DatePicker espera un Date, no una cadena ISO
    if (props.document.expires_at) {
      editExpiresAt.value = new Date(props.document.expires_at);
    } else {
      editExpiresAt.value = null;
    }
  }
});

async function submitEdit() {
  if (!editName.value.trim()) {
    toast.add({
      severity: "warn",
      summary: "Falta el nombre",
      detail: "El nombre no puede estar vacío",
      life: 3000,
    });
    return;
  }
  isSaving.value = true;
  try {
    let expires = null;
    if (editExpiresAt.value) {
      expires = editExpiresAt.value.toISOString();
    }
    const updated = await ApiService.updateDocument(props.document.id, {
      name: editName.value.trim(),
      folder_id: editFolderId.value,
      expires_at: expires,
    });
    emit("updated", updated);
    toast.add({
      severity: "success",
      summary: "Documento actualizado",
      detail: updated.name,
      life: 3000,
    });
    visible.value = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo actualizar el documento"),
      life: 4000,
    });
    console.error(error);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Editar documento" modal :style="{ width: '480px' }">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-600">Nombre</label>
        <InputText v-model="editName" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-600">Carpeta</label>
        <Select
          v-model="editFolderId"
          :options="folders"
          option-label="name"
          option-value="id"
          placeholder="Sin clasificar"
          show-clear
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-600">Fecha de expiración</label>
        <DatePicker v-model="editExpiresAt" date-format="dd/mm/yy" show-icon />
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="visible = false" />
      <Button label="Guardar" :loading="isSaving" @click="submitEdit" />
    </template>
  </Dialog>
</template>