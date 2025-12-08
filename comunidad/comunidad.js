// javascript.js
// Script para interacciones de la página

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
