import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wizard, Input } from "../components/ui";
import { HiOutlineShoppingBag, HiOutlineCheck } from "react-icons/hi";
import api from "../api";
import { useToast } from "../context/ToastContext";

const emptyTienda = {
  nombre: "",
  subdominio: "",
  sector: "comercial",
  descripcion: "",
};

function generarSlug(nombre: string) {
  return nombre.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(emptyTienda);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
      if (!formData.subdominio.trim()) newErrors.subdominio = "El subdominio es obligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    setErrors({});
  };

  const handleFinish = async () => {
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      await api.post("/admin/tiendas", {
        ...formData,
        slug: formData.subdominio,
        color_primario: "#0ea5e9",
        color_secundario: "#1e293b",
        plantilla: "style_1",
        activa: true,
      });
      showToast("¡Tu tienda ha sido creada!", "success");
      navigate("/admin");
    } catch {
      showToast("Error al crear tienda", "error");
    } finally {
      setLoading(false);
    }
  };

  const pasoBienvenida = (
    <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #694634, #8B6B52)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
          color: "white",
          fontSize: "2rem",
        }}
      >
        <HiOutlineShoppingBag />
      </div>
      <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
        ¡Bienvenido a San Rafael!
      </h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
        Vamos a configurar tu primera tienda en solo 2 pasos. Podrás vender productos online en minutos.
      </p>
    </div>
  );

  const pasoTienda = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Información de tu tienda</h3>
      <Input
        label="Nombre de la tienda"
        value={formData.nombre}
        onChange={(e) => {
          const nombre = e.target.value;
          setFormData((prev) => ({
            ...prev,
            nombre,
            subdominio: generarSlug(nombre),
          }));
          if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: "" }));
        }}
        error={errors.nombre}
        required
      />
      <Input
        label="Subdominio"
        value={formData.subdominio}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, subdominio: e.target.value }));
          if (errors.subdominio) setErrors((prev) => ({ ...prev, subdominio: "" }));
        }}
        error={errors.subdominio}
        hint="tu-tienda.srf.com"
        required
      />
      <div className="ui-input-wrapper">
        <label className="ui-input-label">Sector</label>
        <select
          className="ui-input"
          value={formData.sector}
          onChange={(e) => setFormData((prev) => ({ ...prev, sector: e.target.value }))}
        >
          <option value="comercial">Comercial</option>
          <option value="industrial">Industrial</option>
          <option value="servicios">Servicios</option>
          <option value="oficial">Oficial</option>
          <option value="residencial">Residencial</option>
        </select>
      </div>
    </div>
  );

  const pasoListo = (
    <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(5, 150, 105, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
          color: "var(--success)",
          fontSize: "2rem",
        }}
      >
        <HiOutlineCheck />
      </div>
      <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
        ¡Todo listo!
      </h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
        Tu tienda <strong>{formData.nombre}</strong> está configurada. Desde el dashboard podrás agregar productos, personalizar el diseño y compartir tu link.
      </p>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #F5F0EB)",
        padding: "2rem 1rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "white",
          borderRadius: 20,
          boxShadow: "0 25px 50px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <Wizard
          steps={[
            { label: "Bienvenida", content: pasoBienvenida },
            { label: "Tu Tienda", content: pasoTienda },
            { label: "Listo", content: pasoListo },
          ]}
          currentStep={currentStep}
          onNext={handleNext}
          onBack={handleBack}
          onFinish={handleFinish}
          canProceed={currentStep === 1 ? !!formData.nombre && !!formData.subdominio : true}
          loading={loading}
          finishLabel="Ir al Dashboard"
          backLabel="Atrás"
          nextLabel="Continuar"
        />
      </motion.div>
    </div>
  );
}
