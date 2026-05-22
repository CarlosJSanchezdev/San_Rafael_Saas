import { useState, useEffect } from "react";
import { Wizard, Input, Modal } from "../ui";
import { HiOutlineCheck } from "react-icons/hi";

export interface TiendaFormData {
  nombre: string;
  subdominio: string;
  slug: string;
  sector: string;
  descripcion: string;
  color_primario: string;
  color_secundario: string;
  plantilla: string;
  telefono: string;
  email: string;
  direccion: string;
  activa: boolean;
  manager_id: number | null;
}

interface Manager {
  id: number;
  nombre: string;
  email: string;
}

interface Tienda {
  id: number;
  nombre: string;
  subdominio: string;
  slug: string;
  sector: string;
  descripcion: string;
  color_primario: string;
  color_secundario: string;
  plantilla: string;
  telefono: string;
  email: string;
  direccion: string;
  activa: boolean;
  manager_id: number | null;
}

const SECTORES = ["comercial", "industrial", "servicios", "oficial", "residencial"];

const PLANTILLAS = [
  { id: "style_1", nombre: "Clásico Lavanda", preview: "#f7f6f8" },
  { id: "style_2", nombre: "Midnight Dark", preview: "#0F0A1E" },
];

const emptyForm: TiendaFormData = {
  nombre: "",
  subdominio: "",
  slug: "",
  sector: "comercial",
  descripcion: "",
  color_primario: "#0ea5e9",
  color_secundario: "#1e293b",
  plantilla: "style_1",
  telefono: "",
  email: "",
  direccion: "",
  activa: true,
  manager_id: null,
};

function generarSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface TiendaWizardProps {
  isOpen: boolean;
  onClose: () => void;
  editando: Tienda | null;
  managers: Manager[];
  onSubmit: (data: TiendaFormData, editando: Tienda | null) => Promise<void>;
}

export default function TiendaWizard({
  isOpen,
  onClose,
  editando,
  managers,
  onSubmit,
}: TiendaWizardProps) {
  const [formData, setFormData] = useState<TiendaFormData>(emptyForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editando) {
      setFormData({
        nombre: editando.nombre || "",
        subdominio: editando.subdominio || "",
        slug: editando.slug || "",
        sector: editando.sector || "comercial",
        descripcion: editando.descripcion || "",
        color_primario: editando.color_primario || "#0ea5e9",
        color_secundario: editando.color_secundario || "#1e293b",
        plantilla: editando.plantilla || "style_1",
        telefono: editando.telefono || "",
        email: editando.email || "",
        direccion: editando.direccion || "",
        activa: editando.activa ?? true,
        manager_id: editando.manager_id || null,
      });
    } else {
      setFormData(emptyForm);
    }
    setCurrentStep(0);
    setErrors({});
  }, [editando, isOpen]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
      if (!formData.subdominio.trim()) newErrors.subdominio = "El subdominio es obligatorio";
    }

    if (step === 2) {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email inválido";
      }
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
      await onSubmit(formData, editando);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleNombreChange = (nombre: string) => {
    const slug = generarSlug(nombre);
    setFormData((prev) => ({
      ...prev,
      nombre,
      subdominio: slug,
      slug,
    }));
    if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: "" }));
  };

  const handleSubdominioChange = (subdominio: string) => {
    const slug = generarSlug(subdominio);
    setFormData((prev) => ({ ...prev, subdominio, slug }));
    if (errors.subdominio) setErrors((prev) => ({ ...prev, subdominio: "" }));
  };

  // Paso 1: Información Básica
  const pasoBasico = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Input
        label="Nombre de la Tienda"
        value={formData.nombre}
        onChange={(e) => handleNombreChange(e.target.value)}
        error={errors.nombre}
        required
      />

      <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Input
          label="Subdominio"
          value={formData.subdominio}
          onChange={(e) => handleSubdominioChange(e.target.value)}
          error={errors.subdominio}
          hint="Tu tienda será accesible en: tu-tienda.srf.com"
          required
        />
        <div className="ui-input-wrapper">
          <label className="ui-input-label ui-input-label--required">Sector</label>
          <select
            className="ui-input"
            value={formData.sector}
            onChange={(e) => setFormData((prev) => ({ ...prev, sector: e.target.value }))}
          >
            {SECTORES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ui-input-wrapper">
        <label className="ui-input-label">Descripción</label>
        <textarea
          className="ui-input"
          value={formData.descripcion}
          onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
          rows={3}
          style={{ resize: "vertical", minHeight: "80px" }}
        />
      </div>
    </div>
  );

  // Paso 2: Branding
  const pasoBranding = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <div>
          <label className="ui-input-label">Color Primario</label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
            <input
              type="color"
              value={formData.color_primario}
              onChange={(e) => setFormData((prev) => ({ ...prev, color_primario: e.target.value }))}
              style={{ width: 48, height: 48, border: "none", borderRadius: 8, cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {formData.color_primario}
            </span>
          </div>
        </div>
        <div>
          <label className="ui-input-label">Color Secundario</label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
            <input
              type="color"
              value={formData.color_secundario}
              onChange={(e) => setFormData((prev) => ({ ...prev, color_secundario: e.target.value }))}
              style={{ width: 48, height: 48, border: "none", borderRadius: 8, cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {formData.color_secundario}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="ui-input-label">Plantilla</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
          {PLANTILLAS.map((p) => (
            <div
              key={p.id}
              onClick={() => setFormData((prev) => ({ ...prev, plantilla: p.id }))}
              style={{
                padding: "1rem",
                borderRadius: 12,
                border: `2px solid ${formData.plantilla === p.id ? "var(--primary, #694634)" : "var(--border, #E8E4E0)"}`,
                background: formData.plantilla === p.id ? "rgba(105, 70, 52, 0.05)" : "white",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 60,
                  borderRadius: 8,
                  background: p.preview,
                  border: "1px solid var(--border)",
                }}
              />
              <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{p.nombre}</span>
              {formData.plantilla === p.id && (
                <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>
                  <HiOutlineCheck style={{ display: "inline", marginRight: 4 }} />
                  Seleccionada
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Paso 3: Contacto y Configuración
  const pasoContacto = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Input
          label="Teléfono"
          type="tel"
          value={formData.telefono}
          onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          error={errors.email}
        />
      </div>

      <Input
        label="Dirección"
        value={formData.direccion}
        onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
      />

      <div className="ui-input-wrapper">
        <label className="ui-input-label">Manager Asignado</label>
        <select
          className="ui-input"
          value={formData.manager_id || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              manager_id: e.target.value ? parseInt(e.target.value) : null,
            }))
          }
        >
          <option value="">Sin manager asignado</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} ({m.email})
            </option>
          ))}
        </select>
      </div>

      {editando && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.9375rem",
            cursor: "pointer",
            padding: "0.75rem",
            background: "var(--bg-glass)",
            borderRadius: 8,
          }}
        >
          <input
            type="checkbox"
            checked={formData.activa}
            onChange={(e) => setFormData((prev) => ({ ...prev, activa: e.target.checked }))}
          />
          Tienda activa
        </label>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? "Editar Tienda" : "Nueva Tienda"}
      size="lg"
    >
      <Wizard
        steps={[
          { label: "Básico", content: pasoBasico },
          { label: "Branding", content: pasoBranding },
          { label: "Contacto", content: pasoContacto },
        ]}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onFinish={handleFinish}
        canProceed={currentStep === 0 ? !!formData.nombre && !!formData.subdominio : true}
        loading={loading}
        finishLabel={editando ? "Actualizar" : "Crear Tienda"}
      />
    </Modal>
  );
}
