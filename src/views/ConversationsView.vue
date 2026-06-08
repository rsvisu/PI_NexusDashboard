<script setup>
import { ref, computed, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import EyeIcon from "~icons/material-symbols/visibility-outline";
import TrashIcon from "~icons/material-symbols/delete-outline";
import ForumIcon from "~icons/material-symbols/forum-outline";
import ApiService from "@/services/api";

// ## Variables:
const conversations = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Rango [desde, hasta] del DatePicker; null mientras no se filtra
const dateRange = ref(null);

// Conversaciones que caen dentro del rango de fechas elegido
const filteredConversations = computed(() => {
  if (!dateRange.value || !dateRange.value[0]) {
    return conversations.value;
  }
  const start = new Date(dateRange.value[0]);
  start.setHours(0, 0, 0, 0);
  // Si solo se ha elegido la fecha de inicio, filtramos ese único día
  let end;
  if (dateRange.value[1]) {
    end = new Date(dateRange.value[1]);
  } else {
    end = new Date(dateRange.value[0]);
  }
  end.setHours(23, 59, 59, 999);
  return conversations.value.filter((conversation) => {
    const started = new Date(conversation.started_at);
    return started >= start && started <= end;
  });
});

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
      <!-- Barra con el filtro de fechas, siempre visible aunque la tabla quede vacía -->
      <div class="px-4 py-4 border-b border-gray-100">
        <DatePicker
          v-model="dateRange"
          selection-mode="range"
          :manual-input="false"
          date-format="dd/mm/yy"
          placeholder="Filtrar por fecha"
          show-icon
          show-button-bar
          class="w-full md:w-80"
        />
      </div>

      <!-- Mensaje cuando el filtro de fechas no devuelve resultados -->
      <div
        v-if="!isLoading && filteredConversations.length === 0"
        class="flex-1 flex flex-col items-center justify-center text-center p-8"
      >
        <ForumIcon class="text-5xl text-gray-300 mb-3" />
        <p class="text-gray-700 font-medium mb-1">No hay conversaciones en estas fechas</p>
        <p class="text-sm text-gray-500">Prueba a ampliar el rango o a limpiar el filtro</p>
      </div>

      <!-- Tabla -->
      <DataTable
        v-else
        :value="filteredConversations"
        paginator
        :rows="10"
        :rows-per-page-options="[10, 25, 50]"
        :loading="isLoading"
        scrollable
        scroll-height="flex"
        class="flex-1 min-h-0"
      >
        <!-- ID -->
        <Column field="id" header="ID">
          <template #body="{ data }">
            {{ data.id }}
          </template>
        </Column>

        <!-- Inicio de la conversación, coincide con el primer mensaje -->
        <Column field="started_at" header="Fecha de inicio">
          <template #body="{ data }">
            {{ new Date(data.started_at).toLocaleString("es-ES") }}
          </template>
        </Column>

        <!-- Primer mensaje -->
        <Column field="first_message" header="Primer mensaje">
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.first_message ?? "—" }}</span>
          </template>
        </Column>

        <!-- Número de mensajes -->
        <Column field="message_count" header="Mensajes" style="width: 100px; text-align: center" />

        <!-- Acciones -->
        <Column header="Acciones" style="width: 100px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <!-- Botón ver -->
              <RouterLink :to="`/conversaciones/${data.id}`">
                <Button severity="secondary" text rounded>
                  <template #icon><EyeIcon /></template>
                </Button>
              </RouterLink>
              <!-- Botón borrar -->
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
