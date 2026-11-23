(() => {
  'use strict';
  const config = window.VIZABLE_CONFIG || { formEndpoint: '', checkoutLinks: {} };
  const byId = id => document.getElementById(id);
  const priceData = {
    'starter-monthly': {name:'Starter',mode:'Monthly Subscription',price:'$59/month',setup:'$184',due:'$184'},
    'business-monthly': {name:'Business',mode:'Monthly Subscription',price:'$79/month',setup:'$254',due:'$254'},
    'premium-monthly': {name:'Premium',mode:'Monthly Subscription',price:'$99/month',setup:'$396',due:'$396'},
    'starter-onetime': {name:'Starter',mode:'One-Time Purchase',price:'$499',setup:'None',due:'$499'},
    'business-onetime': {name:'Business',mode:'One-Time Purchase',price:'$749',setup:'None',due:'$749'},
    'premium-onetime': {name:'Premium',mode:'One-Time Purchase',price:'$999',setup:'None',due:'$999'}
  };

  // Combined Stripe links: one-time website purchase + $39/month hosting.
  const hostingCheckoutLinks = {
    'starter-onetime': 'https://buy.stripe.com/fZubJ12gIapW4D77RYcMM07',
    'business-onetime': 'https://buy.stripe.com/aFaaEX7B20PmedH4FMcMM08',
    'premium-onetime': 'https://buy.stripe.com/6oU28r6wY1Tq0mR0pwcMM09'
  };
  const hostingDue = {
    'starter-onetime': '$538',
    'business-onetime': '$788',
    'premium-onetime': '$1,038'
  };

  // Pricing selection, with one price per card and only the relevant terms visible.
  const monthlyButton = byId('monthly-tab');
  const onceButton = byId('onetime-tab');
  if (monthlyButton && onceButton) {
    const panels = {monthly:byId('monthly-panel'),onetime:byId('onetime-panel')};
    const promo = byId('monthly-promo');
    const setMode = mode => {
      const monthly = mode === 'monthly';
      panels.monthly.hidden = !monthly;
      panels.onetime.hidden = monthly;
      monthlyButton.classList.toggle('selected',monthly);
      onceButton.classList.toggle('selected',!monthly);
      monthlyButton.setAttribute('aria-pressed',String(monthly));
      onceButton.setAttribute('aria-pressed',String(!monthly));
      if (promo) promo.hidden = !monthly;
    };
    monthlyButton.addEventListener('click',() => setMode('monthly'));
    onceButton.addEventListener('click',() => setMode('onetime'));
    setMode(new URLSearchParams(window.location.search).get('view') === 'one-time' ? 'onetime' : 'monthly');
  }

  // Pay-first checkout flow: disclose scope and subscription terms before redirect.
  const checkoutDialog = byId('checkout-dialog');
  const checkoutMessage = byId('checkout-message');
  const checkoutAcknowledge = byId('checkout-acknowledge');
  const checkoutContinue = byId('checkout-continue');
  const hostingCheckbox = byId('checkout-add-hosting');
  const hostingOption = byId('checkout-hosting-option');
  const hostingBilling = byId('checkout-hosting-billing');
  let selectedPackage = '';
  if (checkoutDialog && checkoutMessage && checkoutAcknowledge && checkoutContinue) {
    document.querySelectorAll('[data-checkout]').forEach(button => {
      button.addEventListener('click',() => {
        selectedPackage = button.dataset.checkout;
        const choice = priceData[selectedPackage];
        if (!choice) return;
        byId('checkout-choice').textContent = choice.name+' — '+choice.mode;
        byId('checkout-price').textContent = choice.price;
        byId('checkout-due').textContent = choice.due;
        byId('checkout-setup').textContent = choice.setup;
        const isMonthly = selectedPackage.endsWith('-monthly');
        const setupRow = byId('checkout-setup').parentElement;
        setupRow.hidden = !isMonthly;
        setupRow.querySelector('dt').textContent = 'Initial 90-day package';
        byId('checkout-price').parentElement.querySelector('dt').textContent = isMonthly ? 'Ongoing plan price' : 'Website purchase';
        byId('checkout-subscription-note').hidden = !isMonthly;
        const ownershipNote = byId('checkout-ownership-note');
        if (ownershipNote) ownershipNote.hidden = !isMonthly;
        if (hostingOption && hostingCheckbox) {
          hostingOption.hidden = isMonthly;
          hostingCheckbox.checked = false; // Never preselect a recurring subscription.
        }
        checkoutAcknowledge.checked = false;
        checkoutContinue.disabled = true;
        checkoutMessage.textContent = '';
        checkoutDialog.showModal();
      });
    });
    if (hostingCheckbox) hostingCheckbox.addEventListener('change', () => {
      if (!priceData[selectedPackage] || selectedPackage.endsWith('-monthly')) return;
      const added = hostingCheckbox.checked;
      byId('checkout-due').textContent = added ? hostingDue[selectedPackage] : priceData[selectedPackage].due;
      if (hostingBilling) hostingBilling.textContent = added
        ? 'Due today includes the website price plus $39 for your first month of hosting. Hosting then renews at $39/month until canceled.'
        : 'Hosting is optional. Leave this unchecked to purchase the website only.';
    });
    checkoutAcknowledge.addEventListener('change',() => { checkoutContinue.disabled = !checkoutAcknowledge.checked; });
    byId('checkout-close').addEventListener('click',() => checkoutDialog.close());
    checkoutDialog.addEventListener('click',event => { if(event.target === checkoutDialog) checkoutDialog.close(); });
    checkoutContinue.addEventListener('click',() => {
      if (!checkoutAcknowledge.checked || !priceData[selectedPackage]) return;
      const withHosting = hostingCheckbox && hostingCheckbox.checked && selectedPackage.endsWith('-onetime');
      const address = (withHosting ? hostingCheckoutLinks[selectedPackage] : config.checkoutLinks?.[selectedPackage]) || '';
      try {
        const url = new URL(address);
        if(url.protocol === 'https:' && (url.hostname === 'buy.stripe.com' || url.hostname === 'checkout.stripe.com' || url.hostname.endsWith('.stripe.com'))) {
          window.location.assign(url.toString());
          return;
        }
      } catch (_) {}
      checkoutMessage.textContent = 'Secure checkout is not connected yet. No payment has been taken.';
    });
  }

  // One shared Contact form with two visitor-selected modes.
  const contactForm = byId('unified-contact-form');
  if (contactForm) {
    const buttons = [...document.querySelectorAll('[data-contact-mode]')];
    const phoneRow = byId('contact-phone-row');
    const timeRow = byId('contact-time-row');
    const schedulingRow = byId('contact-scheduling-row');
    const schedulingNote = byId('contact-scheduling-note');
    const timeZone = byId('contact-timezone');
    const smsConsentRow = byId('contact-sms-consent');
    const smsAgree = byId('contact-sms-agree');
    const confirmationRadios = [...contactForm.querySelectorAll('input[name="confirmationMethod"]')];
    const updateConfirmation = () => {
      const sms = confirmationRadios.some(r => r.checked && r.value.startsWith('Text'));
      smsConsentRow.hidden = mode !== 'call' || !sms;
      smsAgree.required = mode === 'call' && sms;
      if (!sms) smsAgree.checked = false;
    };
    confirmationRadios.forEach(r => r.addEventListener('change', updateConfirmation));
    const emailRow = byId('contact-email-row');
    const messageRow = byId('contact-message-row');
    const title = byId('form-title');
    const intro = byId('form-intro');
    const submit = byId('contact-submit');
    const status = byId('contact-form-status');
    const phone = byId('contact-phone');
    const time = byId('contact-time');
    const message = byId('contact-message');
    const messageLabel = byId('contact-message-label');
    let mode = 'call';
    const setMode = next => {
      mode = next === 'message' ? 'message' : 'call';
      buttons.forEach(b => {
        const chosen = b.dataset.contactMode === mode;
        b.classList.toggle('selected',chosen);
        b.setAttribute('aria-pressed',String(chosen));
      });
      phoneRow.hidden = timeRow.hidden = mode === 'message';
      schedulingRow.hidden = schedulingNote.hidden = mode === 'message';
      timeZone.required = mode === 'call';
      updateConfirmation();
      messageRow.hidden = false;
      message.required = mode === 'message';
      messageLabel.innerHTML = mode === 'message' ? 'Your Message <span>*</span>' : 'Tell Me About Your Business <small>(Optional for calls)</small>';
      message.placeholder = mode === 'message' ? 'Tell me a little about your business and what you have in mind…' : "A few words about what you do, and what you're looking for…";
      phone.required = time.required = mode === 'call';
      title.textContent = mode === 'call' ? 'Schedule a Free Call Today' : 'Send Chad a Message';
      intro.textContent = mode === 'call' ? "Leave your details below and I'll personally get back to you." : "Tell me what’s on your mind and I’ll reply by email.";
      submit.textContent = mode === 'call' ? 'Request My Free Call →' : 'Send My Message →';
      status.textContent = '';
    };
    buttons.forEach(b => b.addEventListener('click',() => setMode(b.dataset.contactMode)));
    const contactParams = new URLSearchParams(window.location.search);
    if (contactParams.get('interest') === 'homepage-concept') {
      setMode('message');
      message.value = "I'd like a free homepage concept for my business.";
    } else {
      setMode(contactParams.get('mode'));
    }
    contactForm.addEventListener('submit',async event => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const endpoint = (config.formEndpoint || '').trim();
      if (!endpoint) {
        status.textContent = 'Preview mode: your request has not been sent. Contact delivery will be enabled before launch.';
        status.dataset.state = 'preview';
        return;
      }
      if(!/^https:\/\//i.test(endpoint)) {
        status.textContent = 'The contact form is not configured correctly. No details were sent.';
        status.dataset.state = 'error';
        return;
      }
      const formData = new FormData(contactForm);
      formData.set('requestType',mode === 'call' ? 'Free callback request' : 'Website message');
      formData.set('_subject',mode === 'call' ? 'Vizable Media — Callback Request' : 'Vizable Media — New Message');
      submit.disabled = true;
      submit.classList.add('vm-is-sending');
      submit.setAttribute('aria-busy', 'true');
      submit.textContent = 'Sending Your Request... Please Wait';
      buttons.forEach(button => button.disabled = true);
      status.textContent = 'Please wait while your request is sent.';
      status.dataset.state = 'pending';
      try {
        const response = await fetch(endpoint,{method:'POST',body:formData,headers:{Accept:'application/json'}});
        if (!response.ok) throw new Error('delivery failed');
        contactForm.reset();
        status.textContent = mode === 'call' ? "Thanks! Your callback request was sent. I'll reach out to confirm a time." : "Thanks! Your message was sent. I'll be in touch.";
        status.dataset.state = 'success';
      } catch (_) {
        status.textContent = 'The message could not be sent. Please try again later.';
        status.dataset.state = 'error';
      } finally {
        submit.disabled = false;
        submit.classList.remove('vm-is-sending');
        submit.removeAttribute('aria-busy');
        submit.textContent = mode === 'call' ? 'Request My Free Call →' : 'Send My Message →';
        buttons.forEach(button => button.disabled = false);
      }
    });
  }

  // Post-payment project intake. Stripe can redirect to this URL after checkout.
  // The form itself does not verify payment; Chad confirms it against Stripe.
  const intakeForm = byId('project-intake-form');
  if (intakeForm) {
    const status = byId('intake-status');
    const selection = byId('intake-plan');
    const queryPlan = new URLSearchParams(window.location.search).get('plan');
    if (queryPlan && priceData[queryPlan]) {
      const data = priceData[queryPlan];
      const mode = queryPlan.endsWith('monthly') ? 'Monthly' : 'One-Time';
      const option = [...selection.options].find(o => o.text === data.name+' — '+mode);
      if (option) selection.value = option.value;
    }
    intakeForm.addEventListener('submit',async event => {
      event.preventDefault();
      if(!intakeForm.reportValidity()) return;
      const endpoint = String(config.formEndpoint || '').trim();
      if(!/^https:\/\//i.test(endpoint)) {
        status.textContent = 'Preview mode: project details have not been sent. Form delivery will be connected before launch.';
        return;
      }
      const submit = intakeForm.querySelector('[type=submit]');
      const data = new FormData(intakeForm);
      data.set('requestType','Post-purchase project intake (payment not verified)');
      data.set('_subject','Vizable Media — New Website Project Details');
      submit.disabled = true;
      status.textContent = 'Sending your details…';
      try {
        const response = await fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'}});
        if(!response.ok) throw new Error('delivery failed');
        intakeForm.reset();
        status.textContent = 'Thanks! Your project details have been sent. I’ll review them and confirm the next steps.';
      } catch (_) { status.textContent = 'Your details could not be sent. Please try again later.'; }
      finally { submit.disabled = false; }
    });
  }
})();
