<script setup>
import { ref, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import EyeIcon from "~icons/material-symbols/visibility-outline";
import TrashIcon from "~icons/material-symbols/delete-outline";
import ForumIcon from "~icons/material-symbols/forum-outline";
import SearchIcon from "~icons/material-symbols/search";
import ApiService from "@/services/api";

// ## Variables:
const conversations = ref([]);
const search = ref("");
const isLoading = ref(false);
const error = ref(null);

// ## Ciclo de vida:
onMounted(async () => {
  isLoading.value = true;
  try {
    conversations.value = await ApiService.getConversations();
  } catch (e) {
    error.value = "No se pudieron cargar las conversaciones";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <h1 class="text-2xl font-semibold text-gray-800 mb-6">Conversaciones</h1>

    <!-- Error -->
    <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>

    <!-- Vista cuando no hay conversaciones -->
    <div
      v-if="!isLoading && conversations.length === 0"
      class="bg-white rounded-xl shadow-sm flex-1 flex flex-col items-center justify-center text-center p-12"
    >
      <ForumIcon class="text-5xl text-gray-300 mb-3" />
      <p class="text-gray-700 font-medium mb-1">Aún no hay conversaciones</p>
      <p class="text-sm text-gray-500">
        Aparecerán aquí cuando los visitantes empiecen a usar el widget en la web del centro
      </p>
    </div>

    <!-- Tabla cuando hay conversaciones -->
    <section
      v-else
      class="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden"
    >
      <DataTable
        :value="conversations"
        :global-filter-fields="['id', 'first_message']"
        :globalFilter="search"
        paginator
        :rows="10"
        :rows-per-page-options="[10, 25, 50]"
        :loading="isLoading"
        scrollable
        scroll-height="flex"
        class="flex-1 min-h-0"
      >
        <template #header>
          <div class="flex justify-start">
            <IconField class="w-full md:w-80">
              <InputIcon>
                <SearchIcon class="text-gray-400" />
              </InputIcon>
              <InputText
                v-model="search"
                placeholder="Buscar en conversaciones..."
                class="w-full"
              />
            </IconField>
          </div>
        </template>
        <!-- ID -->
        <Column field="id" header="ID">
          <template #body="{ data }">
            {{ data.id }}
          </template>
        </Column>

        <!-- Started At -->
        <Column field="started_at" header="Fecha y hora">
          <template #body="{ data }">
            {{ new Date(data.started_at).toLocaleString("es-ES") }}
          </template>
        </Column>

        <!-- First Message -->
        <Column field="first_message" header="Primer mensaje">
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.first_message ?? "—" }}</span>
          </template>
        </Column>

        <!-- Message Count -->
        <Column field="message_count" header="Mensajes" style="width: 100px; text-align: center" />

        <!-- Actions -->
        <Column header="Acciones" style="width: 100px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <!-- Button View -->
              <RouterLink :to="`/conversaciones/${data.id}`">
                <Button severity="secondary" text rounded>
                  <template #icon><EyeIcon /></template>
                </Button>
              </RouterLink>
              <!-- Button Delete -->
              <Button severity="danger" text rounded>
                <template #icon><TrashIcon /></template>
              </Button>
            </div>
          </template>
        </Column>
      </DataTable>
    </section>
  </div>
</template>
