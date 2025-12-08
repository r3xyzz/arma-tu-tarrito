// javascript.js
// Selecciona dinámicamente la mejor resolución de video disponible
(function(){
  const video = document.getElementById('video-fondo');
  if(!video) return;

  // Lista de resoluciones preferidas (de mayor a menor)
  // Variantes disponibles. He colocado 1080p en un lugar preferente
  const variants = [
    {name: 'video/video-fondo2.mp4', width: 9999},
    {name: 'video/video-fondo-1080.mp4', width: 1920},
    {name: 'video/video-fondo-2160.mp4', width: 3840},
    {name: 'video/video-fondo-1440.mp4', width: 2560},
    {name: 'video/video-fondo-720.mp4',  width: 1280},
    {name: 'video/video-fondo.mp4',      width: 0} // fallback
  ];

  // Decide la resolución objetivo según el ancho del viewport y la densidad de pixel
  function pickVariant(){
    // Si existe explicitly video-fondo2, preferirlo (usuario lo solicitó)
    const explicit = variants.find(v => v.name.includes('video-fondo2'));
    if(explicit) return explicit;
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = window.innerWidth * dpr;

    // Si la viewport real es al menos 1280, preferimos 1080p cuando esté disponible
    if(window.innerWidth >= 1280){
      const pref = variants.find(v => v.name.includes('-1080'));
      if(pref) return pref;
    }

    for(const v of variants){
      if(v.width === 0) return v; // fallback
      if(targetWidth <= v.width) return v;
    }
    return variants[variants.length-1];
  }

  // Comprobar existencia del archivo por petición HEAD (fetch) y devolver la primera existente
  async function findAvailableVariant(){
    for(const v of variants){
      try{
        const resp = await fetch(v.name, {method:'HEAD'});
        if(resp.ok) return v;
      }catch(e){
        // ignore
      }
    }
    return variants[variants.length-1];
  }

  // Cambia la fuente con un crossfade suave
  async function applyBest(){
    const chosen = pickVariant();
    // Si el elegido es el fallback por tamaño, intentar buscar realmente un archivo disponible
    let available = chosen;
    if(chosen.width !== 0){
      // preferir la variante que cumpla el target, pero comprobar disponibilidad
      const exists = await findAvailableVariant();
      available = exists || chosen;
    } else {
      // fallback, asegúrate que exista
      const exists = await findAvailableVariant();
      available = exists || chosen;
    }

    const current = video.querySelector('source')?.src || '';
    const newSrc = available.name;
    if(current.endsWith(newSrc)) return; // mismo archivo

    // Crossfade: reducir opacidad, cambiar src, esperar carga, volver a 1
    video.style.opacity = '0';
    await new Promise(r=>setTimeout(r,300));

    // Reemplazar source y cargar
    video.pause();
    video.innerHTML = '';
    const source = document.createElement('source');
    source.src = newSrc;
    source.type = 'video/mp4';
    video.appendChild(source);
    try{
      await video.load();
    }catch(e){/* some browsers don't return a promise */}
    // Intentar reproducir (está muted y playsinline en HTML)
    try{ await video.play(); }catch(e){ /* autoplay bloqueado en algunas condiciones */ }

    video.style.opacity = '1';
  }

  // Ejecutar al inicio y en resize con debounce
  applyBest();
  let t;
  window.addEventListener('resize', ()=>{
    clearTimeout(t);
    t = setTimeout(applyBest, 300);
  });
})();

// --- Topbar menu interactions ---
(function(){
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.topbar .menu');
  const dropBtn = document.querySelector('.dropbtn');
  const dropParent = document.querySelector('.has-dropdown');

  if(hamburger && menu){
    hamburger.addEventListener('click', ()=>{
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('show');
    });
  }

  if(dropBtn && dropParent){
    dropBtn.addEventListener('click', (e)=>{
      const expanded = dropBtn.getAttribute('aria-expanded') === 'true';
      dropBtn.setAttribute('aria-expanded', String(!expanded));
      dropParent.classList.toggle('open');
    });

    // Cerrar dropdown si se hace click fuera
    document.addEventListener('click', (e)=>{
      if(!dropParent.contains(e.target)){
        dropParent.classList.remove('open');
        dropBtn.setAttribute('aria-expanded','false');
      }
    });
  }
})();

// Contact bar behavior
(function(){
  const form = document.getElementById('contact-form');
  const input = document.getElementById('contact-email');
  const msg = document.getElementById('contact-msg');
  const bar = document.getElementById('contact-bar');
  const closeBtn = document.getElementById('contact-close');

  if(!form || !input || !bar) return;

  // Cargar estado si ya fue cerrado
  const closed = localStorage.getItem('contact_closed');
  if(closed === '1'){
    bar.style.display = 'none';
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const value = input.value.trim();
    // Validación simple: correo gmail
    const gmailRe = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if(!gmailRe.test(value)){
      msg.textContent = 'Por favor ingresa un correo Gmail válido (ej: usuario@gmail.com)';
      msg.style.color = '#f99';
      return;
    }

    // Guardar (simulación) y mostrar mensaje
    let list = JSON.parse(localStorage.getItem('contact_list')||'[]');
    if(!list.includes(value)) list.push(value);
    localStorage.setItem('contact_list', JSON.stringify(list));

    msg.textContent = '¡Gracias! Te inscribimos para recibir actualizaciones.';
    msg.style.color = '#9fe';
    input.value = '';
  });

  if(closeBtn){
    closeBtn.addEventListener('click', ()=>{
      bar.style.display = 'none';
      localStorage.setItem('contact_closed','1');
    });
  }
})();

// --- Dynamic 3D model loader (integrated helper) ---
(function(){
  async function loadModelViewerScript(){
    if(window.customElements && customElements.get('model-viewer')) return;
    return new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.type = 'module';
      const url = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      s.src = url;
      s.onload = ()=> resolve();
      s.onerror = (e)=> reject(e);
      document.head.appendChild(s);
    });
  }

  function attachLoader(container, btnLoad, btnHide){
    if(!container || !btnLoad || !btnHide) return;
    const modelPath = container.dataset.model || '';
    const imagePath = container.dataset.image || '';
    const placeholder = container.querySelector('.model-placeholder');
    let loadedViewer = null;

    btnLoad.addEventListener('click', async ()=>{
      if(loadedViewer) return;
      btnLoad.disabled = true;
      try{
        if(modelPath){
          await loadModelViewerScript();
          const mv = document.createElement('model-viewer');
          mv.setAttribute('src', modelPath);
          mv.setAttribute('camera-controls','');
          mv.setAttribute('auto-rotate','');
          mv.setAttribute('exposure','1');
          mv.setAttribute('shadow-intensity','0.8');
          if(container.dataset.alt) mv.setAttribute('alt', container.dataset.alt);
          mv.style.width = '100%'; mv.style.height = '100%';
          try{ mv.classList.add('loaded'); }catch(e){}
          container.appendChild(mv);
          loadedViewer = mv;
          if(placeholder) placeholder.style.display = 'none';
        } else if(imagePath){
          const img = document.createElement('img');
          img.src = imagePath;
          img.alt = container.dataset.alt || '';
          img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain';
          container.appendChild(img);
          loadedViewer = img;
          if(placeholder) placeholder.style.display = 'none';
        } else {
          alert('No hay modelo 3D ni imagen configurada para este elemento.');
        }
        btnLoad.style.display = 'none';
        btnHide.style.display = 'inline-block';
      }catch(err){
        console.error('Error cargando model-viewer:', err);
        alert('Error al cargar el visor 3D. Revisa la consola.');
        btnLoad.disabled = false;
      }
    });

    btnHide.addEventListener('click', ()=>{
      if(loadedViewer){
        if(loadedViewer.tagName && loadedViewer.tagName.toLowerCase() === 'model-viewer'){
          try{ loadedViewer.removeAttribute('src'); }catch(e){}
        }
        loadedViewer.remove();
        loadedViewer = null;
      }
      if(placeholder) placeholder.style.display = 'block';
      btnHide.style.display = 'none';
      btnLoad.style.display = 'inline-block';
      btnLoad.disabled = false;
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const wrappers = Array.from(document.querySelectorAll('.model-wrapper'));
    wrappers.forEach(wrapper=>{
      const container = wrapper.querySelector('.model-container');
      const btnLoad = wrapper.querySelector('.btn-load');
      const btnHide = wrapper.querySelector('.btn-hide');
      // if buttons exist but are not visible, ensure initial state
      if(btnHide) btnHide.style.display = btnHide.style.display || 'none';
      if(btnLoad) btnLoad.style.display = btnLoad.style.display || 'inline-block';
      attachLoader(container, btnLoad, btnHide);
    });
  });

  window.loadModelViewerHelper = { attach: attachLoader, loadScript: loadModelViewerScript };
})();
