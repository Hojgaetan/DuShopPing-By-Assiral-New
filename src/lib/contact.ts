export const customerServiceNumber = (import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '').replace(/\D/g, '');
export const customerServiceUrl = customerServiceNumber ? 'https://wa.me/' + customerServiceNumber : null;
