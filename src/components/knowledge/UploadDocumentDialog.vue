<script setup>
import { ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
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
  // Carpeta sugerida al abrir; puede no ser una carpeta real ("todas"/"sin clasificar")
  defaultFolderId: {
    type: [Number, String],
    required: false,
    default: null,
  },
});

// ## Modelo y eventos:
const visible = defineModel("visible", { type: Boolean });
const emit = defineEmits(["uploaded"]);

// ## Servicios:
const toast = useToast();

// ## Estado del formulario:
const uploadFile = ref(null);
const uploadFolderId = ref(null);
const uploadExpiresAt = ref(null);
const isUploading = ref(false);

// Rellenamos el formulario cada vez que se abre el diálogo
watch(visible, (isOpen) => {
  if (isOpen) {
    resetForm();
  }
});

function resetForm() {
  uploadFile.value = null;
  uploadExpiresAt.value = null;
  // Solo sugerimos la carpeta activa si es una carpeta real, no "todas" ni "sin clasificar"
  const isRealFolder = props.folders.some((folder) => folder.id === props.defaultFolderId);
  if (isRealFolder) {
    uploadFolderId.value = props.defaultFolderId;
  } else {
    uploadFolderId.value = null;
  }
}

function onFileSelected(event) {
  // FileUpload de PrimeVue dispara este evento con event.files (array)
  if (event.files.length > 0) {
    uploadFile.value = event.files[0];
  }
}

async function submitUpload() {
  if (!uploadFile.value) {
    toast.add({
      severity: "warn",
      summary: "Falta el archivo",
      detail: "Selecciona un archivo antes de subirlo",
      life: 3000,
    });
    return;
  }
  isUploading.value = true;
  try {
    // El backend espera la fecha en formato ISO; toISOString() funciona con Date
    let expires = null;
    if (uploadExpiresAt.value) {
      expires = uploadExpiresAt.value.toISOString();
    }
    const newDocument = await ApiService.uploadDocument(uploadFile.value, {
      folder_id: uploadFolderId.value,
      expires_at: expires,
    });
    emit("uploaded", newDocument);
    toast.add({
      severity: "success",
      summary: "Documento subido",
      detail: newDocument.name,
      life: 3000,
    });
    visible.value = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error al subir",
      detail: getErrorMessage(error, "No se pudo subir el documento"),
      life: 4000,
    });
    console.error(error);
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Subir documento" modal :style="{ width: '480px' }">
    <div class="flex flex-col gap-4">
      <FileUpload
        mode="basic"
        :auto="false"
        accept="application/pdf,text/plain,.md"
        choose-label="Elegir archivo"
        @select="onFileSelected"
      />

      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-600">Carpeta (opcional)</label>
        <Select
          v-model="uploadFolderId"
          :options="folders"
          option-label="name"
          option-value="id"
          placeholder="Sin clasificar"
          show-clear
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-600">Fecha de expiración (opcional)</label>
        <DatePicker v-model="uploadExpiresAt" date-format="dd/mm/yy" show-icon />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="visible = false" />
      <Button label="Subir" :loading="isUploading" @click="submitUpload" />
    </template>
  </Dialog>
</template>