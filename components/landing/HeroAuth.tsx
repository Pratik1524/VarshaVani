"use client";

import { useCallback, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight, Eye, EyeOff, KeyRound, Leaf, Loader2, Lock, LogIn, Mail, User, UserPlus, Users, type LucideIcon } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/lib/store";
import { demoUser, DEMO_CREDENTIALS, isValidEmail, registerAccount, signInWithPassword, type MockUser, type Role } from "@/lib/mockAuth";
import type { TKey } from "@/lib/i18n";

export type AuthMode = "login" | "signup";

/** Sign in and go to `next` (same-origin, role-appropriate) or the role's home. */
function useFinishSignIn(next?: string | null) {
  const login = useAppStore((s) => s.login);
  const router = useRouter();
  return useCallback(
    (user: MockUser) => {
      login(user);
      const home = user.role === "officer" ? "/officer" : "/farmer";
      router.push(next && next.startsWith(`/${user.role}`) && !next.startsWith("//") ? next : home);
    },
    [login, router, next],
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

const FIELD =
  "min-h-11 short:min-h-10 w-full rounded-xl border border-slate-200 bg-white/90 pl-10 pr-3 text-[15px] text-slate-900 shadow-[inset_0_1px_2px_rgb(11_29_51/0.04)] transition placeholder:text-slate-400 hover:border-slate-300 focus:border-leaf-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-leaf-500/15 aria-[invalid=true]:border-red-300";

const ROLES: { value: Role; key: TKey; icon: LucideIcon; tint: string }[] = [
  { value: "farmer", key: "login.farmer", icon: Leaf, tint: "text-leaf-600" },
  { value: "officer", key: "login.officer", icon: Users, tint: "text-monsoon-600" },
];

/** Two-option role switch with a sliding thumb (radiogroup, arrow-key navigation). */
function RoleSwitch({ value, onChange, label, id }: { value: Role; onChange: (r: Role) => void; label: string; id: string }) {
  const { t } = useT();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = ROLES.findIndex((r) => r.value === value);
  const onKey = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = (idx + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + ROLES.length) % ROLES.length;
    onChange(ROLES[next].value);
    refs.current[next]?.focus();
  };
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" aria-label={label} onKeyDown={onKey} className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/90 p-1 ring-1 ring-slate-200/70">
        {ROLES.map((r, i) => {
          const on = r.value === value;
          return (
            <button
              key={r.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(r.value)}
              className={`relative flex min-h-10 short:min-h-9 items-center justify-center gap-2 rounded-xl px-2 text-[13.5px] font-semibold transition-colors ${on ? "text-ink" : "text-slate-500 hover:text-ink"}`}
            >
              {on && (
                <motion.span
                  layoutId={`${id}-thumb`}
                  className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_8px_-2px_rgb(11_29_51/0.18)] ring-1 ring-slate-200/80"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  aria-hidden
                />
              )}
              <r.icon className={`relative h-4 w-4 shrink-0 ${r.tint}`} aria-hidden />
              <span className="relative text-center leading-tight max-[380px]:text-[12.5px]">{t(r.key)}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[12.5px] font-semibold text-slate-700">
      {children}
    </label>
  );
}

function IconInput({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" aria-hidden />
      {children}
    </div>
  );
}

function PasswordInput({ id, value, onChange, placeholder, invalid, describedBy, autoComplete }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  invalid: boolean;
  describedBy?: string;
  autoComplete: string;
}) {
  const { t } = useT();
  const [reveal, setReveal] = useState(false);
  return (
    <IconInput icon={Lock}>
      <input
        id={id}
        type={reveal ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${FIELD} pr-12`}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        onClick={() => setReveal((r) => !r)}
        aria-pressed={reveal}
        aria-label={reveal ? t("login.hidePassword") : t("login.showPassword")}
        className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
        {reveal ? <EyeOff className="h-4.5 w-4.5" aria-hidden /> : <Eye className="h-4.5 w-4.5" aria-hidden />}
      </button>
    </IconInput>
  );
}

function SubmitButton({ busy, icon: Icon, children }: { busy: boolean; icon: LucideIcon; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="group relative flex min-h-11 short:min-h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-leaf-700 via-leaf-600 to-leaf-700 bg-[length:200%_100%] text-[15px] font-semibold text-white shadow-[0_12px_24px_-10px_rgb(41_88_34/0.7)] transition-all duration-500 hover:-translate-y-px hover:bg-[position:100%_0] hover:shadow-[0_16px_30px_-10px_rgb(41_88_34/0.75)] active:translate-y-0 disabled:opacity-70"
    >
      {busy ? <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden /> : <Icon className="h-4.5 w-4.5" aria-hidden />}
      {children}
      <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
    </button>
  );
}

function ErrorNote({ id, children }: { id: string; children: ReactNode }) {
  return (
    <motion.p
      id={id}
      role="alert"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800 ring-1 ring-red-100"
    >
      {children}
    </motion.p>
  );
}

/* ================================================================
 * Card
 * ================================================================ */

/**
 * Sign-in surface for /login: Log in and Sign up tabs in one frosted card,
 * plus one-click demo entry. `next` and the initial role come from the URL.
 */
export function HeroAuthCard({ initialMode = "login", initialRole = "farmer", next }: { initialMode?: AuthMode; initialRole?: Role; next?: string | null }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const finish = useFinishSignIn(next);
  const tabsId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const TABS: { value: AuthMode; key: TKey; icon: LucideIcon }[] = [
    { value: "login", key: "login.tabLogin", icon: LogIn },
    { value: "signup", key: "login.tabSignup", icon: UserPlus },
  ];

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const nextIdx = (TABS.findIndex((x) => x.value === mode) + 1) % TABS.length;
    setMode(TABS[nextIdx].value);
    tabRefs.current[nextIdx]?.focus();
  };

  return (
    <section aria-label={t("login.title")} className="relative">
      {/* Soft coloured halo behind the card */}
      <div
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_30%_20%,rgba(98,168,82,0.35),transparent_70%),radial-gradient(50%_60%_at_85%_80%,rgba(74,137,199,0.3),transparent_70%)] blur-2xl"
        aria-hidden
      />
      <div className="rounded-[1.75rem] bg-gradient-to-br from-white via-white/70 to-leaf-100/80 p-px shadow-[0_40px_80px_-24px_rgb(0_0_0/0.5),0_14px_30px_-12px_rgb(11_29_51/0.25)]">
        <div className="overflow-hidden rounded-[calc(1.75rem-1px)] bg-white/90 backdrop-blur-2xl">
          {/* Tabs */}
          <div role="tablist" aria-label={t("login.title")} onKeyDown={onTabKey} className="grid grid-cols-2 border-b border-slate-200/80 px-2 pt-2">
            <LayoutGroup id={`${tabsId}-tabs`}>
              {TABS.map((tab, i) => {
                const on = tab.value === mode;
                return (
                  <button
                    key={tab.value}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    id={`${tabsId}-${tab.value}-tab`}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls={`${tabsId}-${tab.value}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setMode(tab.value)}
                    className={`relative flex min-h-11 short:min-h-10 items-center justify-center gap-2 text-[14.5px] font-semibold transition-colors ${on ? "text-leaf-800" : "text-slate-500 hover:text-ink"}`}
                  >
                    <tab.icon className="h-4.5 w-4.5" aria-hidden />
                    {t(tab.key)}
                    {on && (
                      <motion.span
                        layoutId={`${tabsId}-underline`}
                        className="absolute inset-x-6 -bottom-px h-[3px] rounded-full bg-gradient-to-r from-leaf-500 to-leaf-700"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </LayoutGroup>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              id={`${tabsId}-${mode}-panel`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-${mode}-tab`}
              initial={reduce ? false : { opacity: 0, x: mode === "signup" ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: mode === "signup" ? -16 : 16 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {mode === "login" ? (
                <>
                  <LoginPanel
                    role={role}
                    setRole={setRole}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    onDone={finish}
                  />
                  <DemoPanel
                    onDemo={(r) => finish(demoUser(r))}
                    onFill={(c) => {
                      setRole(c.role);
                      setEmail(c.email);
                      setPassword(c.password);
                    }}
                  />
                </>
              ) : (
                <SignupPanel role={role} setRole={setRole} onDone={finish} onSwitch={() => setMode("login")} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
 * Log in
 * ================================================================ */

function LoginPanel({
  role,
  setRole,
  email,
  setEmail,
  password,
  setPassword,
  onDone,
}: {
  role: Role;
  setRole: (r: Role) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onDone: (u: MockUser) => void;
}) {
  const { t } = useT();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const cred = DEMO_CREDENTIALS.find((c) => c.role === role)!;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const user = await signInWithPassword(email, password);
    setBusy(false);
    if (!user || user.role !== role) {
      setError(true);
      return;
    }
    onDone(user);
  };

  return (
    <div className="px-5 pb-4 pt-4 sm:px-7 sm:pt-5 short:pb-3 short:pt-3">
      <h1 className="text-[1.2rem] font-bold leading-snug tracking-tight text-monsoon-950 sm:text-[1.3rem]">{t("login.title")}</h1>
      <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{t("login.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-3.5 space-y-3 short:mt-2.5 short:space-y-2.5" noValidate>
        <div>
          <p className="mb-1 text-[12.5px] font-semibold text-slate-700">{t("login.role")}</p>
          <RoleSwitch
            id="login-role"
            label={t("login.role")}
            value={role}
            onChange={(r) => {
              setRole(r);
              setError(false);
            }}
          />
        </div>
        <div>
          <Label htmlFor="auth-email">{t("login.email")}</Label>
          <IconInput icon={Mail}>
            <input
              id="auth-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(false);
              }}
              placeholder={cred.email}
              className={FIELD}
              aria-invalid={error}
              aria-describedby={error ? "auth-login-error" : undefined}
            />
          </IconInput>
        </div>
        <div>
          <Label htmlFor="auth-password">{t("login.password")}</Label>
          <PasswordInput
            id="auth-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setError(false);
            }}
            placeholder={t("login.passwordPlaceholder")}
            invalid={error}
            describedBy={error ? "auth-login-error" : undefined}
            autoComplete="current-password"
          />
        </div>
        <AnimatePresence initial={false}>{error && <ErrorNote id="auth-login-error">{t("login.invalid")}</ErrorNote>}</AnimatePresence>
        <SubmitButton busy={busy} icon={LogIn}>
          {t("login.submit")}
        </SubmitButton>
      </form>
    </div>
  );
}

/* ================================================================
 * Sign up (browser-local demo accounts)
 * ================================================================ */

type SignupError = "name" | "email" | "password" | "match" | "exists";
const ERROR_KEY: Record<SignupError, TKey> = {
  name: "signup.errName",
  email: "signup.errEmail",
  password: "signup.errPassword",
  match: "signup.errMatch",
  exists: "signup.errExists",
};

function SignupPanel({ role, setRole, onDone, onSwitch }: { role: Role; setRole: (r: Role) => void; onDone: (u: MockUser) => void; onSwitch: () => void }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<SignupError | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = (): SignupError | null => {
    if (name.trim().length < 2) return "name";
    if (!isValidEmail(email)) return "email";
    if (password.length < 6) return "password";
    if (password !== confirm) return "match";
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setBusy(true);
    const res = await registerAccount({ name, email, password, role });
    setBusy(false);
    if (!res.ok) return setError("exists");
    onDone(res.user);
  };

  const field = (key: SignupError) => ({
    "aria-invalid": error === key,
    "aria-describedby": error === key ? "auth-signup-error" : undefined,
  });
  const clear = () => setError(null);

  return (
    <div className="px-5 pb-5 pt-4 sm:px-7 sm:pt-5 short:pb-4 short:pt-3">
      <h1 className="text-[1.2rem] font-bold leading-snug tracking-tight text-monsoon-950 sm:text-[1.3rem]">{t("signup.title")}</h1>
      <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{t("signup.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-3.5 space-y-3 short:mt-2.5 short:space-y-2.5" noValidate>
        <div>
          <p className="mb-1 text-[12.5px] font-semibold text-slate-700">{t("login.role")}</p>
          <RoleSwitch id="signup-role" label={t("login.role")} value={role} onChange={setRole} />
        </div>
        <div>
          <Label htmlFor="signup-name">{t("signup.name")}</Label>
          <IconInput icon={User}>
            <input
              id="signup-name"
              autoComplete="name"
              value={name}
              maxLength={80}
              onChange={(e) => {
                setName(e.target.value);
                clear();
              }}
              placeholder={t("signup.namePlaceholder")}
              className={FIELD}
              {...field("name")}
            />
          </IconInput>
        </div>
        <div>
          <Label htmlFor="signup-email">{t("login.email")}</Label>
          <IconInput icon={Mail}>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clear();
              }}
              placeholder="name@example.com"
              className={FIELD}
              aria-invalid={error === "email" || error === "exists"}
              aria-describedby={error === "email" || error === "exists" ? "auth-signup-error" : undefined}
            />
          </IconInput>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="signup-password">{t("login.password")}</Label>
            <PasswordInput
              id="signup-password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                clear();
              }}
              placeholder={t("signup.passwordHint")}
              invalid={error === "password"}
              describedBy={error === "password" ? "auth-signup-error" : undefined}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="signup-confirm">{t("signup.confirm")}</Label>
            <PasswordInput
              id="signup-confirm"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                clear();
              }}
              placeholder="••••••"
              invalid={error === "match"}
              describedBy={error === "match" ? "auth-signup-error" : undefined}
              autoComplete="new-password"
            />
          </div>
        </div>
        <AnimatePresence initial={false}>
          {error && (
            <ErrorNote id="auth-signup-error">
              {t(ERROR_KEY[error])}
              {error === "exists" && (
                <>
                  {" "}
                  <button type="button" onClick={onSwitch} className="font-semibold underline underline-offset-2">
                    {t("login.tabLogin")}
                  </button>
                </>
              )}
            </ErrorNote>
          )}
        </AnimatePresence>
        <SubmitButton busy={busy} icon={UserPlus}>
          {t("signup.submit")}
        </SubmitButton>
        <p className="text-center text-[13px] text-slate-500">
          {t("signup.haveAccount")}{" "}
          <button type="button" onClick={onSwitch} className="font-semibold text-leaf-700 underline-offset-2 hover:underline">
            {t("login.tabLogin")}
          </button>
        </p>
      </form>
    </div>
  );
}

/* ================================================================
 * One-click demo entry + credential hint
 * ================================================================ */

function DemoPanel({ onDemo, onFill }: { onDemo: (r: Role) => void; onFill: (c: (typeof DEMO_CREDENTIALS)[number]) => void }) {
  const { t } = useT();
  const buttons = [
    { role: "farmer" as Role, label: t("login.demoFarmer"), sub: t("login.demoFarmerSub"), icon: Leaf, tile: "from-leaf-500 to-leaf-700", card: "hover:border-leaf-300 hover:bg-leaf-50/80", title: "text-leaf-900" },
    { role: "officer" as Role, label: t("login.demoOfficer"), sub: t("login.demoOfficerSub"), icon: Users, tile: "from-monsoon-400 to-monsoon-700", card: "hover:border-monsoon-300 hover:bg-monsoon-50/80", title: "text-monsoon-900" },
  ];

  return (
    <div className="flex flex-col gap-2.5 border-t border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-white/40 px-5 pb-4 pt-3 sm:px-7 short:gap-2 short:pb-3 short:pt-2.5">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <span className="h-px flex-1 bg-slate-200" aria-hidden />
        {t("landing.orDemo")}
        <span className="h-px flex-1 bg-slate-200" aria-hidden />
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {buttons.map((b) => (
          <motion.button
            key={b.role}
            type="button"
            onClick={() => onDemo(b.role)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`group flex w-full items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-left short:py-1.5 shadow-soft transition-colors ${b.card}`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft ${b.tile}`}>
              <b.icon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-bold leading-snug ${b.title}`}>{b.label}</span>
              <span className="block truncate text-[11.5px] leading-snug text-slate-500">{b.sub}</span>
            </span>
            <ChevronRight className="h-4.5 w-4.5 shrink-0 text-slate-400 transition duration-300 group-hover:translate-x-0.5 group-hover:text-slate-600" aria-hidden />
          </motion.button>
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-sun-300 bg-sun-50/80 px-3 py-2">
        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-sun-600">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-sun-100">
            <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </span>
          {t("login.hint")}
        </p>
        <ul className="grid gap-1.5 font-mono text-[10.5px] leading-relaxed text-slate-600 sm:grid-cols-2">
          {DEMO_CREDENTIALS.map((c) => (
            <li key={c.email}>
              {/* Click to fill the form above */}
              <button type="button" onClick={() => onFill(c)} className="w-full rounded-lg bg-white/70 px-2 py-0.5 text-left leading-snug ring-1 ring-sun-100 transition hover:bg-white hover:ring-sun-300">
                <span className="font-sans text-[10.5px] font-semibold text-slate-700">{c.role === "farmer" ? t("login.farmer") : t("login.officer")}</span>
                <br />
                {c.email} / {c.password}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
