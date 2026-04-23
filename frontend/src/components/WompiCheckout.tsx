import { useState, useEffect } from "react";
import api from "../api";
import "./WompiCheckout.css";

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

interface WompiCheckoutProps {
  items: { id: number; nombre: string; precio: number; cantidad: number; imagen?: string }[];
  total: number;
  tiendaId: number;
  formData: { nombre: string; email: string; telefono: string; direccion: string; notas: string };
  colorPrimario: string;
  onPaymentSuccess: (pedidoId: number) => void;
  onError: (message: string) => void;
  loadingSubmit: boolean;
  setLoadingSubmit: (loading: boolean) => void;
}

export default function WompiCheckout({
  items,
  total,
  tiendaId,
  formData,
  colorPrimario,
  onPaymentSuccess,
  onError,
  loadingSubmit,
  setLoadingSubmit,
}: WompiCheckoutProps) {
  const [wompiData, setWompiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    const loadWompiWidget = () => {
      if (!document.getElementById("wompi-widget-script")) {
        const script = document.createElement("script");
        script.id = "wompi-widget-script";
        script.src = "https://checkout.wompi.co/widget.js";
        script.onload = () => setWidgetLoaded(true);
        document.body.appendChild(script);
      } else if (window.WidgetCheckout) {
        setWidgetLoaded(true);
      }
    };
    loadWompiWidget();
  }, []);

  useEffect(() => {
    if (widgetLoaded && !wompiData) {
      createTransaction();
    }
  }, [widgetLoaded]);

  const createTransaction = async () => {
    setLoading(true);
    setError(null);

    try {
      const pedidoData = {
        tienda_id: tiendaId,
        cliente_nombre: formData.nombre,
        cliente_email: formData.email,
        cliente_telefono: formData.telefono,
        direccion_envio: formData.direccion,
        notas: formData.notas,
        items: items.map((item) => ({
          producto_id: item.id,
          producto_nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
        })),
      };

      const { data } = await api.post("/pedidos/create-wompi-transaction", pedidoData);
      setWompiData(data);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Error al inicializar el pago";
      setError(message);
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWompi = async () => {
    if (!window.WidgetCheckout || !wompiData) {
      setError("Widget de Wompi no disponible");
      return;
    }

    setLoadingSubmit(true);

    const checkout = new window.WidgetCheckout({
      currency: wompiData.currency,
      amountInCents: wompiData.amountInCents,
      reference: wompiData.reference,
      publicKey: wompiData.publicKey,
      signature: { integrity: wompiData.signature },
      redirectUrl: wompiData.redirectUrl,
      customerData: wompiData.customerData,
    });

    checkout.open(async (result: any) => {
      setLoadingSubmit(false);
      
      if (result && result.transaction) {
        const transaction = result.transaction;
        
        if (transaction.status === "APPROVED") {
          onPaymentSuccess(1);
        } else if (transaction.status === "DECLINED") {
          setError("El pago fue declined");
          onError("El pago fue rechazado");
        } else if (transaction.status === "PENDING") {
          setError("El pago está pendiente");
          onError("El pago está pendiente de confirmación");
        }
      } else {
        onError("El pago fue cancelado o no se completó");
      }
    });
  };

  if (loading) {
    return (
      <div className="wompi-loading">
        <div className="wompi-spinner"></div>
        <p>Inicializando pago con Wompi...</p>
      </div>
    );
  }

  if (error && !wompiData) {
    return (
      <div className="wompi-error">
        <p>{error}</p>
        <button onClick={createTransaction} className="wompi-retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="wompi-checkout">
      <div className="wompi-summary">
        <h3>Resumen del pago</h3>
        <div className="wompi-amount">
          <span>Total a pagar:</span>
          <span className="wompi-total">${total.toFixed(2)} COP</span>
        </div>
        <p className="wompi-secure">
          🔒 Pago seguro procesado por Wompi
        </p>
      </div>

      <button
        type="button"
        className="wompi-pay-btn"
        onClick={handleOpenWompi}
        disabled={loadingSubmit || !widgetLoaded}
        style={{
          background: `linear-gradient(135deg, ${colorPrimario}, ${colorPrimario}dd)`,
        }}
      >
        {loadingSubmit ? (
          <span className="wompi-spinner" />
        ) : (
          <>💳 Pagar con Wompi</>
        )}
      </button>

      {error && <div className="wompi-error-message">{error}</div>}
    </div>
  );
}