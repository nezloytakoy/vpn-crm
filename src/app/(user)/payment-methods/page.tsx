import dynamic from 'next/dynamic';

// Динамически загружаем компонент PaymentPage
const PaymentPageClient = dynamic(() => import('./PaymentPage'), {
  ssr: false, // Отключаем серверный рендеринг
});

export default function PaymentWrapper() {
  return <PaymentPageClient />;
}