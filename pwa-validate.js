// pwa-validate.js - Execute no console do navegador
(async function validatePWA() {
  console.log('🔍 Validando PWA do Dopamine Quest...\n');
  
  // 1. Verificar Service Worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      console.log('✅ Service Worker registrado:', registrations[0].scope);
    } else {
      console.log('❌ Service Worker NÃO registrado');
    }
  } else {
    console.log('⚠️ Service Worker não suportado neste navegador');
  }
  
  // 2. Verificar manifesto
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log('✅ Manifest encontrado:', manifestLink.href);
    const response = await fetch(manifestLink.href);
    const manifest = await response.json();
    console.log('📦 Manifest contém ícones:', manifest.icons.length);
  } else {
    console.log('❌ Manifest não encontrado');
  }
  
  // 3. Verificar instalação
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('🎉 App rodando em modo standalone (instalado!)');
  } else {
    console.log('📱 App rodando no navegador (não instalado)');
  }
  
  // 4. Verificar cache
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('💾 Caches disponíveis:', cacheNames);
  }
  
  console.log('\n✨ Validação concluída!');
})();