'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Server, ShieldCheck, Lock, Check, CreditCard, 
  Smartphone, Bitcoin, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw,
  Landmark, Paperclip, FileText, Image as ImageIcon, Upload, Loader2, Lock as LockIcon
} from 'lucide-react';
import { hostingPlans, HostingPlan, dataManager } from '@/lib/data';
import { auth } from '@/lib/auth';
import { getDomainPrice, sanitizeDomainName } from '@/lib/domains';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal';
import { apiEndpoint } from '@/lib/siteConfig';
import { soundEffects } from '@/lib/soundEffects';
import FacebookPixel from '@/lib/facebookPixel';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlanId = searchParams.get('plan');
  const planIdParam = rawPlanId === 'none' ? 'none' : (rawPlanId || 'pro');
  const domainParam = searchParams.get('domain');
  const domainPriceParam = searchParams.get('domainPrice');
  const siteTypeParam = searchParams.get('siteType');
  const siteTypeName = searchParams.get('siteTypeName');
  const siteTypePrice = searchParams.get('siteTypePrice');
  
  // Parâmetros para verificação de afiliado
  const serviceParam = searchParams.get('service');
  const isAffiliateVerification = serviceParam === 'affiliate_verification';
  const verificationAmount = Number(searchParams.get('amount')) || 2;
  const affiliateUserIdParam = searchParams.get('userId');

  const domainCost = domainParam 
    ? (domainPriceParam ? Number(domainPriceParam) : getDomainPrice(sanitizeDomainName(domainParam).extension))
    : 0;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(planIdParam);

  const selectedPlan = hostingPlans.find(p => p.id === selectedPlanId) || null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ddi, setDdi] = useState('+258');
  const [whatsapp, setWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card' | 'bank_transfer'>('mpesa');
  
  // Phone for M-Pesa / eMola push payment
  const [phonePayment, setPhonePayment] = useState('');
  // Phone for affiliate commission payments
  const [affiliatePhone, setAffiliatePhone] = useState('');
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Comprovativo de Pagamento Bancário
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingProof(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiEndpoint('/api/upload'), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setProofUrl(data.url);
          setProofName(data.name || file.name);
        }
      }
    } catch (err) {
      console.error('Erro no upload do comprovativo:', err);
    } finally {
      setUploadingProof(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    
    // Rastrear InitiateCheckout quando o usuário entra na página de checkout
    if (selectedPlan) {
      const isWebsite = selectedPlan.id === 'website_creation';
      const siteLabel = isWebsite && siteTypeName ? ` — ${siteTypeName}` : '';
      const cycleLabel = isWebsite ? '' : ` (${durationMonths} ${durationMonths === 1 ? 'Mês' : 'Meses'})`;
      const serviceName = selectedPlan
        ? (domainParam 
            ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
            : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
        : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`;
      
      FacebookPixel.trackInitiateCheckout({
        content_ids: [selectedPlan.id],
        content_name: serviceName,
        content_category: 'Hospedagem e Serviços Web',
        value: grandTotal,
        currency: 'MZN'
      });
    }
  }, []);

  const cycleParam = searchParams.get('billingCycle');
  const [durationMonths, setDurationMonths] = useState<number>(cycleParam === 'annual' ? 12 : 1);

  useEffect(() => {
    if (planIdParam) {
      setSelectedPlanId(planIdParam);
    }
  }, [planIdParam]);

  const calculatePlanCost = () => {
    if (isAffiliateVerification) {
      return verificationAmount;
    }
    if (!selectedPlan) return 0;
    if (selectedPlan.id === 'website_creation') {
      return siteTypePrice ? Number(siteTypePrice) : selectedPlan.price;
    }
    if (durationMonths === 12) {
      return selectedPlan.priceAnnual;
    } else if (durationMonths === 6) {
      return Math.round(selectedPlan.price * 6 * 0.90);
    } else if (durationMonths === 3) {
      return Math.round(selectedPlan.price * 3 * 0.95);
    }
    return selectedPlan.price * durationMonths;
  };

  const basePrice = calculatePlanCost();
  const grandTotal = isAffiliateVerification ? verificationAmount : (basePrice + domainCost);

  const [pushModal, setPushModal] = useState(false);
  const [pushStatus, setPushStatus] = useState<'waiting' | 'expired'>('waiting');
  const [countdown, setCountdown] = useState(45);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentReference, setCurrentReference] = useState<string | null>(null);
  const [isPollingPayment, setIsPollingPayment] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pushModal && pushStatus === 'waiting' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (pushModal && pushStatus === 'waiting' && countdown === 0) {
      setPushStatus('expired');
      
      // Disparar e-mail automático de notificação de tempo expirado ao cliente
      if (email) {
        fetch(apiEndpoint('/api/payments/mpesa/timeout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: email,
            clientName: name,
            amount: grandTotal,
            orderRef: `ORD-${Date.now().toString().slice(-5)}`
          })
        }).catch(err => console.warn('Erro ao notificar timeout M-Pesa por e-mail:', err));
      }
    }
    return () => clearInterval(timer);
  }, [pushModal, pushStatus, countdown, email, name, grandTotal]);

  // 🔒 SEGURANÇA: Polling de status de pagamento - verificar confirmação do webhook
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    if (isPollingPayment && currentReference) {
      console.log('[PAYMENT POLLING] Iniciando verificação de status para reference:', currentReference);
      
      // Verificar a cada 3 segundos
      pollingInterval = setInterval(async () => {
        try {
          const response = await fetch(apiEndpoint(`/api/payments/status?reference=${encodeURIComponent(currentReference)}`));
          const data = await response.json();
          
          console.log('[PAYMENT POLLING] Status:', data.status);
          
          if (data.status === 'completed') {
            console.log('[PAYMENT POLLING] Pagamento confirmado pelo webhook!');
            clearInterval(pollingInterval);
            setIsPollingPayment(false);
            setPushModal(false);
            
            // Criar pedido com status completed e finalizar
            await finalizeOrder();
          } else if (data.status === 'cancelled' || data.status === 'failed') {
            console.log('[PAYMENT POLLING] Pagamento falhou/cancelado');
            clearInterval(pollingInterval);
            setIsPollingPayment(false);
            setPushStatus('expired');
            setError('Pagamento não foi confirmado. Por favor, tente novamente.');
          }
        } catch (err) {
          console.error('[PAYMENT POLLING] Erro ao verificar status:', err);
        }
      }, 3000); // Verificar a cada 3 segundos
      
      // Parar polling após 2 minutos (timeout)
      const timeout = setTimeout(() => {
        clearInterval(pollingInterval);
        setIsPollingPayment(false);
        setPushStatus('expired');
        setError('Tempo de verificação expirado. Se você pagou, aguarde o e-mail de confirmação.');
      }, 120000); // 2 minutos
      
      return () => {
        clearInterval(pollingInterval);
        clearTimeout(timeout);
      };
    }
  }, [isPollingPayment, currentReference]);

  const handleRetryPush = () => {
    setPushStatus('waiting');
    setCountdown(45);
    const phone = phonePayment || whatsapp;
    fetch(apiEndpoint('/api/payments/mpesa/c2b'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msisdn: phone,
        amount: grandTotal,
        reference: `REF_${Date.now().toString().slice(-6)}`,
        thirdPartyReference: `ORDER_${Date.now().toString().slice(-6)}`
      })
    }).catch(err => console.warn('M-Pesa API Call:', err));
  };

  const [checkoutAccountStatus, setCheckoutAccountStatus] = useState<'logged_in' | 'account_exists' | 'no_account'>('logged_in');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [currentOrderData, setCurrentOrderData] = useState<ReceiptData | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  // Rastrear visita ao checkout com código de afiliado
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const code = getCookie('affiliate_code');
    if (code) {
      setAffiliateCode(code);
      console.log('[Checkout] Código de afiliado detectado:', code);
      
      // Registrar visita ao checkout
      fetch('/api/affiliates/checkout-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateCode: code })
      }).catch(err => console.error('[Checkout] Erro ao registrar visita ao checkout:', err));
    }

    // Rastrear cancelamento de checkout (quando usuário sai da página)
    const handleBeforeUnload = () => {
      if (code && !success) {
        fetch('/api/affiliates/checkout-abandon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affiliateCode: code })
        }).catch(err => console.error('[Checkout] Erro ao registrar abandono de checkout:', err));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [success]);

  const finalizeOrder = async (paymentAlreadyConfirmed = false) => {
    console.log('[Checkout] Iniciando processamento de pedido');
    console.log('[Checkout] Método de pagamento:', paymentMethod);
    console.log('[Checkout] Valor total:', grandTotal);
    console.log('[Checkout] É verificação de afiliado:', isAffiliateVerification);
    console.log('[Checkout] Plano selecionado:', selectedPlan?.name);
    console.log('[Checkout] Duração:', durationMonths, 'meses');
    console.log('[Checkout] Domínio:', domainParam);
    console.log('[Checkout] Pagamento já confirmado pelo webhook:', paymentAlreadyConfirmed);
    
    // Gerar referência única para este pagamento (se não foi confirmado pelo webhook)
    const paymentReference = paymentAlreadyConfirmed && currentReference 
      ? currentReference 
      : `REF_${Date.now().toString().slice(-6)}`;
    
    try {
      const currentUser = auth.getCurrentUser();
      let accountStatus: 'logged_in' | 'account_exists' | 'no_account' = 'logged_in';

      if (currentUser) {
        if (selectedPlan && selectedPlan.id !== 'website_creation') {
          auth.updatePlan(currentUser.id, selectedPlan.id as 'basic' | 'pro' | 'enterprise');
        }
        accountStatus = 'logged_in';
      } else {
        const allUsers = auth.getUsers();
        const existingUser = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (existingUser) {
          accountStatus = 'account_exists';
        } else {
          accountStatus = 'no_account';
        }
      }

      console.log('[Checkout] Status da conta:', accountStatus);
      setCheckoutAccountStatus(accountStatus);

      const isWebsite = selectedPlan?.id === 'website_creation';
      const siteLabel = isWebsite && siteTypeName ? ` — ${siteTypeName}` : '';
      const cycleLabel = isWebsite ? '' : ` (${durationMonths} ${durationMonths === 1 ? 'Mês' : 'Meses'})`;
      const serviceName = isAffiliateVerification 
        ? 'Verificação de Afiliado'
        : (selectedPlan
            ? (domainParam 
                ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
                : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
            : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`);

      const orderId = `ORD-${Date.now().toString().slice(-5)}`;
      // 🔒 SEGURANÇA: Se confirmado pelo webhook, usar 'completed', senão usar status apropriado
      const orderStatus = paymentAlreadyConfirmed 
        ? 'completed'
        : (paymentMethod === 'bank_transfer' || paymentMethod === 'card' || (selectedPlan && selectedPlan.id === 'website_creation')) ? 'in_progress' : 'pending';
      
      // Salvar orderId e reference para polling
      setCurrentOrderId(orderId);
      setCurrentReference(paymentReference);

      // Se for verificação de afiliado, registrar o afiliado após pagamento
      // O número de comissões = o mesmo número usado para pagar os 2 MZN (M-Pesa/eMola)
      if (isAffiliateVerification) {
        const affiliatePhoneFinal = phonePayment || whatsapp;
        // Usar userId do parâmetro ou do usuário atual
        const userIdForAffiliate = affiliateUserIdParam || currentUser?.id;
        console.log('[Checkout] Registrando/Atualizando afiliado com telefone:', affiliatePhoneFinal, 'userId:', userIdForAffiliate);
        
        try {
          const affiliateResponse = await fetch('/api/affiliates/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userIdForAffiliate,
              phone: affiliatePhoneFinal,
              verificationPayment: true,
              paymentReference
            })
          });
          
          const affiliateData = await affiliateResponse.json();
          console.log('[Checkout] Resposta do registro de afiliado:', affiliateData);
          
          if (!affiliateData.success) {
            console.error('[Checkout] Erro ao registrar afiliado:', affiliateData.error);
          }
        } catch (err) {
          console.error('[Checkout] Erro ao chamar API de registro de afiliado:', err);
        }
      } else {
        // Registra pedido de serviço para gestão no Admin (apenas se não for verificação de afiliado)
        dataManager.addOrder({
          clientName: name,
          clientEmail: email,
          clientPhone: `${ddi} ${phonePayment || whatsapp}`,
          serviceName,
          amount: grandTotal,
          valorFaturado: 0,
          valorPorFaturar: grandTotal,
          paymentMethod: paymentMethod,
          proofUrl: proofUrl || undefined,
          proofName: proofName || undefined,
          status: orderStatus,
          reference: paymentReference // Usar a mesma referência gerada antes do pagamento
        });

        // Notificar admin sobre novo pedido
        try {
          const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
          const subject = `🛒 Novo Pedido: ${name} - ${serviceName}`;
          const message = `Olá Administrador,\n\nNovo pedido recebido:\n\n• Cliente: ${name} (${email})\n• Telefone: ${ddi} ${phonePayment || whatsapp}\n• Serviço: ${serviceName}\n• Valor: ${grandTotal.toLocaleString('pt-MZ')} MZN\n• Método: ${paymentMethod}\n• Status: ${orderStatus}\n• Referência: ${paymentReference}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nVerifique o pedido no painel admin.\nEquipe WEHOSTHERE`;

          fetch(apiEndpoint('/api/send-email'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: adminEmail,
              subject,
              text: message
            })
          }).catch(err => console.error('[Checkout] Erro ao notificar admin:', err));
        } catch (err) {
          console.error('[Checkout] Erro ao preparar notificação admin:', err);
        }

        setCurrentOrderData({
          id: orderId,
          clientName: name,
          clientEmail: email,
          clientPhone: `${ddi} ${phonePayment || whatsapp}`,
          serviceName,
          amount: grandTotal,
          valorFaturado: 0,
          valorPorFaturar: grandTotal,
          paymentMethod: paymentMethod,
          status: orderStatus,
          createdAt: new Date().toISOString()
        });

        // Cadastra o domínio na lista de sites do cliente associado ao e-mail com status 'pending'
        if (domainParam) {
          await dataManager.addSiteAsync({
            name: domainParam,
            domain: domainParam,
            status: 'pending',
            storage: selectedPlan ? selectedPlan.features.storage : 10,
            bandwidth: 100,
            userEmail: email.trim().toLowerCase()
          });
        }
      }
      try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
        const subject = `🛒 Novo Pedido: ${name} - ${serviceName}`;
        const message = `Olá Administrador,\n\nNovo pedido recebido:\n\n• Cliente: ${name} (${email})\n• Telefone: ${ddi} ${phonePayment || whatsapp}\n• Serviço: ${serviceName}\n• Valor: ${grandTotal.toLocaleString('pt-MZ')} MZN\n• Método: ${paymentMethod}\n• Status: ${orderStatus}\n• Referência: ${paymentReference}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nVerifique o pedido no painel admin.\nEquipe WEHOSTHERE`;

        fetch(apiEndpoint('/api/send-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: adminEmail,
            subject,
            text: message
          })
        }).catch(err => console.error('[Checkout] Erro ao notificar admin:', err));
      } catch (err) {
        console.error('[Checkout] Erro ao preparar notificação admin:', err);
      }

      setCurrentOrderData({
        id: orderId,
        clientName: name,
        clientEmail: email,
        clientPhone: `${ddi} ${phonePayment || whatsapp}`,
        serviceName,
        amount: grandTotal,
        valorFaturado: 0,
        valorPorFaturar: grandTotal,
        paymentMethod: paymentMethod,
        status: orderStatus,
        createdAt: new Date().toISOString()
      });

      // Cadastra o domínio na lista de sites do cliente associado ao e-mail com status 'pending'
      if (domainParam) {
        await dataManager.addSiteAsync({
          name: domainParam,
          domain: domainParam,
          status: 'pending',
          storage: selectedPlan ? selectedPlan.features.storage : 10,
          bandwidth: 100,
          userEmail: email.trim().toLowerCase()
        });
      }

      setPushModal(false);
      setLoading(false);
      soundEffects.playPaymentSuccessSound();
      
      // Rastrear Purchase no Facebook Pixel
      FacebookPixel.trackPurchase({
        content_ids: selectedPlan ? [selectedPlan.id] : [],
        content_name: serviceName,
        content_category: 'Hospedagem e Serviços Web',
        value: grandTotal,
        currency: 'MZN',
        transaction_id: orderId
      });
      
      setSuccess(true);

      // Se for verificação de afiliado, redirecionar para dashboard de afiliados após sucesso
      if (isAffiliateVerification) {
        setTimeout(() => {
          router.push('/dashboard/affiliates');
        }, 2000);
      }

      // Atualizar conversão de afiliado se houver código
      if (affiliateCode) {
        console.log('[Checkout] Atualizando conversão de afiliado:', affiliateCode);
        fetch('/api/affiliates/conversion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliateCode,
            orderId,
            amount: grandTotal,
            customerEmail: email,
            customerName: name
          })
        }).catch(err => console.error('[Checkout] Erro ao atualizar conversão de afiliado:', err));
      }

      // Enviar notificação de venda realizada
      try {
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
          await fetch('/api/notifications/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              orderId: orderId,
              orderNumber: orderId,
              type: 'new_sale',
              title: 'Nova Venda Realizada',
              message: `Pedido #${orderId} confirmado com sucesso. Valor: ${grandTotal.toLocaleString('pt-MZ')} MZN`,
              amount: grandTotal,
              currency: 'MZN',
              items: selectedPlan ? [{
                name: serviceName,
                quantity: 1,
                price: grandTotal
              }] : [],
              metadata: {
                customerName: name,
                customerEmail: email,
                paymentMethod: paymentMethod
              },
              channels: { email: true, push: true, sms: false }
            })
          });
        }
      } catch (notificationErr) {
        console.error('[Checkout] Erro ao enviar notificação de venda:', notificationErr);
      }
    } catch (err) {
      setPushModal(false);
      setLoading(false);
      soundEffects.playPaymentErrorSound();
      setError(err instanceof Error ? err.message : 'Erro ao processar o pagamento.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação específica para verificação de afiliado - apenas telefone de comissões
    if (isAffiliateVerification) {
      if (!affiliatePhone.trim()) {
        setError('Por favor, informe o número de telefone para recebimento das comissões.');
        return;
      }
    } else {
      // Validações normais para checkout de serviços
      if (!name.trim()) {
        setError('Por favor, informe seu nome completo.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Por favor, informe um e-mail válido.');
        return;
      }
      if (!whatsapp.trim()) {
        setError('Por favor, informe seu número do WhatsApp.');
        return;
      }
    }

    // Validar limite de sites por plano
    const currentUser = auth.getCurrentUser();
    if (currentUser && selectedPlan && selectedPlan.id !== 'website_creation') {
      const currentSites = dataManager.getSites(currentUser.email);
      const planLimits: Record<string, number> = { basic: 1, pro: 5, enterprise: -1 };
      const maxSites = planLimits[selectedPlan.id] || 1;
      
      if (maxSites !== -1 && currentSites.length >= maxSites) {
        setError(`O seu plano ${selectedPlan.name} permite apenas ${maxSites} site${maxSites > 1 ? 's' : ''}. Você já tem ${currentSites.length} site${currentSites.length > 1 ? 's' : ''} ativo${currentSites.length > 1 ? 's' : ''}. Faça upgrade para adicionar mais sites.`);
        return;
      }
    }

    setLoading(true);

    try {
      if (paymentMethod === 'mpesa' || paymentMethod === 'emola') {
        const phone = phonePayment || whatsapp;
        const apiUrl = paymentMethod === 'mpesa' 
          ? '/api/payments/mpesa/c2b'
          : '/api/payments/emola/c2b';
        
        // Gerar referência única para este pagamento
        const paymentReference = `REF_${Date.now().toString().slice(-6)}`;
        
        // Calcular serviceName para metadados
        const isWebsite = selectedPlan?.id === 'website_creation';
        const siteLabel = isWebsite && siteTypeName ? ` — ${siteTypeName}` : '';
        const cycleLabel = isWebsite ? '' : ` (${durationMonths} ${durationMonths === 1 ? 'Mês' : 'Meses'})`;
        const serviceName = selectedPlan
          ? (domainParam 
              ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
              : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
          : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`;
        
        fetch(apiEndpoint(apiUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msisdn: phone,
            amount: grandTotal,
            reference: paymentReference,
            thirdPartyReference: `ORDER_${Date.now().toString().slice(-6)}`,
            clientName: name,
            clientEmail: email,
            serviceName: serviceName
          })
        }).catch(err => console.warn(`${paymentMethod.toUpperCase()} API Call:`, err));

        // 🔒 SEGURANÇA: Salvar reference para polling - NÃO confirmar imediatamente
        setCurrentReference(paymentReference);
        
        // Open PUSH visual countdown modal
        setCountdown(45);
        setPushStatus('waiting');
        setPushModal(true);
      } else if (paymentMethod === 'bank_transfer') {
        // 🔒 SEGURANÇA: Para transferência bancária, apenas criar pedido como 'in_progress'
        // Admin deve aprovar manualmente após verificar comprovativo
        await finalizeOrder(false);
      } else if (paymentMethod === 'card') {
        // 🔒 CARTÃO NÃO IMPLEMENTADO - Não permitir pagamento por cartão
        setError('Pagamento por cartão ainda não disponível. Por favor, use M-Pesa ou eMola.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setLoading(false);
      soundEffects.playPaymentErrorSound();
      setError(err instanceof Error ? err.message : 'Erro ao processar o pagamento.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-gray-100 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
            {isAffiliateVerification ? 'Verificação Confirmada!' : 'Pagamento Confirmado!'}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-5">
            {isAffiliateVerification 
              ? 'A sua verificação de afiliado foi realizada com sucesso. Você será redirecionado para o Painel de Afiliados.'
              : `O seu pedido de ${selectedPlan ? selectedPlan.name : (domainParam ? `Registo do Domínio ${domainParam}` : 'Serviço')} foi registado com sucesso.`
            }
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left border border-gray-200 space-y-2 text-xs text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Cliente:</span>
              <span className="font-bold text-gray-900">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">E-mail:</span>
              <span className="font-semibold text-gray-900 font-mono">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Método:</span>
              <span className="font-bold text-gray-900 uppercase">{paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-extrabold text-sm">
              <span>Total Pago:</span>
              <span className="text-emerald-600 font-black text-base">{grandTotal.toLocaleString('pt-MZ')} MT</span>
            </div>
          </div>

          {/* Botão para Baixar/Ver Recibo Oficial em PDF */}
          {currentOrderData && (
            <button
              type="button"
              onClick={() => setSelectedReceipt(currentOrderData)}
              className="w-full mb-4 py-3 bg-white border-2 border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold rounded-2xl transition flex items-center justify-center space-x-2 text-xs sm:text-sm shadow-xs cursor-pointer"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Baixar / Imprimir Recibo Oficial (PDF)</span>
            </button>
          )}

          {/* FLUXO DE MENSAGEM SEGUNDO O E-MAIL DO CLIENTE */}
          {checkoutAccountStatus === 'logged_in' && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer text-sm"
            >
              <span>Ir para o meu Painel</span>
            </button>
          )}

          {checkoutAccountStatus === 'account_exists' && (
            <div className="space-y-3 bg-blue-50/80 border border-blue-200 p-4 rounded-2xl text-left">
              <div className="flex items-start space-x-2.5">
                <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-extrabold text-blue-900 uppercase tracking-wider">Já possui uma conta cadastrada!</strong>
                  <p className="text-xs text-blue-800 mt-1">
                    Identificámos que o e-mail <strong className="font-mono text-blue-950">{email}</strong> já tem uma conta na WEHOSTHERE. Faça login para aceder ao seu painel e visualizar os seus serviços sincronizados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow transition text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Fazer Login para Sincronizar</span>
              </button>
            </div>
          )}

          {checkoutAccountStatus === 'no_account' && (
            <div className="space-y-3 bg-amber-50/80 border border-amber-200 p-4 rounded-2xl text-left">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-extrabold text-amber-950 uppercase tracking-wider">Criar Conta para Aceder ao Painel</strong>
                  <p className="text-xs text-amber-900 mt-1">
                    Registámos a compra para o e-mail <strong className="font-mono text-amber-950">{email}</strong>. Crie agora a sua conta usando este <strong>mesmo e-mail</strong> para que os seus domínios e serviços fiquem sincronizados no seu painel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Criar Conta Agora com este E-mail</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      {/* PUSH Modal Overlay */}
      {pushModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-200 animate-in fade-in zoom-in duration-200">
            {pushStatus === 'waiting' ? (
              <>
                <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg">
                    <Smartphone className="h-8 w-8" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Autorize no seu Telemóvel
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enviamos um pedido PUSH para o número <span className="font-bold text-gray-900">{ddi} {phonePayment || whatsapp}</span>.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left text-sm text-red-900 space-y-1">
                  <p className="font-semibold text-red-700">Instruções:</p>
                  <p>1. Verifique a tela do seu celular.</p>
                  <p>2. Digite seu <strong>PIN {paymentMethod.toUpperCase()}</strong> para autorizar <strong>{grandTotal.toLocaleString('pt-MZ')} MT</strong>.</p>
                </div>

                <div className="mb-6">
                  <div className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Aguardando confirmação</div>
                  <div className="text-3xl font-mono font-bold text-gray-800">
                    00:{countdown < 10 ? `0${countdown}` : countdown}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      // 🔒 SEGURANÇA: Iniciar polling ao invés de confirmar imediatamente
                      setIsPollingPayment(true);
                    }}
                    disabled={isPollingPayment}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow transition text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isPollingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Verificando pagamento...</span>
                      </>
                    ) : (
                      <span>Já digitei meu PIN (Verificar)</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPushModal(false);
                      setIsPollingPayment(false);
                    }}
                    className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
                  >
                    Cancelar ou Alterar número
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <AlertCircle className="h-9 w-9" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  PIN Não Introduzido / Tempo Expirado
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Não recebemos a confirmação do PIN no número <span className="font-bold text-gray-900">{ddi} {phonePayment || whatsapp}</span>.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left text-xs text-amber-900 space-y-1">
                  <p className="font-semibold text-amber-800 text-sm mb-1">O que pode ter acontecido?</p>
                  <p>• O ecrã do seu telemóvel estava bloqueado ao receber o PUSH.</p>
                  <p>• A notificação expirou (45s) ou foi cancelada no telemóvel.</p>
                  <p>• O número de telemóvel não tem saldo M-Pesa suficiente.</p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleRetryPush}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reenviar Notificação PUSH Agora
                  </button>

                  <button
                    type="button"
                    onClick={() => setPushModal(false)}
                    className="w-full py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition"
                  >
                    Alterar Número ou Método de Pagamento
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top Brand Accent Line (Inspired by reference) */}
      <div className="h-1.5 bg-red-600 w-full" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3.5">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <BrandLogo />
          <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Ambiente 100% Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <span className="text-xs text-gray-400 font-mono">Checkout v2.0</span>
        </div>

        {/* Checkout Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Informações Pessoais */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400 shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu e-mail"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400 shadow-sm"
                />
              </div>

              {/* Número de WhatsApp — apenas em checkouts normais, não para afiliados */}
              {!isAffiliateVerification && (
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Número do WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={ddi}
                      onChange={(e) => setDdi(e.target.value)}
                      className="w-full sm:w-auto px-3 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 font-semibold shadow-sm cursor-pointer"
                    >
                      <option value="+258">+258 (Moçambique)</option>
                      <option value="+244">+244 (Angola)</option>
                      <option value="+351">+351 (Portugal)</option>
                      <option value="+55">+55 (Brasil)</option>
                      <option value="+1">+1 (EUA)</option>
                    </select>
                    <input
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Número sem DDI (ex: 84 123 4567)"
                      required
                      className="w-full sm:flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400 shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Método de Pagamento */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Método de Pagamento
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* M-Pesa Option */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Checkout] Método de pagamento selecionado: M-Pesa');
                    setPaymentMethod('mpesa');
                  }}
                  className={`p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'mpesa'
                      ? 'border-red-600 bg-red-50/50 shadow-sm ring-2 ring-red-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <img src="/mpesa.jpg" alt="M-Pesa" className="h-7 w-auto object-contain mb-1" />
                  <span className="text-xs font-bold text-gray-800">M-Pesa</span>
                </button>

                {/* eMola Option */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Checkout] Método de pagamento selecionado: eMola');
                    setPaymentMethod('emola');
                  }}
                  className={`p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'emola'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <img src="/emola.png" alt="eMola" className="h-7 w-auto object-contain mb-1" />
                  <span className="text-xs font-bold text-gray-800">eMola</span>
                </button>

                {/* Credit Card Option - Desativado temporariamente - NÃO mostrar para verificação de afiliado */}
                {!isAffiliateVerification && (
                  <div
                    className="relative p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed select-none"
                    title="Pagamento por cartão ainda não disponível. Em breve!"
                  >
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Em Breve</span>
                    <img src="/visa.png" alt="Visa" className="h-6 w-auto object-contain mb-1" />
                    <span className="text-xs font-bold text-gray-400">Cartão de Crédito</span>
                    <Lock className="h-3 w-3 text-gray-400 mt-0.5" />
                  </div>
                )}

                {/* Bank Transfer Option - NÃO mostrar para verificação de afiliado */}
                {!isAffiliateVerification && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[Checkout] Método de pagamento selecionado: Transferência / Comprovativo');
                      setPaymentMethod('bank_transfer');
                    }}
                    className={`p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  >
                    <div className="flex items-center space-x-1 mb-1 text-emerald-600">
                      <Landmark className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">Transferência / Comprovativo</span>
                  </button>
                )}
              </div>

              {/* Dynamic Payment Details Input */}
              {(paymentMethod === 'mpesa' || paymentMethod === 'emola') && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Número {paymentMethod === 'mpesa' ? 'M-Pesa' : 'eMola'} para cobrança
                    {isAffiliateVerification && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phonePayment}
                      onChange={(e) => setPhonePayment(e.target.value)}
                      placeholder={paymentMethod === 'mpesa' ? '84 123 4567 ou 85 123 4567' : '86 123 4567 ou 87 123 4567'}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {isAffiliateVerification ? (
                    <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                      💡 <strong>Este número será o seu número de comissões.</strong> O mesmo que usas para pagar os 2 MZN ficará registado para receber os seus ganhos como afiliado. Para mudar no futuro, será necessário repetir este processo.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Ao clicar em comprar, receberá um pedido PUSH no seu celular para introduzir o PIN do {paymentMethod === 'mpesa' ? 'M-Pesa' : 'eMola'}.
                    </p>
                  )}
                </div>
              )}

              {!isAffiliateVerification && paymentMethod === 'card' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Validade</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isAffiliateVerification && paymentMethod === 'bank_transfer' && (
                <div className="mt-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-4">
                  <div className="space-y-2 text-xs text-emerald-900">
                    <span className="font-bold block text-sm text-emerald-950">🏦 Contas Bancárias Oficiais para Transferência:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px]">
                      <div>
                        <strong className="text-gray-900">Millennium BIM:</strong><br />
                        NIB: 433372004293948
                      </div>
                      <div>
                        <strong className="text-gray-900">BCI:</strong><br />
                        <span className="text-gray-400 italic">NIB em breve</span>
                      </div>
                      <div>
                        <strong className="text-gray-900">Standard Bank:</strong><br />
                        <span className="text-gray-400 italic">NIB em breve</span>
                      </div>
                      <div>
                        <strong className="text-gray-900">M-Pesa Manual:</strong><br />
                        <a
                          href="https://wa.me/258844384702?text=Olá%2C%20quero%20confirmar%20o%20meu%20pagamento%20via%20M-Pesa"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-bold transition"
                        >+258 84 438 4702 (WEHOSTHERE)</a>
                      </div>
                      <div>
                        <strong className="text-gray-900">E-Mola Manual:</strong><br />
                        <span className="text-gray-400 italic font-sans">Indisponível de momento</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>Anexar Comprovativo de Pagamento (Imagem ou PDF)</span>
                      {uploadingProof && (
                        <span className="text-emerald-700 font-normal flex items-center space-x-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>A carregar no Cloudinary...</span>
                        </span>
                      )}
                    </label>

                    <div className="flex items-center space-x-3">
                      <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-emerald-100/50 text-emerald-800 text-xs font-bold rounded-xl transition border border-emerald-300 shadow-sm">
                        <Paperclip className="w-4 h-4 text-emerald-600" />
                        <span>{proofName ? 'Substituir Comprovativo' : 'Carregar Comprovativo'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={handleProofUpload}
                          disabled={uploadingProof}
                        />
                      </label>
                      <span className="text-[11px] text-emerald-700">Formatos aceites: PDF, JPG, PNG</span>
                    </div>

                    {proofUrl && (
                      <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-emerald-300 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-bold text-gray-900 truncate">{proofName || 'Comprovativo Anexado'}</span>
                        </div>
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold underline flex-shrink-0"
                        >
                          Ver Ficheiro
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Seleção de Duração / Período da Hospedagem - NÃO mostrar para verificação de afiliado */}
            {!isAffiliateVerification && selectedPlan ? (
              selectedPlan.id !== 'website_creation' && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-800">
                      Período de Contratação (Duração da Assinatura)
                    </label>
                    {domainParam && (
                      <button
                        type="button"
                        onClick={() => setSelectedPlanId('none')}
                        className="text-xs text-red-600 hover:text-red-700 font-medium underline cursor-pointer"
                      >
                        Remover Hospedagem (Comprar apenas domínio)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* 1 Mês */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 1 mês');
                        setDurationMonths(1);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 1
                          ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">1 Mês</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {selectedPlan.price.toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-gray-400 block font-normal">Mensal regular</span>
                    </button>

                    {/* 3 Meses */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 3 meses (5% desconto)');
                        setDurationMonths(3);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 3
                          ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                        -5% OFF
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">3 Meses</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {Math.round(selectedPlan.price * 3 * 0.95).toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-bold">5% Desconto</span>
                    </button>

                    {/* 6 Meses */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 6 meses (10% desconto)');
                        setDurationMonths(6);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 6
                          ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                        -10% OFF
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">6 Meses</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {Math.round(selectedPlan.price * 6 * 0.90).toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-bold">10% Desconto</span>
                    </button>

                    {/* 12 Meses / 1 Ano */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 12 meses (2 meses grátis)');
                        setDurationMonths(12);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 12
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-amber-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                        2 Mês Grátis
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 block uppercase">1 Ano (12M)</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {selectedPlan.priceAnnual.toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-amber-700 block font-bold">2 Meses OFF</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-2">
                <div>
                  <span className="text-xs font-black text-blue-900 uppercase block tracking-wider">Comprando Apenas Registro de Domínio</span>
                  <span className="text-xs text-blue-700 mt-0.5 block">Nenhum plano de hospedagem adicionado. Deseja incluir hospedagem?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanId('pro')}
                  className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-lg transition whitespace-nowrap cursor-pointer shadow-sm"
                >
                  + Adicionar Plano Pro (2.500 MT/mês)
                </button>
              </div>
            )}

            {/* 3. Resumo da Compra (Order Summary) */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Resumo da compra</h4>
              
              <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                {isAffiliateVerification ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        Verificação de Telefone para Comissões
                      </span>
                      <span className="font-bold text-gray-900">{verificationAmount.toLocaleString('pt-MZ')} MT</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Teste de segurança para confirmar propriedade do número M-Pesa
                    </div>
                  </>
                ) : (
                  <>
                    {selectedPlan ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">
                            {selectedPlan.id === 'website_creation'
                              ? (siteTypeName ? siteTypeName : 'Criação de Site Profissional')
                              : `Plano ${selectedPlan.name} (${durationMonths === 1 ? '1 Mês' : `${durationMonths} Meses`})`}
                          </span>
                          <span className="font-bold text-gray-900">{basePrice.toLocaleString('pt-MZ')} MT</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedPlan.id === 'website_creation'
                            ? `Investimento único • Entrega estimada`
                            : `${selectedPlan.features.sites === -1 ? 'Sites ilimitados' : `${selectedPlan.features.sites} site(s)`} • ${selectedPlan.features.storage}GB Armazenamento`}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 font-medium italic">
                        Nenhum plano de hospedagem selecionado (Registro de Domínio Avulso).
                      </div>
                    )}

                    {domainParam && (
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                        <div>
                          <span className="font-semibold text-gray-900 block">Registo de Domínio</span>
                          <span className="text-xs font-mono text-primary-700 font-bold">{domainParam}</span>
                        </div>
                        <span className="font-bold text-emerald-700">{domainCost.toLocaleString('pt-MZ')} MT/ano</span>
                      </div>
                    )}

                    {selectedPlan && selectedPlan.id !== 'website_creation' && durationMonths > 1 && (
                      <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-xs font-semibold border border-emerald-200 mt-2 flex items-center justify-between">
                        <span>🎉 Desconto Especial para {durationMonths} Meses Aplicado!</span>
                        <span className="font-bold text-emerald-700">
                          {durationMonths === 12
                            ? `Economia de ${(selectedPlan.price * 2).toLocaleString('pt-MZ')} MT`
                            : (durationMonths === 6
                                ? `Economia de ${Math.round(selectedPlan.price * 6 * 0.10).toLocaleString('pt-MZ')} MT`
                                : `Economia de ${Math.round(selectedPlan.price * 3 * 0.05).toLocaleString('pt-MZ')} MT`)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3 font-bold text-base text-gray-900">
                  <span>Total a Pagar</span>
                  <span className="text-xl text-emerald-600 font-black">{(isAffiliateVerification ? verificationAmount : grandTotal).toLocaleString('pt-MZ')} MT</span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Notice */}
            <div className="text-center text-xs text-gray-500 flex items-center justify-center space-x-2 pt-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <span>Nós protegemos seus dados de pagamento com criptografia para garantir segurança em nível bancário.</span>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              onClick={() => console.log('[Checkout] Botão de compra clicado')}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <span>Comprar agora</span>
              )}
            </button>

          </form>
        </div>
      </main>

      {/* Modal de Recibo PDF */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader text="A carregar checkout seguro..." />}>
      <CheckoutContent />
    </Suspense>
  );
}
