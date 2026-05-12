<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getConversation } from "@/services/api";
import Button from "primevue/button";
import ArrowBackIcon from "~icons/material-symbols/arrow-back";
import BotIcon from "~icons/material-symbols/smart-toy-outline";
import PersonIcon from "~icons/material-symbols/person-outline";
import CalendarIcon from "~icons/material-symbols/calendar-today";
import ChatIcon from "~icons/material-symbols/chat-bubble-outline";

const route = useRoute();

const conversation = ref(null);
const messages = ref([]);
const isLoading = ref(false);
const error = ref(null);

onMounted(async () => {
  isLoading.value = true;
  try {
    const data = await getConversation(route.params.id);
    conversation.value = data.conversation;
    messages.value = data.messages;
  } catch (e) {
    error.value = "No se pudo cargar la conversación";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Cabecera -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/conversaciones">
          <Button text rounded severity="secondary">
            <template #icon>
              <ArrowBackIcon />
            </template>
          </Button>
        </RouterLink>
        <h1 class="text-2xl font-semibold text-gray-800">Conversación #{{ route.params.id }}</h1>
      </div>

      <!-- Subtítulo con fecha y número de mensajes -->
      <div v-if="conversation" class="flex items-center gap-4 mt-1 ml-11 text-sm text-gray-500">
        <span class="flex items-center gap-1">
          <CalendarIcon class="text-base" />
          {{ formatDate(conversation.started_at) }}
        </span>
        <span class="flex items-center gap-1">
          <ChatIcon class="text-base" />
          {{ messages.length }} mensajes
        </span>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="isLoading" class="text-gray-500">Cargando mensajes...</div>

    <!-- Error -->
    <p v-else-if="error" class="text-red-500">{{ error }}</p>

    <!-- Transcripción -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="flex flex-col gap-4">
        <p v-if="messages.length === 0" class="text-gray-400">
          No hay mensajes en esta conversación.
        </p>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex items-end gap-2 w-full"
          :class="message.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'"
        >
          <!-- Avatar -->
          <div
            class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-base"
            :class="message.sender_type === 'user' ? 'bg-brand' : 'bg-gray-400'"
          >
            <PersonIcon v-if="message.sender_type === 'user'" />
            <BotIcon v-else />
          </div>

          <!-- Burbuja -->
          <div
            class="flex flex-col gap-1 min-w-0 max-w-[70%]"
            :class="message.sender_type === 'user' ? 'items-end' : 'items-start'"
          >
            <div
              class="rounded-2xl px-5 py-3"
              :class="
                message.sender_type === 'user'
                  ? 'bg-brand text-white rounded-br-sm'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              "
            >
              {{ message.content }}
            </div>
            <!-- Hora -->
            <span class="text-xs text-gray-400 px-1">{{ formatTime(message.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
