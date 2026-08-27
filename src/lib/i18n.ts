// Sistema básico de internacionalização para o checkout
export type Language = 'pt' | 'en' | 'es';

export const translations = {
  pt: {
    // Modal e mensagens de sucesso
    paymentConfirmed: 'Pagamento Confirmado!',
    coursePaymentConfirmed: 'Pagamento do Curso Confirmado!',
    verificationConfirmed: 'Verificação Confirmada!',
    paymentSuccess: 'O pagamento foi confirmado com sucesso.',
    coursePaymentSuccess: 'O pagamento do seu curso foi confirmado com sucesso. Você será redirecionado para a academia.',
    verificationSuccess: 'A sua verificação de afiliado foi realizada com sucesso. Você será redirecionado para o Painel de Afiliados.',
    redirectMessage: 'Redirecionando...',
    
    // Modal PUSH
    authorizeOnPhone: 'Autorize no seu Telemóvel',
    pushSent: 'Enviamos um pedido PUSH para o número',
    instructions: 'Instruções:',
    instruction1: '1. Verifique a tela do seu celular.',
    instruction2: '2. Digite seu',
    instruction3: 'para autorizar',
    waitingConfirmation: 'Aguardando confirmação',
    alreadyTypedPin: 'Já digitei meu PIN (Verificar)',
    verifyingPayment: 'Verificando pagamento...',
    cancelOrChange: 'Cancelar ou Alterar número',
    
    // Modal expirado
    pinNotEntered: 'PIN Não Introduzido / Tempo Expirado',
    noConfirmationReceived: 'Não recebemos a confirmação do PIN no número',
    whatHappened: 'O que pode ter acontecido?',
    reason1: '• O ecrã do seu telemóvel estava bloqueado ao receber o PUSH.',
    reason2: '• A notificação expirou (60s) ou foi cancelada no telemóvel.',
    reason3: '• O número de telemóvel não tem saldo M-Pesa suficiente.',
    reason4: '• Conexão instável com a rede M-Pesa.',
    resendPush: 'Reenviar Notificação PUSH Agora',
    changeNumberOrMethod: 'Alterar Número ou Método de Pagamento',
    
    // Erros
    nameRequired: 'Por favor, informe seu nome completo.',
    emailRequired: 'Por favor, informe um e-mail válido.',
    whatsappRequired: 'Por favor, informe seu número do WhatsApp.',
    affiliatePhoneRequired: 'Por favor, informe o número para receber comissões.',
    phoneRequired: 'Número de telefone obrigatório para pagamento.',
    insufficientBalance: 'Saldo insuficiente no M-Pesa. Por favor, recarregue e tente novamente.',
    connectionError: 'Erro de conexão. Verifique sua internet e tente novamente.',
    invalidPhone: 'Número de telefone inválido. Verifique e tente novamente.',
    serverError: 'Erro no servidor. Tente novamente em alguns instantes.',
    minAmount: 'Valor mínimo de pagamento é 1 MT.',
    maxAmount: 'Valor máximo de pagamento é 1.000.000 MT. Para valores maiores, contacte o suporte.',
    paymentError: 'Erro ao processar pagamento',
    tryAgain: 'Tente novamente.',
    
    // Botões
    buyNow: 'Comprar Agora',
    selectPlan: 'Selecionar Plano',
    addHosting: 'Adicionar Plano Pro (2.500 MT/mês)',
    removeHosting: 'Remover Hospedagem (Comprar apenas domínio)',
    retry: 'Tentar Novamente',
    
    // Labels
    nameLabel: 'Nome Completo',
    emailLabel: 'E-mail',
    whatsappLabel: 'Número do WhatsApp',
    phoneLabel: 'Número para Pagamento',
    paymentMethod: 'Método de Pagamento',
    mpesa: 'M-Pesa',
    emola: 'eMola',
    card: 'Cartão de Crédito',
    bankTransfer: 'Transferência Bancária',
  },
  
  en: {
    // Modal e mensagens de sucesso
    paymentConfirmed: 'Payment Confirmed!',
    coursePaymentConfirmed: 'Course Payment Confirmed!',
    verificationConfirmed: 'Verification Confirmed!',
    paymentSuccess: 'The payment was confirmed successfully.',
    coursePaymentSuccess: 'Your course payment was confirmed successfully. You will be redirected to the academy.',
    verificationSuccess: 'Your affiliate verification was completed successfully. You will be redirected to the Affiliate Panel.',
    redirectMessage: 'Redirecting...',
    
    // Modal PUSH
    authorizeOnPhone: 'Authorize on your Phone',
    pushSent: 'We sent a PUSH request to the number',
    instructions: 'Instructions:',
    instruction1: '1. Check your phone screen.',
    instruction2: '2. Enter your',
    instruction3: 'to authorize',
    waitingConfirmation: 'Waiting for confirmation',
    alreadyTypedPin: 'I already entered my PIN (Verify)',
    verifyingPayment: 'Verifying payment...',
    cancelOrChange: 'Cancel or Change number',
    
    // Modal expirado
    pinNotEntered: 'PIN Not Entered / Time Expired',
    noConfirmationReceived: 'We did not receive PIN confirmation on the number',
    whatHappened: 'What may have happened?',
    reason1: '• Your phone screen was locked when receiving the PUSH.',
    reason2: '• The notification expired (60s) or was cancelled on the phone.',
    reason3: '• The phone number does not have sufficient M-Pesa balance.',
    reason4: '• Unstable connection with the M-Pesa network.',
    resendPush: 'Resend PUSH Notification Now',
    changeNumberOrMethod: 'Change Number or Payment Method',
    
    // Erros
    nameRequired: 'Please enter your full name.',
    emailRequired: 'Please enter a valid email.',
    whatsappRequired: 'Please enter your WhatsApp number.',
    affiliatePhoneRequired: 'Please enter the number to receive commissions.',
    phoneRequired: 'Phone number required for payment.',
    insufficientBalance: 'Insufficient M-Pesa balance. Please top up and try again.',
    connectionError: 'Connection error. Check your internet and try again.',
    invalidPhone: 'Invalid phone number. Check and try again.',
    serverError: 'Server error. Try again in a few moments.',
    minAmount: 'Minimum payment amount is 1 MT.',
    maxAmount: 'Maximum payment amount is 1,000,000 MT. For higher amounts, contact support.',
    paymentError: 'Error processing payment',
    tryAgain: 'Try again.',
    
    // Botões
    buyNow: 'Buy Now',
    selectPlan: 'Select Plan',
    addHosting: 'Add Pro Plan (2,500 MT/month)',
    removeHosting: 'Remove Hosting (Buy domain only)',
    retry: 'Try Again',
    
    // Labels
    nameLabel: 'Full Name',
    emailLabel: 'Email',
    whatsappLabel: 'WhatsApp Number',
    phoneLabel: 'Payment Number',
    paymentMethod: 'Payment Method',
    mpesa: 'M-Pesa',
    emola: 'eMola',
    card: 'Credit Card',
    bankTransfer: 'Bank Transfer',
  },
  
  es: {
    // Modal e mensagens de sucesso
    paymentConfirmed: '¡Pago Confirmado!',
    coursePaymentConfirmed: '¡Pago del Curso Confirmado!',
    verificationConfirmed: '¡Verificación Confirmada!',
    paymentSuccess: 'El pago fue confirmado exitosamente.',
    coursePaymentSuccess: 'El pago de su curso fue confirmado exitosamente. Será redirigido a la academia.',
    verificationSuccess: 'Su verificación de afiliado fue completada exitosamente. Será redirigido al Panel de Afiliados.',
    redirectMessage: 'Redirigiendo...',
    
    // Modal PUSH
    authorizeOnPhone: 'Autorice en su Teléfono',
    pushSent: 'Enviamos una solicitud PUSH al número',
    instructions: 'Instrucciones:',
    instruction1: '1. Verifique la pantalla de su teléfono.',
    instruction2: '2. Ingrese su',
    instruction3: 'para autorizar',
    waitingConfirmation: 'Esperando confirmación',
    alreadyTypedPin: 'Ya ingresé mi PIN (Verificar)',
    verifyingPayment: 'Verificando pago...',
    cancelOrChange: 'Cancelar o Cambiar número',
    
    // Modal expirado
    pinNotEntered: 'PIN No Ingresado / Tiempo Expirado',
    noConfirmationReceived: 'No recibimos la confirmación del PIN en el número',
    whatHappened: '¿Qué pudo haber pasado?',
    reason1: '• La pantalla de su teléfono estaba bloqueada al recibir el PUSH.',
    reason2: '• La notificación expiró (60s) o fue cancelada en el teléfono.',
    reason3: '• El número de teléfono no tiene saldo M-Pesa suficiente.',
    reason4: '• Conexión inestable con la red M-Pesa.',
    resendPush: 'Reenviar Notificación PUSH Ahora',
    changeNumberOrMethod: 'Cambiar Número o Método de Pago',
    
    // Erros
    nameRequired: 'Por favor ingrese su nombre completo.',
    emailRequired: 'Por favor ingrese un email válido.',
    whatsappRequired: 'Por favor ingrese su número de WhatsApp.',
    affiliatePhoneRequired: 'Por favor ingrese el número para recibir comisiones.',
    phoneRequired: 'Número de teléfono requerido para el pago.',
    insufficientBalance: 'Saldo M-Pesa insuficiente. Por favor recargue e intente nuevamente.',
    connectionError: 'Error de conexión. Verifique su internet e intente nuevamente.',
    invalidPhone: 'Número de teléfono inválido. Verifique e intente nuevamente.',
    serverError: 'Error del servidor. Intente nuevamente en unos momentos.',
    minAmount: 'El monto mínimo de pago es 1 MT.',
    maxAmount: 'El monto máximo de pago es 1,000,000 MT. Para montos mayores, contacte soporte.',
    paymentError: 'Error al procesar el pago',
    tryAgain: 'Intente nuevamente.',
    
    // Botões
    buyNow: 'Comprar Ahora',
    selectPlan: 'Seleccionar Plan',
    addHosting: 'Agregar Plan Pro (2,500 MT/mes)',
    removeHosting: 'Eliminar Hospedaje (Comprar solo dominio)',
    retry: 'Intentar Nuevamente',
    
    // Labels
    nameLabel: 'Nombre Completo',
    emailLabel: 'Email',
    whatsappLabel: 'Número de WhatsApp',
    phoneLabel: 'Número de Pago',
    paymentMethod: 'Método de Pago',
    mpesa: 'M-Pesa',
    emola: 'eMola',
    card: 'Tarjeta de Crédito',
    bankTransfer: 'Transferencia Bancaria',
  }
};

export const useTranslation = (language: Language = 'pt') => {
  return translations[language];
};

export const getLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && translations[savedLang]) {
      return savedLang;
    }
    
    // Detectar idioma do navegador
    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) {
      return browserLang;
    }
  }
  return 'pt'; // Padrão: português
};

export const setLanguage = (language: Language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
};