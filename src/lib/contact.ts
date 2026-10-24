export const customerServiceNumber = (import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '237650283247').replace(/\D/g, '');
export const customerServiceUrl = customerServiceNumber ? 'https://wa.me/' + customerServiceNumber : null;

// Format camerounais : +237 6XX XX XX XX
const formatPhone = (digits: string) => {
  const m = digits.match(/^237(\d{3})(\d{2})(\d{2})(\d{2})$/);
  return m ? `+237 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : '+' + digits;
};
export const customerServiceDisplay = formatPhone(customerServiceNumber);

export const customerCallNumber = '237688824975';
export const customerCallDisplay = '+237 688 82 49 75';
export const customerCallUrl = 'tel:+' + customerCallNumber;

export const orangeMerchantCode = '1044288';
export const momoMerchantCode = '859493';

export const companyName = 'ORACLE SARL';
export const companyAddress = 'BP : 2440 DOUALA-BONAPRISO';
