<script setup>
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue';
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue';
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue';
</script>

<template>
  <!-- Dashboard -->
  <VerticalNavGroup
    :item="{
      title: 'Dashboard',
      icon: 'ri-home-smile-line',
    }"
  >
    <VerticalNavLink
      :item="{
        title: 'Panel Principal',
        to: '/dashboard',
      }"
    />
  </VerticalNavGroup>

  <!-- CouponBook Entities -->
  <VerticalNavSectionTitle
    :item="{
      heading: 'CouponBook',
    }"
  />
  
  <!-- BOOKS -->
  <VerticalNavGroup
    :item="{
      title: 'Books',
      icon: 'ri-book-line',
    }"
  >
    <VerticalNavLink
      :item="{
        title: 'Listado',
        to: '/books/index',
      }"
    />
  </VerticalNavGroup>
  
  <!-- CUPONES -->
  <VerticalNavGroup
    :item="{
      title: 'Cupones',
      icon: 'ri-coupon-line',
    }"
  >
    <VerticalNavLink
      :item="{
        title: 'Listado',
        to: '/cupones/index',
      }"
    />
  </VerticalNavGroup>

  <!-- ASIGNACIONES -->
  <VerticalNavGroup
    :item="{
      title: 'Asignaciones',
      icon: 'ri-links-line',
    }"
  >
    <VerticalNavLink
      :item="{
        title: 'Listado',
        to: '/asignaciones/index',
      }"
    />
  </VerticalNavGroup>


  <!-- CANJES -->
  <VerticalNavGroup
    :item="{
      title: 'Canjes',
      icon: 'ri-gift-line',
    }"
  >
    <VerticalNavLink
      :item="{
        title: 'Canjes Realizados',
        to: '/canjes/index',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'Validar Canje',
        to: '/canjes/validar',
      }"
    />
  </VerticalNavGroup>

  <!-- Sistema -->
  <VerticalNavSectionTitle
    :item="{
      heading: 'Sistema',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Usuarios',
      icon: 'ri-user-settings-line',
      to: '/usuarios/index',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Bull Monitor',
      icon: 'ri-dashboard-line',
      to: '/sistema/bull-monitor',
    }"
  />

  <!-- INFO -->
  <VerticalNavLink
    :item="{
      title: 'Info',
      icon: 'ri-information-line',
      to: '/info/index',
    }"
  />
</template>

