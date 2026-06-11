<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Textarea from "primevue/textarea";
import Tag from "primevue/tag";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
import ApiService from "@/services/api";
import { getErrorMessage } from "@/utils/apiError";

// ## Servicios:
const toast = useToast();
const confirm = useConfirm();

// ## Estado general:
const isLoading = ref(true);
const isSaving = ref(false);

// ## Estado del formulario:
// Saludo editable; "" significa "usar el default" del backend
const greeting = ref("");
// Límite de mensajes editable; null significa "usar el default" del backend
const rateLimitMax = ref(null);
// De la API key solo sabemos si hay una guardada; nunca la recibimos
const apiKeySet = ref(false);
// Clave nueva que escribe el admin; vacía = no cambiarla
const newApiKey = ref("");
// Prompt de sistema editable; "" significa "usar el default" del backend
const systemPrompt = ref("");
const isDeletingApiKey = ref(false);
// Sugerencias de bienvenida clicables del widget; [] = no configuradas
const suggestions = ref([]);
// Texto del campo para añadir una nueva sugerencia
const newSuggestion = ref("");

// Defaults del backend; se muestran como placeholder cuando el campo está vacío
const defaults = ref({ rate_limit_max: null, greeting: "" });

// Última config recibida del backend; base para revertir al cancelar
const loadedConfig = ref(null);

// ## Funciones:
/**
 * Vuelca una respuesta de config del backend en los refs del formulario.
 * @param {object} config - Respuesta de GET/PATCH /api/config
 */
function applyConfig(config) {
  loadedConfig.value = config;
  defaults.value = config.defaults;
  apiKeySet.value = config.openai_api_key_set;
  // El number se mapea tal cual: null del backend = InputNumber vacío
  rateLimitMax.value = config.rate_limit_max;
  // El textarea no admite null, así que lo convertimos a ""
  greeting.value = config.greeting === null ? "" : config.greeting;
  // null en BD = sin sugerencias configuradas; spread para no compartir referencia con loadedConfig
  suggestions.value = config.suggestions === null ? [] : [...config.suggestions];
  // null en BD = el LLM usa el default de defaults.js
  systemPrompt.value = config.system_prompt === null ? "" : config.system_prompt;
  // Descartamos cualquier API key o sugerencia a medio escribir
  newApiKey.value = "";
  newSuggestion.value = "";
}

// ## Ciclo de vida:
onMounted(async () => {
  try {
    const config = await ApiService.getConfig();
    applyConfig(config);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo cargar la configuración"),
      life: 4000,
    });
  } finally {
    isLoading.value = false;
  }
});

/**
 * Guarda la config editable y refresca el formulario con lo que devuelve el backend.
 * Traduce el "vacío" del formulario al null que el backend trata como "usar el default".
 */
async function saveConfig() {
  isSaving.value = true;

  // Saludo vacío => null para que el backend aplique el default
  const greetingToSend = greeting.value.trim() === "" ? null : greeting.value;
  // La API key solo se manda si se ha escrito una nueva; vacía => undefined (no tocar)
  const apiKeyToSend = newApiKey.value === "" ? undefined : newApiKey.value;
  // Sin sugerencias => null para limpiar el campo en BD
  const suggestionsToSend = suggestions.value.length === 0 ? null : suggestions.value;
  // Prompt vacío => null para que el backend aplique el default
  const systemPromptToSend = systemPrompt.value.trim() === "" ? null : systemPrompt.value;

  try {
    const updated = await ApiService.updateConfig({
      rate_limit_max: rateLimitMax.value,
      greeting: greetingToSend,
      openai_api_key: apiKeyToSend,
      suggestions: suggestionsToSend,
      system_prompt: systemPromptToSend,
    });
    // El backend responde con la config ya guardada; la reutilizamos para refrescar el formulario
    applyConfig(updated);
    toast.add({
      severity: "success",
      summary: "Guardado",
      detail: "Configuración actualizada",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo guardar la configuración"),
      life: 4000,
    });
  } finally {
    isSaving.value = false;
  }
}

// Descarta los cambios sin guardar volviendo a la última config recibida del backend
function cancel() {
  applyConfig(loadedConfig.value);
}

function addSuggestion() {
  const text = newSuggestion.value.trim();
  if (!text || suggestions.value.length >= 5) return;
  suggestions.value.push(text);
  newSuggestion.value = "";
}

function removeSuggestion(index) {
  suggestions.value.splice(index, 1);
}

function confirmDeleteApiKey() {
  confirm.require({
    message:
      "¿Seguro que quieres eliminar la API key guardada? El asistente dejará de responder hasta que configures una nueva.",
    header: "Eliminar API key",
    rejectProps: { label: "Cancelar", severity: "secondary", text: true },
    acceptProps: { label: "Eliminar", severity: "danger" },
    accept: deleteApiKey,
  });
}

/**
 * Borra la API key guardada de inmediato, sin esperar al botón Guardar.
 */
async function deleteApiKey() {
  isDeletingApiKey.value = true;
  // null borra la clave guardada
  try {
    const updated = await ApiService.updateConfig({ openai_api_key: null });
    apiKeySet.value = updated.openai_api_key_set;
    // Sincronizamos loadedConfig para que un Cancelar posterior no resucite la clave borrada
    loadedConfig.value = updated;
    newApiKey.value = "";
    toast.add({
      severity: "success",
      summary: "Eliminada",
      detail: "API key eliminada",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo eliminar la API key"),
      life: 4000,
    });
  } finally {
    isDeletingApiKey.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-800">Configuración General</h1>
      <div v-if="!isLoading" class="flex gap-2">
        <Button label="Cancelar" severity="secondary" :disabled="isSaving" @click="cancel" />
        <Button label="Guardar" :loading="isSaving" @click="saveConfig" />
      </div>
    </div>

    <!-- Esqueleto de carga -->
    <div v-if="isLoading" class="text-sm text-gray-500">Cargando configuración...</div>

    <!-- Contenido -->
    <template v-else>
      <section class="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs value="widget" class="flex flex-col flex-1 min-h-0">
          <TabList class="px-4">
            <Tab value="widget">Widget</Tab>
            <Tab value="tecnico">Técnico</Tab>
          </TabList>

          <TabPanels class="flex-1 overflow-y-auto">
            <!-- Pestaña Widget -->
            <TabPanel value="widget" class="px-4 py-5 flex flex-col gap-5">
              <!-- Mensaje de bienvenida -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5 border-b border-gray-100">
                <div class="md:col-span-1">
                  <h3 class="text-base font-semibold text-gray-800">Mensaje de bienvenida</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    El saludo inicial del asistente. Déjalo vacío para usar el valor por defecto.
                  </p>
                </div>
                <div class="md:col-span-2 flex flex-col gap-3">
                  <Textarea
                    v-model="greeting"
                    rows="3"
                    auto-resize
                    maxlength="500"
                    :placeholder="defaults.greeting"
                    class="w-full max-w-xl"
                  />
                </div>
              </div>

              <!-- Sugerencias de bienvenida -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1">
                  <h3 class="text-base font-semibold text-gray-800">Sugerencias (FAQ)</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    Preguntas predefinidas que aparecen antes del primer mensaje del usuario.
                  </p>
                </div>
                <div class="md:col-span-2 flex flex-col gap-3">
                  <!-- Campo para añadir una nueva -->
                  <div class="flex flex-col gap-1 w-full max-w-xl">
                    <div class="flex gap-2">
                      <InputText
                        v-model="newSuggestion"
                        :placeholder="
                          suggestions.length >= 5
                            ? 'Límite máximo alcanzado'
                            : 'Escribe una nueva sugerencia...'
                        "
                        class="flex-1"
                        @keydown.enter.prevent="addSuggestion"
                        :disabled="suggestions.length >= 5"
                      />
                      <Button
                        label="Añadir"
                        severity="secondary"
                        @click="addSuggestion"
                        :disabled="!newSuggestion.trim() || suggestions.length >= 5"
                      />
                    </div>
                    <div class="flex justify-between items-center mt-2 px-1">
                      <span class="text-xs text-gray-500 font-medium">LISTA DE SUGERENCIAS</span>
                      <span
                        class="text-xs"
                        :class="
                          suggestions.length >= 5 ? 'text-orange-500 font-medium' : 'text-gray-400'
                        "
                      >
                        {{ suggestions.length }} / 5
                      </span>
                    </div>
                  </div>

                  <!-- Lista de sugerencias actuales -->
                  <div
                    v-if="suggestions.length > 0"
                    class="flex flex-col gap-2 w-full max-w-xl -mt-1"
                  >
                    <div
                      v-for="(suggestion, index) in suggestions"
                      :key="index"
                      class="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
                    >
                      <span class="break-words line-clamp-2 leading-relaxed">{{ suggestion }}</span>
                      <button
                        type="button"
                        class="text-gray-400 hover:text-red-500 transition-colors cursor-pointer text-lg leading-none flex-shrink-0 font-medium px-1"
                        title="Eliminar sugerencia"
                        @click="removeSuggestion(index)"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p v-else class="text-sm text-gray-400 italic pl-1 -mt-1">
                    No hay sugerencias configuradas.
                  </p>
                </div>
              </div>
            </TabPanel>

            <!-- Pestaña Técnico -->
            <TabPanel value="tecnico" class="px-4 py-5 flex flex-col gap-5">
              <!-- API de OpenAI -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5 border-b border-gray-100">
                <div class="md:col-span-1">
                  <h3 class="text-base font-semibold text-gray-800">API de OpenAI</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    Clave necesaria para generar respuestas. Se almacena de forma segura.
                  </p>
                </div>
                <div class="md:col-span-2 flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <Tag v-if="apiKeySet" value="Configurada" severity="success" />
                    <Tag v-else value="Sin configurar" severity="warn" />
                    <Button
                      v-if="apiKeySet"
                      label="Eliminar"
                      severity="danger"
                      text
                      size="small"
                      :loading="isDeletingApiKey"
                      @click="confirmDeleteApiKey"
                    />
                  </div>
                  <Password
                    v-model="newApiKey"
                    :feedback="false"
                    toggle-mask
                    placeholder="sk-... (dejar en blanco para no cambiar)"
                    class="w-full max-w-md"
                    input-class="w-full"
                  />
                </div>
              </div>

              <!-- Límites de uso -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5 border-b border-gray-100">
                <div class="md:col-span-1">
                  <h3 class="text-base font-semibold text-gray-800">Límites de uso</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    Máximo de mensajes por IP / min (por defecto: {{ defaults.rate_limit_max }}).
                  </p>
                </div>
                <div class="md:col-span-2 flex flex-col gap-3 justify-center">
                  <InputNumber
                    v-model="rateLimitMax"
                    :min="1"
                    :max="1000"
                    :placeholder="String(defaults.rate_limit_max)"
                    show-buttons
                    class="w-full max-w-[12rem]"
                    input-class="w-full"
                  />
                </div>
              </div>

              <!-- Prompt de sistema -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1">
                  <h3 class="text-base font-semibold text-gray-800">Prompt de sistema</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    Instrucciones base que recibe el LLM en cada conversación.
                  </p>
                  <p class="text-sm text-amber-600 mt-2">
                    Es imprescindible tener un prompt configurado. Sin él, el asistente no tiene
                    contexto sobre el centro ni reglas de comportamiento y sus respuestas serán
                    genéricas o incorrectas.
                  </p>
                  <a
                    href="https://developers.openai.com/api/docs/guides/prompt-engineering"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-gray-600 hover:text-gray-700 hover:underline mt-1 inline-block transition-colors"
                    >Guía de prompt engineering →</a
                  >
                </div>
                <div class="md:col-span-2 flex flex-col gap-3">
                  <Textarea
                    v-model="systemPrompt"
                    rows="14"
                    auto-resize
                    maxlength="8000"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-400">{{ systemPrompt.length }} / 8000 caracteres</p>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </section>
    </template>
  </div>
</template>
