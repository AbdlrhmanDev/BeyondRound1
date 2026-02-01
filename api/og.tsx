import React from "react";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1729 0%, #1e293b 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
            border: "2px solid #E67E22",
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "white",
              marginBottom: 16,
            }}
          >
            BeyondRounds
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: "#F5A623",
              marginBottom: 24,
            }}
          >
            Where Doctors Become Friends
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
            }}
          >
            A premium social club for verified medical professionals
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
