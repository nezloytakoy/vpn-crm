import dynamic from 'next/dynamic';


const PaymentPageClient = dynamic(() => import('./PaymentPage'), {
  ssr: false,
});

export default function PaymentWrapper() {
  return <PaymentPageClient />;
}