<script setup>
import { ref, computed, watch } from "vue";
import { useToast } from "primevue/usetoast";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import ApiService from "@/services/api";
import { getErrorMessage } from "@/utils/apiError";

// ## Props:
const props = defineProps({
  // Carpeta a renombrar; null significa que estamos creando una nueva
  folder: {
    type: Object,
    required: false,
    default: null,
  },
});

// ## Modelo y eventos:
const visible = defineModel("visible", { type: Boolean });
const emit = defineEmits(["created", "updated"]);

// ## Servicios:
const toast = useToast();

// ## Estado del formulario:
const folderName = ref("");
const isSaving = ref(false);

// El mismo diálogo sirve para crear y para renombrar según haya carpeta o no
const isEditing = computed(() => props.folder !== null);

// Rellenamos el nombre cada vez que se abre el diálogo
watch(visible, (isOpen) => {
  if (isOpen) {
    if (isEditing.value) {
      folderName.value = props.folder.name;
    } else {
      folderName.value = "";
    }
  }
});

async function submitFolder() {
  const name = folderName.value.trim();
  if (!name) {
    toast.add({
      severity: "warn",
      summary: "Falta el nombre",
      detail: "El nombre de la carpeta no puede estar vacío",
      life: 3000,
    });
    return;
  }
  isSaving.value = true;
  try {
    if (isEditing.value) {
      const updated = await ApiService.updateFolder(props.folder.id, name);
      emit("updated", updated);
      toast.add({
        severity: "success",
        summary: "Carpeta renombrada",
        detail: updated.name,
        life: 3000,
      });
    } else {
      const created = await ApiService.createFolder(name);
      emit("created", created);
      toast.add({
        severity: "success",
        summary: "Carpeta creada",
        detail: created.name,
        life: 3000,
      });
    }
    visible.value = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo guardar la carpeta"),
      life: 4000,
    });
    console.error(error);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Renombrar carpeta' : 'Crear carpeta'"
    modal
    :style="{ width: '380px' }"
  >
    <div class="flex flex-col gap-1">
      <label class="text-sm text-gray-600">Nombre</label>
      <InputText
        v-model="folderName"
        placeholder="Ej. Secretaría"
        autofocus
        @keyup.enter="submitFolder"
      />
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="visible = false" />
      <Button
        :label="isEditing ? 'Guardar' : 'Crear'"
        :loading="isSaving"
        @click="submitFolder"
      />
    </template>
  </Dialog>
</template>