<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Select from "primevue/select";
import ReviewsIcon from "~icons/material-symbols/reviews-outline";
import ThumbUpIcon from "~icons/material-symbols/thumb-up-outline";
import ThumbDownIcon from "~icons/material-symbols/thumb-down-outline";
import CheckIcon from "~icons/material-symbols/check-circle-outline";
import EyeIcon from "~icons/material-symbols/visibility-outline";
import ApiService from "@/services/api";
import { getErrorMessage } from "@/utils/apiError";

// ## Servicios:
const toast = useToast();

// ## Estado:
const feedback = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Filtro por tipo de voto
const voteOptions = [
  { label: "Negativos", value: "negative" },
  { label: "Positivos", value: "positive" },
  { label: "Todos", value: "all" },
];
const voteFilter = ref("negative");

// Filtro por estado de revisión
const statusOptions = [
  { label: "Pendientes", value: "pending" },
  { label: "Revisados", value: "reviewed" },
  { label: "Todos", value: "all" },
];
const statusFilter = ref("pending");

// ## Derivados:
const filteredFeedback = computed(() => {
  return feedback.value.filter((f) => {
    // Filtro por voto
    if (voteFilter.value !== "all" && f.vote !== voteFilter.value) {
      return false;
    }
    // Filtro por estado
    if (statusFilter.value === "pending" && f.is_reviewed) {
      return false;
    }
    if (statusFilter.value === "reviewed" && !f.is_reviewed) {
      return false;
    }
    return true;
  });
});

// ## Funciones:
function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString("es-ES");
}

async function markReviewed(item) {
  // Aplicamos el cambio en la UI de forma optimista
  item.is_reviewed = true;
  try {
    const updated = await ApiService.markFeedbackReviewed(item.id);
    const index = feedback.value.findIndex((f) => f.id === item.id);
    if (index !== -1) {
      feedback.value[index].is_reviewed = updated.is_reviewed;
    }
    toast.add({
      severity: "success",
      summary: "Marcado como revisado",
      life: 2500,
    });
  } catch (e) {
    // Revertimos si el backend rechaza
    item.is_reviewed = false;
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(e, "No se pudo marcar como revisado"),
      life: 3000,
    });
    console.error(e);
  }
}

// ## Ciclo de vida:
onMounted(async () => {
  isLoading.value = true;
  try {
    feedback.value = await ApiService.getFeedback();
  } catch (e) {
    error.value = "No se pudo cargar el feedback";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <h1 class="text-2xl font-semibold text-gray-800 mb-6">Feedback</h1>

    <!-- Error -->
    <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>

    <!-- Vista cuando no hay ningún feedback -->
    <div
      v-if="!isLoading && feedback.length === 0"
      class="bg-white rounded-xl shadow-sm flex-1 flex flex-col items-center justify-center text-center p-12"
    >
      <ReviewsIcon class="text-5xl text-gray-300 mb-3" />
      <p class="text-gray-700 font-medium mb-1">Aún no hay valoraciones</p>
      <p class="text-sm text-gray-500">
        Aparecerán aquí las respuestas que los usuarios voten en el widget
      </p>
    </div>

    <!-- Cuando hay feedback -->
    <div v-else class="flex flex-col flex-1 min-h-0">
      <section class="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Cabecera: filtros por tipo de voto y por estado -->
        <div class="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <label class="text-base text-gray-600">Voto:</label>
            <Select
              v-model="voteFilter"
              :options="voteOptions"
              option-label="label"
              option-value="value"
              class="w-40"
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-base text-gray-600">Estado:</label>
            <Select
              v-model="statusFilter"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-40"
            />
          </div>
        </div>

        <!-- Sin resultados para el filtro actual: ocupa el alto restante de la tarjeta -->
        <div
          v-if="filteredFeedback.length === 0"
          class="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
          <ReviewsIcon class="text-5xl text-gray-300 mb-3" />
          <p class="text-gray-700 font-medium mb-1">No hay feedback con estos filtros</p>
          <p class="text-sm text-gray-500">Prueba a cambiar el tipo de voto o el estado</p>
        </div>

        <!-- Tabla -->
        <DataTable
          v-else
          :value="filteredFeedback"
          paginator
          :rows="10"
          :rows-per-page-options="[10, 25, 50]"
          :loading="isLoading"
          scrollable
          scroll-height="flex"
          class="flex-1 min-h-0"
        >
          <!-- Voto -->
          <Column header="Voto" style="width: 90px">
            <template #body="{ data }">
              <ThumbUpIcon v-if="data.vote === 'positive'" class="text-xl text-brand" />
              <ThumbDownIcon v-else class="text-xl text-red-500" />
            </template>
          </Column>

          <!-- Fecha -->
          <Column field="created_at" header="Fecha" style="width: 180px">
            <template #body="{ data }">
              {{ formatDate(data.created_at) }}
            </template>
          </Column>

          <!-- Respuesta votada -->
          <Column field="message_content" header="Respuesta del asistente">
            <template #body="{ data }">
              <span class="text-gray-700 line-clamp-2">{{ data.message_content }}</span>
            </template>
          </Column>

          <!-- Estado -->
          <Column header="Estado" style="width: 130px">
            <template #body="{ data }">
              <Tag
                :value="data.is_reviewed ? 'Revisado' : 'Pendiente'"
                :severity="data.is_reviewed ? 'success' : 'warn'"
              />
            </template>
          </Column>

          <!-- Acciones -->
          <Column header="Acciones" style="width: 130px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <!-- Ver la conversación que originó el feedback -->
                <RouterLink :to="`/conversaciones/${data.conversation_id}`">
                  <Button severity="secondary" text rounded title="Ver conversación">
                    <template #icon><EyeIcon /></template>
                  </Button>
                </RouterLink>
                <!-- Marcar como revisado, solo si aún está pendiente -->
                <Button
                  v-if="!data.is_reviewed"
                  severity="success"
                  text
                  rounded
                  title="Marcar como revisado"
                  @click="markReviewed(data)"
                >
                  <template #icon><CheckIcon /></template>
                </Button>
              </div>
            </template>
          </Column>
        </DataTable>
      </section>
    </div>
  </div>
</template>
