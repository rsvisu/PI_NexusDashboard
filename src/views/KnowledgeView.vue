<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import ToggleSwitch from "primevue/toggleswitch";
import UploadIcon from "~icons/material-symbols/upload-rounded";
import LinkIcon from "~icons/material-symbols/link";
import SearchIcon from "~icons/material-symbols/search";
import FolderIcon from "~icons/material-symbols/folder-outline";
import FolderOpenIcon from "~icons/material-symbols/folder-open-outline";
import AddIcon from "~icons/material-symbols/add";
import EditIcon from "~icons/material-symbols/edit-outline";
import TrashIcon from "~icons/material-symbols/delete-outline";
import ApiService from "@/services/api";
import { getErrorMessage } from "@/utils/apiError";
import UploadDocumentDialog from "@/components/knowledge/UploadDocumentDialog.vue";
import EditDocumentDialog from "@/components/knowledge/EditDocumentDialog.vue";
import FolderFormDialog from "@/components/knowledge/FolderFormDialog.vue";

// ## Servicios:
const toast = useToast();
const confirm = useConfirm();

// ## Estado:
const folders = ref([]);
const documents = ref([]);
const activeFolderId = ref(null); // null = "todas las fuentes"
const search = ref("");
const isLoading = ref(false);

// ## Estado de los diálogos:
const showUploadDialog = ref(false);
const showEditDialog = ref(false);
const editingDocument = ref(null);
const showFolderDialog = ref(false);
const editingFolder = ref(null); // null = crear carpeta nueva

// ## Derivados:
// Documentos filtrados por carpeta activa, la búsqueda la aplica el DataTable
const visibleDocuments = computed(() => {
  if (activeFolderId.value === null) {
    return documents.value;
  }
  if (activeFolderId.value === "unclassified") {
    return documents.value.filter((doc) => doc.folder_id === null);
  }
  return documents.value.filter((doc) => doc.folder_id === activeFolderId.value);
});

// Carpeta activa (si es una de verdad)
const activeFolder = computed(() => {
  if (activeFolderId.value === null || activeFolderId.value === "unclassified") return null;
  return folders.value.find((f) => f.id === activeFolderId.value) || null;
});

// ## Funciones:

// ### Carga inicial:
async function loadAll() {
  isLoading.value = true;
  try {
    const [foldersResponse, documentsResponse] = await Promise.all([
      ApiService.getFolders(),
      ApiService.getDocuments(),
    ]);
    folders.value = foldersResponse;
    documents.value = documentsResponse;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo cargar la base de conocimiento",
      life: 4000,
    });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

// ### Helpers de formato para la tabla:
function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("es-ES");
}

function getFolderName(folder_id) {
  if (!folder_id) {
    return null;
  }
  const folder = folders.value.find((f) => f.id === folder_id);
  if (!folder) {
    return null;
  }
  return folder.name;
}

// ### Apertura de diálogos que necesitan recordar sobre qué fila actúan:
function openEditDialog(doc) {
  editingDocument.value = doc;
  showEditDialog.value = true;
}

function openCreateFolderDialog() {
  editingFolder.value = null;
  showFolderDialog.value = true;
}

function openEditFolderDialog(folder) {
  editingFolder.value = folder;
  showFolderDialog.value = true;
}

// ### Reacciones a lo que devuelven los diálogos:
function onDocumentUploaded(newDocument) {
  // Lo añadimos al inicio para que aparezca arriba sin recargar la lista entera
  documents.value.unshift(newDocument);
}

function onDocumentUpdated(updated) {
  const index = documents.value.findIndex((d) => d.id === updated.id);
  if (index !== -1) {
    documents.value[index] = updated;
  }
}

function onFolderCreated(newFolder) {
  folders.value.push(newFolder);
}

function onFolderUpdated(updated) {
  const index = folders.value.findIndex((f) => f.id === updated.id);
  if (index !== -1) {
    folders.value[index].name = updated.name;
  }
}

// ### Descarga:
async function downloadDocument(doc) {
  try {
    const response = await ApiService.getDocumentDownloadUrl(doc.id);
    // La URL es firmada y solo vale unos segundos, abrimos en pestaña nueva
    window.open(response.url, "_blank");
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo generar la URL de descarga",
      life: 3000,
    });
    console.error(error);
  }
}

// ### Toggle activo:
async function toggleActive(doc) {
  // El valor del v-model ya viene cambiado, lo enviamos al backend para persistirlo
  try {
    const updated = await ApiService.toggleDocumentActive(doc.id, doc.is_active);
    // Reemplazamos el documento local con la fila devuelta por el backend
    const index = documents.value.findIndex((d) => d.id === doc.id);
    if (index !== -1) {
      documents.value[index] = updated;
    }
  } catch (error) {
    // Revertimos el cambio en la UI si el backend rechaza
    doc.is_active = !doc.is_active;
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo cambiar el estado del documento",
      life: 3000,
    });
    console.error(error);
  }
}

// ### Borrado de documento:
function confirmDeleteDocument(doc) {
  confirm.require({
    message: `¿Seguro que quieres borrar "${doc.name}"? Esta acción es irreversible`,
    header: "Borrar documento",
    rejectProps: {
      label: "Cancelar",
      severity: "secondary",
      text: true,
    },
    acceptProps: {
      label: "Borrar",
      severity: "danger",
    },
    accept: () => deleteDocument(doc),
  });
}

async function deleteDocument(doc) {
  try {
    await ApiService.deleteDocument(doc.id);
    documents.value = documents.value.filter((d) => d.id !== doc.id);
    toast.add({
      severity: "success",
      summary: "Documento borrado",
      detail: doc.name,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo borrar el documento",
      life: 3000,
    });
    console.error(error);
  }
}

// ### Borrado de carpeta:
function confirmDeleteFolder(folder) {
  confirm.require({
    message: `¿Seguro que quieres borrar la carpeta "${folder.name}"? Los documentos de su interior no se borrarán, quedarán sin clasificar.`,
    header: "Borrar carpeta",
    rejectProps: {
      label: "Cancelar",
      severity: "secondary",
      text: true,
    },
    acceptProps: {
      label: "Borrar",
      severity: "danger",
    },
    accept: () => deleteFolder(folder),
  });
}

async function deleteFolder(folder) {
  try {
    await ApiService.deleteFolder(folder.id);

    // Eliminamos la carpeta visualmente
    folders.value = folders.value.filter((f) => f.id !== folder.id);

    // Los documentos que estaban dentro pasan a no tener carpeta localmente
    documents.value.forEach((doc) => {
      if (doc.folder_id === folder.id) {
        doc.folder_id = null;
      }
    });

    // Si la carpeta borrada era la activa, volvemos a "Todas las fuentes"
    if (activeFolderId.value === folder.id) {
      activeFolderId.value = null;
    }

    toast.add({
      severity: "success",
      summary: "Carpeta borrada",
      detail: folder.name,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo borrar la carpeta"),
      life: 3000,
    });
    console.error(error);
  }
}

// ## Ciclo de vida:
onMounted(loadAll);
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-gray-800">Base de Conocimientos</h1>
      <div class="flex gap-2">
        <Button label="Subir documento" severity="primary" @click="showUploadDialog = true">
          <template #icon><UploadIcon /></template>
        </Button>
        <Button
          label="Añadir URL"
          severity="secondary"
          outlined
          disabled
          title="Pendiente de implementar scraping"
        >
          <template #icon><LinkIcon /></template>
        </Button>
      </div>
    </div>

    <!-- Body -->
    <div class="grid grid-cols-[260px_1fr] gap-4 flex-1 min-h-0">
      <!-- Panel de carpetas -->
      <aside class="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-gray-700">Carpetas</span>
          <Button severity="secondary" text rounded @click="openCreateFolderDialog">
            <template #icon><AddIcon class="text-lg" /></template>
          </Button>
        </div>

        <!-- Todas las fuentes -->
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors duration-150"
          :class="
            activeFolderId === null
              ? 'bg-brand/10 text-brand font-medium'
              : 'text-slate-600 hover:bg-black/5'
          "
          @click="activeFolderId = null"
        >
          <FolderIcon class="text-[1.1rem]" />
          <span class="flex-1 text-left">Todas las fuentes</span>
          <span
            class="rounded-full px-2 text-xs min-w-6 text-center"
            :class="
              activeFolderId === null ? 'bg-brand/20 text-brand' : 'bg-black/5 text-slate-600'
            "
            >{{ documents.length }}</span
          >
        </button>

        <!-- Sin clasificar -->
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors duration-150"
          :class="
            activeFolderId === 'unclassified'
              ? 'bg-brand/10 text-brand font-medium'
              : 'text-slate-600 hover:bg-black/5'
          "
          @click="activeFolderId = 'unclassified'"
        >
          <FolderIcon class="text-[1.1rem]" />
          <span class="flex-1 text-left">Sin clasificar</span>
          <span
            class="rounded-full px-2 text-xs min-w-6 text-center"
            :class="
              activeFolderId === 'unclassified'
                ? 'bg-brand/20 text-brand'
                : 'bg-black/5 text-slate-600'
            "
            >{{ documents.filter((d) => d.folder_id === null).length }}</span
          >
        </button>

        <div class="h-px bg-gray-100 my-1"></div>

        <!-- Carpetas reales -->
        <button
          v-for="folder in folders"
          :key="folder.id"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors duration-150"
          :class="
            activeFolderId === folder.id
              ? 'bg-brand/10 text-brand font-medium'
              : 'text-slate-600 hover:bg-black/5'
          "
          @click="activeFolderId = folder.id"
        >
          <FolderIcon class="text-[1.1rem]" />
          <span class="flex-1 text-left truncate">{{ folder.name }}</span>
          <span
            class="rounded-full px-2 text-xs min-w-[1.5rem] text-center"
            :class="activeFolderId === folder.id ? 'bg-brand/20 text-brand' : 'bg-black/5 text-slate-600'"
          >{{ documents.filter((d) => d.folder_id === folder.id).length }}</span>
        </button>
      </aside>

      <!-- Tabla -->
      <section class="bg-white rounded-xl shadow-sm flex flex-col min-h-0 overflow-hidden">
        <!-- Cabecera de la tabla con buscador -->
        <div class="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <span class="font-semibold text-gray-700 text-xl">
              <template v-if="activeFolderId === null">Todas las fuentes</template>
              <template v-else-if="activeFolderId === 'unclassified'">Sin clasificar</template>
              <template v-else>{{ activeFolder?.name }}</template>
            </span>
            <!-- Acciones de carpeta en la cabecera -->
            <div v-if="activeFolder" class="ml-1 flex items-center gap-1">
              <div class="w-px h-6 bg-gray-200 mx-1"></div>
              <Button
                severity="secondary"
                text
                rounded
                @click="openEditFolderDialog(activeFolder)"
                title="Renombrar carpeta"
              >
                <template #icon><EditIcon class="text-lg" /></template>
              </Button>
              <Button
                severity="danger"
                text
                rounded
                @click="confirmDeleteFolder(activeFolder)"
                title="Borrar carpeta"
              >
                <template #icon><TrashIcon class="text-lg" /></template>
              </Button>
            </div>
          </div>
          <IconField class="w-full md:w-80">
            <InputIcon>
              <SearchIcon class="text-gray-400" />
            </InputIcon>
            <InputText v-model="search" placeholder="Buscar documentos..." class="w-full" />
          </IconField>
        </div>

        <!-- Vista cuando no hay documentos -->
        <div
          v-if="!isLoading && visibleDocuments.length === 0"
          class="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
          <FolderOpenIcon class="text-5xl text-gray-300 mb-3" />
          <p class="text-gray-700 font-medium mb-1">
            <template v-if="documents.length === 0">Aún no hay documentos</template>
            <template v-else>Esta carpeta está vacía</template>
          </p>
          <p class="text-sm text-gray-500 mb-4">
            <template v-if="documents.length === 0">
              Sube el primero para empezar a alimentar la base de conocimiento
            </template>
            <template v-else>Selecciona otra carpeta o sube un documento a esta</template>
          </p>
          <Button
            v-if="documents.length === 0"
            label="Subir documento"
            severity="primary"
            @click="showUploadDialog = true"
          >
            <template #icon><UploadIcon /></template>
          </Button>
        </div>

        <!-- Tabla cuando hay documentos -->
        <DataTable
          v-else
          :value="visibleDocuments"
          :global-filter-fields="['name']"
          :globalFilter="search"
          :loading="isLoading"
          paginator
          :rows="10"
          :rows-per-page-options="[10, 25, 50]"
          scrollable
          scroll-height="flex"
          class="flex-1 min-h-0"
        >
          <!-- Nombre + meta -->
          <Column field="name" header="Nombre">
            <template #body="{ data }">
              <button
                class="text-left text-brand hover:underline font-medium cursor-pointer"
                @click="downloadDocument(data)"
              >
                {{ data.name }}
              </button>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ data.source_type.toUpperCase() }}
                <template v-if="getFolderName(data.folder_id)">
                  / {{ getFolderName(data.folder_id) }}
                </template>
              </div>
            </template>
          </Column>

          <!-- Última actualización -->
          <Column field="created_at" header="Última actualización" style="width: 180px">
            <template #body="{ data }">
              {{ formatDate(data.created_at) }}
            </template>
          </Column>

          <!-- Fecha de expiración -->
          <Column field="expires_at" header="Fecha de expiración" style="width: 180px">
            <template #body="{ data }">
              {{ formatDate(data.expires_at) }}
            </template>
          </Column>

          <!-- Estado -->
          <Column header="Estado" style="width: 100px">
            <template #body="{ data }">
              <ToggleSwitch v-model="data.is_active" @change="toggleActive(data)" />
            </template>
          </Column>

          <!-- Acciones -->
          <Column header="Acciones" style="width: 110px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button severity="secondary" text rounded @click="openEditDialog(data)">
                  <template #icon><EditIcon /></template>
                </Button>
                <Button severity="danger" text rounded @click="confirmDeleteDocument(data)">
                  <template #icon><TrashIcon /></template>
                </Button>
              </div>
            </template>
          </Column>
        </DataTable>
      </section>
    </div>

    <!-- Diálogos -->
    <UploadDocumentDialog
      v-model:visible="showUploadDialog"
      :folders="folders"
      :default-folder-id="activeFolderId"
      @uploaded="onDocumentUploaded"
    />
    <EditDocumentDialog
      v-model:visible="showEditDialog"
      :folders="folders"
      :document="editingDocument"
      @updated="onDocumentUpdated"
    />
    <FolderFormDialog
      v-model:visible="showFolderDialog"
      :folder="editingFolder"
      @created="onFolderCreated"
      @updated="onFolderUpdated"
    />
  </div>
</template>