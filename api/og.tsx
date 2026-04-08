import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const PERSONAS = [
  { initials: "EA", bg: "#d4a574", color: "#1c1412" },
  { initials: "UX", bg: "#5f90f1", color: "#ffffff" },
  { initials: "PM", bg: "#7c6f64", color: "#ffffff" },
  { initials: "BM", bg: "#a8b5a0", color: "#1c1412" },
  { initials: "A11", bg: "#c084fc", color: "#ffffff" },
];

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#1c1412",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top row: badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "rgba(95,144,241,0.15)",
              border: "1px solid rgba(95,144,241,0.35)",
              borderRadius: "100px",
              padding: "6px 16px",
              color: "#5f90f1",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            AI-Powered UX Research
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#f5f0eb",
              lineHeight: 1.05,
              letterSpacing: "-2px",
              display: "flex",
            }}
          >
            Synthetic Users Lab
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "rgba(245,240,235,0.6)",
              lineHeight: 1.4,
              maxWidth: "680px",
              display: "flex",
            }}
          >
            Simulate synthetic user personas against any product flow.
            Get UX scores, friction points and issues — without recruiting users.
          </div>
        </div>

        {/* Bottom row: avatars + domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Persona avatar cluster */}
          <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
            {PERSONAS.map((p, i) => (
              <div
                key={p.initials}
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: p.bg,
                  border: "2.5px solid #1c1412",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: p.color,
                  marginLeft: i === 0 ? "0" : "-10px",
                  zIndex: PERSONAS.length - i,
                  position: "relative",
                }}
              >
                {p.initials}
              </div>
            ))}
            <div
              style={{
                marginLeft: "16px",
                color: "rgba(245,240,235,0.5)",
                fontSize: "15px",
                display: "flex",
              }}
            >
              12+ personas
            </div>
          </div>

          {/* Domain */}
          <div
            style={{
              color: "rgba(245,240,235,0.4)",
              fontSize: "18px",
              fontWeight: 500,
              display: "flex",
            }}
          >
            synthetic-users-lab.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
