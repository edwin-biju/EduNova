"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const rolesList = [
  { id: "admin",   label: "Admin",   sub: "Full system control" },
  { id: "teacher", label: "Teacher", sub: "Classes & grades"    },
  { id: "student", label: "Student", sub: "My learning hub"     },
  { id: "parent",  label: "Parent",  sub: "Track progress"      },
];

const ALL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; color: #1a1a1a; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── LANDING ── */
  .landing-root {
    min-height: 100vh; display: flex; flex-direction: column;
    background: linear-gradient(145deg, #fffbe6 0%, #fff9d0 20%, #ffffff 60%, #fafaf7 100%);
  }

  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: rgba(255,251,230,0.88); backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(245,216,0,0.2); position: sticky; top: 0; z-index: 50;
  }
  .nav-brand {
    font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900;
    color: #111; letter-spacing: -0.5px;
  }
  .nav-btn {
    background: #111; color: #fff; font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 600; padding: 9px 22px;
    border-radius: 8px; border: none; cursor: pointer;
    transition: background 0.18s, transform 0.12s;
  }
  .nav-btn:hover { background: #2a2a2a; transform: translateY(-1px); }

  .hero {
    flex: 1; max-width: 1080px; width: 100%; margin: 0 auto;
    padding: 100px 48px 72px;
    display: flex; flex-direction: column; align-items: flex-start;
  }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: #555; margin-bottom: 28px; animation: fadeUp 0.45s ease both;
  }
  .hero-eyebrow-bar { width: 28px; height: 2.5px; background: #F5D800; border-radius: 2px; }

  .hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(48px, 6.5vw, 80px); font-weight: 900;
    line-height: 1.0; color: #111; letter-spacing: -2.5px; max-width: 760px;
    animation: fadeUp 0.45s 0.07s ease both;
  }
  .hero-title-highlight {
    display: inline-block; background: #F5D800; color: #111;
    padding: 2px 14px; border-radius: 6px;
  }
  .hero-sub {
    margin-top: 28px; font-size: 16px; line-height: 1.8; color: #666;
    max-width: 460px; font-weight: 500; animation: fadeUp 0.45s 0.14s ease both;
  }
  .hero-actions {
    margin-top: 40px; animation: fadeUp 0.45s 0.2s ease both;
  }
  .btn-black {
    background: #111; color: #fff; font-family: 'Inter', sans-serif;
    font-size: 14px; font-weight: 700; padding: 14px 32px;
    border-radius: 8px; border: none; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
  }
  .btn-black:hover { background: #222; box-shadow: 0 10px 28px rgba(0,0,0,0.16); transform: translateY(-2px); }

  .stats-strip { width: 100%; background: #111; margin-top: 72px; animation: fadeUp 0.45s 0.26s ease both; }
  .stats-inner {
    max-width: 1080px; margin: 0 auto; padding: 0 48px;
    display: grid; grid-template-columns: repeat(4, 1fr);
  }
  .stat-item {
    padding: 32px 0 32px 28px; border-right: 1px solid #252525;
    display: flex; flex-direction: column; gap: 5px;
  }
  .stat-item:first-child { padding-left: 0; }
  .stat-item:last-child { border-right: none; }
  .stat-num { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 900; color: #F5D800; letter-spacing: -1px; line-height: 1; }
  .stat-label { font-size: 12px; font-weight: 600; color: #555; letter-spacing: 0.3px; }

  .site-footer {
    border-top: 1px solid rgba(245,216,0,0.15); background: rgba(255,251,230,0.5);
    padding: 22px 48px; display: flex; align-items: center; justify-content: space-between;
  }
  .site-footer-brand { font-family: 'Fraunces', serif; font-size: 14px; font-weight: 900; color: #111; }
  .site-footer-copy { font-size: 12px; color: #B0B0B0; font-weight: 500; }

  @media (max-width: 768px) {
    .nav { padding: 0 20px; }
    .hero { padding: 56px 20px 48px; align-items: center; text-align: center; }
    .hero-eyebrow { align-self: center; }
    .hero-title { font-size: 46px; letter-spacing: -1.5px; }
    .stats-inner { grid-template-columns: repeat(2, 1fr); }
    .stat-item { border-bottom: 1px solid #252525; }
    .site-footer { flex-direction: column; gap: 6px; text-align: center; padding: 18px 20px; }
  }

  /* ── LOGIN ── */
  .login-root {
    min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
    background: linear-gradient(145deg, #fffbe6 0%, #fff9d0 20%, #ffffff 60%, #fafaf7 100%);
  }

  .login-left {
    background: #111; display: flex; flex-direction: column;
    justify-content: space-between; padding: 52px;
    position: relative; overflow: hidden;
  }
  .ll-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: #F5D800; }
  .ll-circle {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(245,216,0,0.09) 0%, transparent 70%);
    top: -100px; right: -100px; pointer-events: none;
  }
  .ll-circle2 {
    position: absolute; width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
    bottom: 80px; left: -60px; pointer-events: none;
  }
  .ll-brand {
    font-family: 'Fraunces', serif; font-size: 20px; font-weight: 900;
    color: #fff; letter-spacing: -0.4px; position: relative; z-index: 1;
  }
  .ll-copy { position: relative; z-index: 1; }
  .ll-quote {
    font-family: 'Fraunces', serif; font-size: clamp(30px, 3.5vw, 46px);
    font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 18px;
  }
  .ll-quote-yellow { color: #F5D800; }
  .ll-tagline { font-size: 13px; color: #555; font-weight: 500; line-height: 1.7; max-width: 280px; }
  .ll-dots { display: flex; gap: 10px; position: relative; z-index: 1; }
  .ll-dot { width: 32px; height: 4px; border-radius: 2px; background: #2a2a2a; }
  .ll-dot.active { background: #F5D800; }

  .login-right {
    display: flex; align-items: center; justify-content: center; padding: 48px;
  }
  .login-card { width: 100%; max-width: 400px; display: flex; flex-direction: column; animation: fadeUp 0.4s ease both; }

  .step-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #B0B0B0; margin-bottom: 10px; }
  .step-title { font-family: 'Fraunces', serif; font-size: 40px; font-weight: 900; color: #111; letter-spacing: -1.5px; line-height: 1.05; margin-bottom: 6px; }
  .step-sub { font-size: 13px; color: #999; font-weight: 500; }

  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 28px 0 16px; }
  .role-card {
    padding: 20px 18px; border-radius: 12px; border: 2px solid #E8E8E8;
    background: #fff; cursor: pointer; text-align: left;
    display: flex; flex-direction: column; gap: 3px; position: relative; overflow: hidden;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s;
  }
  .role-card:hover {
    border-color: #F5D800; background: #FFFDE7;
    box-shadow: 0 6px 20px rgba(245,216,0,0.18); transform: translateY(-2px);
  }
  .role-card-top-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #F5D800;
    transform: scaleX(0); transform-origin: left; transition: transform 0.2s ease;
  }
  .role-card:hover .role-card-top-bar { transform: scaleX(1); }
  .role-card-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: #111; }
  .role-card-sub { font-size: 11.5px; color: #AAA; font-weight: 500; }
  .role-card-arrow {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    font-size: 14px; color: #ddd; transition: color 0.15s, transform 0.15s;
  }
  .role-card:hover .role-card-arrow { color: #111; transform: translateY(-50%) translateX(3px); }

  .back-btn {
    background: none; border: none; font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 700; color: #BBB; cursor: pointer;
    display: flex; align-items: center; gap: 4px; padding: 0; transition: color 0.15s;
  }
  .back-btn:hover { color: #333; }

  .role-chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; padding: 5px 12px 5px 8px;
    border-radius: 6px; margin-top: 10px;
    background: #FFFDE7; border: 1.5px solid #F5D800; color: #111;
  }
  .role-chip-dot { width: 7px; height: 7px; border-radius: 50%; background: #F5D800; }

  .form-section { display: flex; flex-direction: column; gap: 14px; margin-top: 28px; }
  .field-group { display: flex; flex-direction: column; gap: 6px; }
  .field-lbl { font-size: 11px; font-weight: 700; color: #999; letter-spacing: 1px; text-transform: uppercase; }
  .field-in {
    padding: 13px 14px; border: 2px solid #E8E8E8; border-radius: 10px;
    font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif;
    background: #fff; color: #111; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .field-in::placeholder { color: #CCC; }
  .field-in:focus { border-color: #F5D800; box-shadow: 0 0 0 4px rgba(245,216,0,0.15); }
  .field-err { font-size: 11.5px; color: #E03131; font-weight: 600; }
  .g-error {
    background: #FFF5F5; border: 1.5px solid #FFCDD2; color: #C62828;
    font-size: 12px; font-weight: 700; padding: 10px 14px; border-radius: 8px; text-align: center;
  }

  .submit-btn {
    width: 100%; padding: 15px; border-radius: 10px; border: none;
    background: #111; color: #fff; font-family: 'Inter', sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s; margin-top: 6px;
  }
  .submit-btn:hover { background: #222; box-shadow: 0 10px 28px rgba(0,0,0,0.18); transform: translateY(-1px); }
  .submit-btn:active { transform: scale(0.98); }

  .login-footer { margin-top: 32px; font-size: 11px; color: #CCC; text-align: center; font-weight: 600; }

  @media (max-width: 768px) {
    .login-root { grid-template-columns: 1fr; }
    .login-left { display: none; }
    .login-right { padding: 40px 24px; align-items: flex-start; }
  }
`;

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [view, setView] = useState<"landing" | "login">("landing");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const role = user?.publicMetadata.role;
      if (role) router.push(`/${role}`);
    }
  }, [isLoaded, isSignedIn, user, router]);

  const activeRole = rolesList.find((r) => r.id === selectedRole);

  return (
    <>
      <style suppressHydrationWarning>{ALL_STYLES}</style>

      {view === "landing" ? (
        <div className="landing-root">
          <header className="nav">
            <div className="nav-brand">EduNova</div>
            <button className="nav-btn" onClick={() => setView("login")}>Sign in →</button>
          </header>

          <main className="hero">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-bar" />
              School Management Platform
            </div>
            <h1 className="hero-title">
              Every class.<br />
              Every grade.<br />
              <span className="hero-title-highlight">One place.</span>
            </h1>
            <p className="hero-sub">
              EduNova connects teachers, students, parents, and administrators under a single secure platform. Manage timetables, track attendance, and monitor progress effortlessly.
            </p>
            <div className="hero-actions">
              <button className="btn-black" onClick={() => setView("login")}>Access Portal</button>
            </div>
          </main>

          <div className="stats-strip">
            <div className="stats-inner">
              {[
                { num: "4",       label: "User Roles" },
                { num: "Demo",    label: "Project Build" },
                { num: "v1.0",    label: "Current Version" },
                { num: "Next.js", label: "Powered By" },
              ].map((s) => (
                <div className="stat-item" key={s.label}>
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <footer className="site-footer">
            <span className="site-footer-brand">EduNova</span>
            <span className="site-footer-copy">© {new Date().getFullYear()} · School Management Demo</span>
          </footer>
        </div>

      ) : (
        <div className="login-root">
          <div className="login-left">
            <div className="ll-top-bar" />
            <div className="ll-circle" />
            <div className="ll-circle2" />
            <div className="ll-brand">EduNova</div>
            <div className="ll-copy">
              <div className="ll-quote">
                Built for<br />
                <span className="ll-quote-yellow">schools</span><br />
                that move fast.
              </div>
              <p className="ll-tagline">
                A unified dashboard for every role in your institution — from admin to student.
              </p>
            </div>
            <div className="ll-dots">
              {[0,1,2,3].map((i) => (
                <div key={i} className={`ll-dot${i === 0 ? " active" : ""}`} />
              ))}
            </div>
          </div>

          <div className="login-right">
            <div className="login-card">
              {!selectedRole ? (
                <>
                  <div className="step-label">Portal Access</div>
                  <div className="step-title">Who are<br />you?</div>
                  <p className="step-sub">Pick your role to reach your dashboard.</p>
                  <div className="role-grid">
                    {rolesList.map((role) => (
                      <button key={role.id} className="role-card" onClick={() => setSelectedRole(role.id)}>
                        <div className="role-card-top-bar" />
                        <span className="role-card-name">{role.label}</span>
                        <span className="role-card-sub">{role.sub}</span>
                        <span className="role-card-arrow">→</span>
                      </button>
                    ))}
                  </div>
                  <button className="back-btn" onClick={() => setView("landing")}>← Back to homepage</button>
                </>
              ) : (
                <>
                  <div className="step-label">Sign in</div>
                  <div className="step-title">Welcome<br />back.</div>
                  <div className="role-chip">
                    <div className="role-chip-dot" />
                    {activeRole?.label} Portal
                  </div>
                  <SignIn.Root>
                    <SignIn.Step name="start" className="form-section">
                      <button type="button" className="back-btn" onClick={() => setSelectedRole(null)}>
                        ← Change role
                      </button>
                      <Clerk.GlobalError className="g-error" />
                      <Clerk.Field name="identifier" className="field-group">
                        <Clerk.Label className="field-lbl">Username</Clerk.Label>
                        <Clerk.Input type="text" required className="field-in" placeholder={`${activeRole?.label ?? "Your"} username`} />
                        <Clerk.FieldError className="field-err" />
                      </Clerk.Field>
                      <Clerk.Field name="password" className="field-group">
                        <Clerk.Label className="field-lbl">Password</Clerk.Label>
                        <Clerk.Input type="password" required className="field-in" placeholder="••••••••" />
                        <Clerk.FieldError className="field-err" />
                      </Clerk.Field>
                      <SignIn.Action submit className="submit-btn">
                        Continue to Dashboard →
                      </SignIn.Action>
                    </SignIn.Step>
                  </SignIn.Root>
                </>
              )}
              <p className="login-footer">© {new Date().getFullYear()} EduNova · School Management Demo</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;