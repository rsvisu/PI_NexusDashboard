<script setup>
import { ref, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import EyeIcon from "~icons/material-symbols/visibility-outline";
import TrashIcon from "~icons/material-symbols/delete-outline";
import { getConversations } from "@/services/api";

const conversations = ref([]);
const search = ref("");
const isLoading = ref(false);
const error = ref(null);

onMounted(async () => {
  isLoading.value = true;
  try {
    conversations.value = await getConversations();
  } catch (e) {
    error.value = "No se pudieron cargar las conversaciones";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-800 mb-6">Conversaciones</h1>

    <!-- Buscador -->
    <div class="mb-4">
      <InputText v-model="search" placeholder="Buscar en conversaciones..." class="w-full" />
    </div>

    <!-- Error -->
    <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>

    <!-- Tabla -->
    <!-- TODO: Cambiar los colores de la tabla a la marca -->
    <DataTable
      :value="conversations"
      :global-filter-fields="['id', 'first_message']"
      :globalFilter="search"
      paginator
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      :loading="isLoading"
      empty-message="No hay conversaciones todavía"
      class="shadow-sm"
    >
      <Column field="id" header="ID">
        <template #body="{ data }">
          {{ data.id }}
        </template>
      </Column>

      <Column field="started_at" header="Fecha y hora">
        <template #body="{ data }">
          {{ new Date(data.started_at).toLocaleString("es-ES") }}
        </template>
      </Column>

      <Column field="first_message" header="Primer mensaje">
        <template #body="{ data }">
          <span class="text-gray-700">{{ data.first_message ?? "—" }}</span>
        </template>
      </Column>

      <Column field="message_count" header="Mensajes" style="width: 100px; text-align: center" />

      <Column header="Acciones" style="width: 100px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <RouterLink :to="`/conversaciones/${data.id}`">
              <Button severity="secondary" text rounded>
                <template #icon><EyeIcon /></template>
              </Button>
            </RouterLink>
            <Button severity="danger" text rounded>
              <template #icon><TrashIcon /></template>
            </Button>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
