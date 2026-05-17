<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";

// ## Router:
const router = useRouter();

// ## Store:
const authStore = useAuthStore();

// ## Variables:
const email = ref("");
const password = ref("");
const errorMessage = ref(null);
const loading = ref(false);

// ## Funciones:
async function handleLogin() {
  errorMessage.value = null;
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    router.push({ name: "home" });
  } catch {
    errorMessage.value = "Credenciales incorrectas";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <form
      class="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm flex flex-col gap-4"
      @submit.prevent="handleLogin"
    >
      <h1 class="text-2xl font-semibold text-center mb-2">Nexus — Acceso admin</h1>

      <div class="flex flex-col gap-1">
        <label for="email" class="text-sm">Email</label>
        <InputText id="email" v-model="email" type="email" required autocomplete="email" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="password" class="text-sm">Contraseña</label>
        <Password
          id="password"
          v-model="password"
          :feedback="false"
          toggle-mask
          required
          autocomplete="current-password"
          input-class="w-full"
        />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <Button type="submit" :loading="loading" label="Entrar" />
    </form>
  </div>
</template>
