<script setup>
import { computed, ref } from "vue";
import CopyIcon from "~icons/material-symbols/content-copy-rounded";
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

// ## Clases dinamicas:
const bubbleClasses = computed(() =>
  isUserMessage.value ? "self-end items-end" : "self-start items-start",
);

const rowClasses = computed(() =>
  isUserMessage.value ? "flex-row-reverse" : "flex-row",
);

const avatarClasses = computed(() =>
  isUserMessage.value ? "bg-brand" : "bg-gray-400",
);

const messageClasses = computed(() =>
  isUserMessage.value
    ? "bg-brand text-white rounded-br-sm"
    : "bg-gray-100 text-gray-800 rounded-bl-sm",
);

// ## Funciones:
// Funcion copiar mensaje
async function copyMessage() {
  try {
    await navigator.clipboard.writeText(props.message);
    copied.value = true;
    // Espera de 1200ms para eliminar el mensaje de confirmacion
    globalThis.setTimeout(() => {
      copied.value = false;
    }, 1200);
  } catch {
    copied.value = false;
  }
}

// Funcion para formatear la hora del mensaje
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
</script>

<template>
  <div class="group mt-2 max-w-[90%] flex flex-col" :class="bubbleClasses">
    <!-- Avatar + message -->
    <div class="flex items-center gap-2" :class="rowClasses">
      <!-- Avatar-->
      <div
        class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white"
        :class="avatarClasses"
      >
        <PersonIcon v-if="isUserMessage" class="size-5" />
        <BotIcon v-else class="size-5" />
      </div>
      <!-- Message-->
      <div class="wrap-break-word px-4 py-2 rounded-xl shadow-sm" :class="messageClasses">
        {{ props.message }}
      </div>
    </div>

    <!-- Time + copy button -->
    <div
      class="flex justify-between gap-1 mt-1 px-1 text-xs w-full"
      :class="rowClasses"
    >
      <!-- Time -->
      <span class="text-gray-400">{{ formatTime(props.date) }}</span>
      <!-- Copy button -->
      <div
        class="flex items-center gap-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity text-muted"
      >
        <button
          type="button"
          tabindex="-1"
          class="p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
          @click="copyMessage"
        >
          <CopyIcon class="size-4" />
        </button>
        <span v-if="copied" class="text-muted">Copiado</span>
      </div>
    </div>
  </div>
</template>
