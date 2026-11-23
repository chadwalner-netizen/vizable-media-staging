/* The How It Works callback uses the same form-delivery setting as Contact. */
(() => {
  const dialog = document.getElementById('callback-dialog');
  const open = document.getElementById('open-callback');
  const close = document.getElementById('close-callback');
  const form = document.getElementById('callback-request');
  const status = document.getElementById('callback-status');
  if (!dialog || !open || !close || !form || !status) return;
  open.addEventListener('click',() => { status.textContent=''; dialog.showModal(); form.querySelector('input')?.focus(); });
  close.addEventListener('click',() => dialog.close());
  dialog.addEventListener('click',event => { if(event.target === dialog) dialog.close(); });
  form.addEventListener('submit',async event => {
    event.preventDefault();
    if(!form.reportValidity()) return;
    const phone = String(new FormData(form).get('phone') || '');
    if(phone.replace(/\D/g,'').length < 7) { status.textContent='Please enter a complete phone number.'; return; }
    const endpoint = window.VIZABLE_CONFIG?.formEndpoint?.trim() || '';
    if(!endpoint) { status.textContent='Preview mode: no request has been sent. Contact delivery will be connected before launch.'; return; }
    if(!/^https:\/\//i.test(endpoint)) { status.textContent='Contact delivery is not configured correctly. No request was sent.'; return; }
    const data = new FormData(form);
    data.set('requestType','Free callback request from How It Works');
    data.set('_subject','Vizable Media — Free Callback Request');
    status.textContent='Sending your request…';
    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;
    try {
      const response = await fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'}});
      if(!response.ok) throw new Error('delivery failed');
      status.textContent="Thanks! Your request has been sent. I'll be in touch to confirm a call.";
      form.reset();
    } catch (_) { status.textContent='Your request could not be sent. Please try again later.'; }
    finally { submit.disabled=false; }
  });
})();
