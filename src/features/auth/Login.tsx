import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import type { AuthSession } from "@/types";
import { photos } from "@/data/demo";
import { ApiError, loginApi } from "@/lib/api";
import { Button, Logo } from "@/components/ui/Common";

export function Login({
  onEnter,
  onLiveLogin,
}: {
  onEnter: () => void;
  onLiveLogin: (session: AuthSession) => void;
}) {
  const showDemoAccess = import.meta.env.VITE_ENABLE_DEMO !== "false";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const session = await loginApi(email.trim(), password);
      onLiveLogin(session);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 422) {
          setError("Correo o contraseña incorrectos.");
        } else if (err.status >= 500) {
          setError(
            "El servidor backend no responde en este momento. Inicia la API o entra en modo demostración.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError(
          "No se pudo conectar con la API. Verifica que el backend esté activo o utiliza el modo demostración.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-form-wrap">
        <div className="login-form-inner">
          <Logo />
          <div className="login-copy">
            <span className="eyebrow">
              <ShieldCheck size={15} /> Espacio documental privado
            </span>
            <h1>Bienvenido de nuevo</h1>
            <p>Organiza tu empresa y encuentra cada documento cuando lo necesites.</p>
          </div>
          <form onSubmit={submit} className="login-form">
            <label>
              Correo electrónico
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gerencia@misdosmarias.pe"
              />
            </label>
            <label>
              Contraseña
              <span className="input-with-action">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <div className="login-options">
              <label className="check-label">
                <input type="checkbox" /> Recordar sesión
              </label>
              <button
                type="button"
                onClick={() =>
                  setError("La recuperación de contraseña se configura desde el backend.")
                }
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            {error && (
              <p className="form-note error">
                <AlertCircle size={15} />
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Verificando acceso..." : "Iniciar sesión"}
            </Button>
          </form>
          {showDemoAccess && (
            <div className="demo-access">
              <div>
                <Sparkles size={18} />
                <span>
                  <strong>Modo demostración</strong>
                  <small>Explora el producto con datos ficticios.</small>
                </span>
              </div>
              <Button variant="secondary" onClick={onEnter}>
                Entrar al prototipo <ArrowRight size={16} />
              </Button>
            </div>
          )}
          <p className="privacy-note">
            Acceso privado con sesión protegida
            {showDemoAccess ? " · También disponible en modo demostración." : "."}
          </p>
        </div>
      </section>
      <section className="login-visual">
        <img src={photos.hero} alt="Bus de transporte de personal en carretera" />
        <div className="login-overlay" />
        <div className="visual-copy">
          <span>Control documental empresarial</span>
          <h2>
            Todo lo importante,
            <br />
            siempre en orden.
          </h2>
          <p>
            Un espacio diseñado para que tu flota, documentos y próximas auditorías estén bajo
            control.
          </p>
          <div className="visual-proof">
            <div>
              <Check size={16} />
              <span>
                <strong>Centralizado</strong>
                <small>Un solo lugar para tu empresa</small>
              </span>
            </div>
            <div>
              <Check size={16} />
              <span>
                <strong>Preparado</strong>
                <small>Documentación lista para auditar</small>
              </span>
            </div>
          </div>
        </div>
        <span className="photo-credit">Foto: Hobi industri / Unsplash</span>
      </section>
    </main>
  );
}
