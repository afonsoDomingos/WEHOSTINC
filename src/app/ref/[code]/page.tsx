import { redirect } from 'next/navigation';

export default function ReferralPage({ params }: { params: { code: string } }) {
  // Redirecionar para a API de rastreamento de afiliado
  redirect(`/api/affiliates/${params.code}`);
}
