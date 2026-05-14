<script setup>
import { useRoute } from "vue-router";
import AppSidebar from "@/components/app/AppSidebar.vue";

const route = useRoute();
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <AppSidebar v-if="route.name !== 'login'" />
    <main class="flex-1 flex flex-col overflow-hidden p-8">
      <RouterView />
    </main>
  </div>
</template>