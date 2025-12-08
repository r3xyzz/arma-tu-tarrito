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
