import React, { useEffect, useRef } from 'react';

interface WompiProps {
  reference: string; // SUB_EmpresaID_Timestamp
  amountInCents: number; // 6000000 para $60.000
}

const WompiCheckout: React.FC<WompiProps> = ({ reference, amountInCents }) => {
  const containerRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Evitar montar doble el script si ya existe
    if (containerRef.current && containerRef.current.innerHTML === '') {
      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.setAttribute('data-render', 'button');
      script.setAttribute('data-public-key', 'pub_test_Q5yDA9xoKdePzhS8jA3I3nB0M2mJ4K6d'); // Reemplazar con llave REAL del usuario
      script.setAttribute('data-currency', 'COP');
      script.setAttribute('data-amount-in-cents', amountInCents.toString());
      script.setAttribute('data-reference', reference);
      // Opcional redirección de regreso (para este caso lo dejamos flotante)
      // script.setAttribute('data-redirect-url', window.location.origin + '/dashboard'); 
      
      containerRef.current.appendChild(script);
    }
  }, [reference, amountInCents]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
      <form ref={containerRef} />
    </div>
  );
};

export default WompiCheckout;
