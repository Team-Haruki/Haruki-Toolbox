<template>
  <router-view v-slot="{ Component }">
    <Transition name="page-blur-fade" mode="out-in">
      <component :is="Component"/>
    </Transition>
  </router-view>
</template>