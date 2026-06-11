<script setup>
import { computed, ref } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import CopyIconOutline from "~icons/material-symbols/content-copy-outline";
import CopyIconFilled from "~icons/material-symbols/content-copy";
import BotIcon from "~icons/material-symbols/smart-toy-outline";
import PersonIcon from "~icons/material-symbols/person-outline";

// Props:
const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    required: true,
  },
});

// ## Variables:
const copied = ref(false);
const isUserMessage = computed(() => props.role === "user");

// ## Clases dinámicas:
const bubbleClasses = computed(() =>
  isUserMessage.value ? "self-end items-end" : "self-start items-start",
);

const rowClasses = computed(() => (isUserMessage.value ? "flex-row-reverse" : "flex-row"));

const avatarClasses = computed(() => (isUserMessage.value ? "bg-brand" : "bg-gray-400"));

const messageClasses = computed(() =>
  isUserMessage.value
    ? "bg-brand text-white rounded-br-sm"
    : "bg-gray-100 text-gray-800 rounded-bl-sm",
);

const timeRowClasses = computed(() => (isUserMessage.value ? "justify-end pr-11" : "pl-11"));

// ## Funciones:
// Función copiar mensaje
async function copyMessage() {
  try {
    await navigator.clipboard.writeText(props.message);
    copied.value = true;
    // Espera de 1200ms para eliminar el mensaje de confirmación
    globalThis.setTimeout(() => {
      copied.value = false;
    }, 1200);
  } catch {
    copied.value = false;
  }
}

// Convierte el markdown a HTML para mostrarlo con estilos
const renderedMessage = computed(() => {
  return DOMPurify.sanitize(marked.parse(props.message));
});

// Función para formatear la hora del mensaje
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
</script>

<template>
  <div class="group mt-2 max-w-[90%] flex flex-col" :class="bubbleClasses">
    <!-- Avatar + message -->
    <div class="flex items-start gap-2" :class="rowClasses">
      <!-- Avatar-->
      <div
        class="shrink-0 w-9 h-9 mt-1 rounded-full flex items-center justify-center text-white"
        :class="avatarClasses"
      >
        <PersonIcon v-if="isUserMessage" class="size-5" />
        <BotIcon v-else class="size-5" />
      </div>
      <!-- Message-->
      <div class="wrap-break-word px-4 py-2 rounded-xl shadow-sm" :class="messageClasses">
        <!-- Bot message -->
        <div
          v-if="!isUserMessage"
          v-html="renderedMessage"
          class="prose max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        />
        <!-- User message -->
        <span v-else>{{ message }}</span>
      </div>
    </div>

    <!-- Time + copy button -->
    <div class="flex items-center gap-1 p-3 text-sm" :class="timeRowClasses">
      <!-- Copy button -->
      <button
        type="button"
        tabindex="-1"
        class="opacity-0 group-hover:opacity-100 flex items-center p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        @click="copyMessage"
      >
        <CopyIconFilled v-if="copied" class="size-4 text-brand" />
        <CopyIconOutline v-else class="size-4 text-muted" />
      </button>
      <!-- Time -->
      <span class="text-gray-400">{{ formatTime(props.date) }}</span>
    </div>
  </div>
</template>
