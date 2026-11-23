/* Launch connections — fill these in after business email and Stripe are ready.
   Public checkout URLs and a form endpoint are safe to configure here.
   Never put Stripe secret keys or email passwords in this file. */
window.VIZABLE_CONFIG = {
  formEndpoint: 'https://formspree.io/f/moedwbrk',
  checkoutLinks: {
    'starter-monthly': 'https://buy.stripe.com/8x2dR99JagOk1qV0pwcMM04',
    'business-monthly': 'https://buy.stripe.com/00waEX2gIfKg9XrfkqcMM05',
    'premium-monthly': 'https://buy.stripe.com/bJe8wPdZq1Tqc5z8W2cMM06',
    'starter-onetime': 'https://buy.stripe.com/28EfZh1cE69G1qVdcicMM00',
    'business-onetime': 'https://buy.stripe.com/9B6aEX6wYeGc1qV0pwcMM01',
    'premium-onetime': 'https://buy.stripe.com/eVqeVd3kMdC89XrdcicMM02',
    'hosting-maintenance': 'https://buy.stripe.com/aFa8wP6wY55C9XregmcMM03'
  }
};
