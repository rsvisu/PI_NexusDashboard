<script setup>
import { ref, onMounted, computed } from "vue";
import Chart from "primevue/chart";
import ForumIcon from "~icons/material-symbols/forum-outline";
import ChatIcon from "~icons/material-symbols/chat-bubble-outline";
import DescriptionIcon from "~icons/material-symbols/description-outline";
import ThumbDownIcon from "~icons/material-symbols/thumb-down-outline";
import ApiService from "@/services/api";

// ## Estado:
const stats = ref(null);
const isLoading = ref(false);
const error = ref(null);

// Valores a mostrar en las tarjetas: '—' mientras no hay datos cargados
const displayStats = computed(() => {
  if (stats.value) {
    return stats.value;
  }
  return {
    total_conversations: "—",
    messages_today: "—",
    active_documents: "—",
    pending_feedback: "—",
  };
});

// Datos de la gráfica, calculados cuando llegan las stats del backend
const chartData = computed(() => {
  if (!stats.value) {
    return null;
  }

  // Formateamos las fechas como "lun 9", "mar 10"... para el eje X
  const labels = stats.value.messages_per_day.map((item) => {
    const date = new Date(item.date + "T00:00:00");
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
  });

  const values = stats.value.messages_per_day.map((item) => item.count);

  return {
    labels,
    datasets: [
      {
        label: "Mensajes",
        data: values,
        fill: true,
        backgroundColor: "rgba(231, 117, 30, 0.1)",
        borderColor: "#e7751e",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#e7751e",
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        // Solo números enteros en el eje Y (no tiene sentido mostrar 2.5 mensajes)
        precision: 0,
      },
    },
  },
};

// ## Ciclo de vida:
onMounted(async () => {
  isLoading.value = true;
  try {
    stats.value = await ApiService.getStats();
  } catch (e) {
    error.value = "No se pudieron cargar las métricas";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <h1 class="text-2xl font-semibold text-gray-800">Panel de control</h1>

    <!-- Error -->
    <p v-if="error" class="text-red-500">{{ error }}</p>

    <!-- Tarjetas de métricas -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <!-- Conversaciones totales -->
      <div class="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
        <div class="bg-blue-100 text-blue-600 rounded-full p-3 flex-shrink-0">
          <ForumIcon class="text-2xl" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-800">{{ displayStats.total_conversations }}</p>
          <p class="text-sm text-gray-500">Conversaciones</p>
        </div>
      </div>

      <!-- Mensajes enviados hoy -->
      <div class="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
        <div class="bg-orange-100 text-orange-500 rounded-full p-3 flex-shrink-0">
          <ChatIcon class="text-2xl" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-800">{{ displayStats.messages_today }}</p>
          <p class="text-sm text-gray-500">Mensajes hoy</p>
        </div>
      </div>

      <!-- Documentos activos en la base de conocimiento -->
      <div class="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
        <div class="bg-green-100 text-green-600 rounded-full p-3 flex-shrink-0">
          <DescriptionIcon class="text-2xl" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-800">{{ displayStats.active_documents }}</p>
          <p class="text-sm text-gray-500">Documentos activos</p>
        </div>
      </div>

      <!-- Feedback negativo sin revisar -->
      <div class="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
        <div class="bg-amber-100 text-amber-600 rounded-full p-3 flex-shrink-0">
          <ThumbDownIcon class="text-2xl" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-800">{{ displayStats.pending_feedback }}</p>
          <p class="text-sm text-gray-500">Feedback pendiente</p>
        </div>
      </div>
    </div>

    <!-- Gráfica de actividad: mensajes de usuario por día (últimos 7 días) -->
    <div class="bg-white rounded-xl shadow-sm p-6 flex flex-col flex-1 min-h-0">
      <h2 class="text-base font-semibold text-gray-700 mb-4">Mensajes - Últimos 7 días</h2>

      <div v-if="isLoading" class="flex-1 flex items-center justify-center text-sm text-gray-400">
        Cargando...
      </div>

      <div v-else-if="chartData" class="flex-1 min-h-0">
        <Chart type="line" :data="chartData" :options="chartOptions" class="h-full w-full" />
      </div>
    </div>
  </div>
</template>
