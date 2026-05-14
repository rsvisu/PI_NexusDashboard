<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import ApiService from "@/services/api";
import MessageBubble from "@/components/messages/MessageBubble.vue";
import ArrowBackIcon from "~icons/material-symbols/arrow-back";
import CalendarIcon from "~icons/material-symbols/calendar-today";
import ChatIcon from "~icons/material-symbols/chat-bubble-outline";

// ## Router:
const route = useRoute();

// ## Variables:
const conversation = ref(null);
const messages = ref([]);
const isLoading = ref(false);
const error = ref(null);

// ## Funciones:
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ## Ciclo de vida:
onMounted(async () => {
  isLoading.value = true;
  try {
    const data = await ApiService.getConversation(route.params.id);
    conversation.value = data.conversation;
    messages.value = data.messages;
  } catch (e) {
    error.value = "No se pudo cargar la conversación";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <!-- Title + subtitle -->
      <div>
        <!-- Title -->
        <h1 class="text-2xl font-semibold text-gray-800">Conversación #{{ route.params.id }}</h1>
        <!-- Subtitle -->
        <div v-if="conversation" class="flex items-center gap-4 mt-1 text-sm text-gray-500">
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

      <!-- Back Button -->
      <RouterLink
        to="/conversaciones"
        class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowBackIcon class="size-4" />
        Volver a conversaciones
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-gray-500">Cargando mensajes...</div>

    <!-- Error -->
    <p v-else-if="error" class="text-red-500">{{ error }}</p>

    <!-- Transcript -->
    <div v-else class="flex-1 min-h-0 bg-white rounded-xl shadow-sm overflow-y-auto p-6">
      <p v-if="messages.length === 0" class="text-gray-400">
        No hay mensajes en esta conversación.
      </p>

      <div class="flex flex-col gap-3">
        <MessageBubble
          v-for="(message, index) in messages"
          :key="index"
          :role="message.sender_type"
          :message="message.content"
          :date="message.created_at"
        />
      </div>
    </div>
  </div>
</template>
