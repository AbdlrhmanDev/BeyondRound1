import React from "react";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "nodejs",
};

export default async function handler(_req: unknown, res: unknown): Promise<void> {
  const resObj = res as { status: (n: number) => { setHeader: (k: string, v: string) => unknown; send: (b: Buffer) => unknown }; setHeader: (k: string, v: string) => unknown; send: (b: Buffer) => unknown };
  try {
    const element = React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1729 0%, #1e293b 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
      },
      React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          border: "2px solid #E67E22",
          borderRadius: 24,
          backgroundColor: "rgba(255,255,255,0.03)",
        },
      },
        React.createElement("div", {
          style: {
            fontSize: 72,
            fontWeight: 700,
            color: "white",
            marginBottom: 16,
          },
        }, "BeyondRounds"),
        React.createElement("div", {
          style: {
            fontSize: 32,
            fontWeight: 500,
            color: "#F5A623",
            marginBottom: 24,
          },
        }, "Where Doctors Become Friends"),
        React.createElement("div", {
          style: {
            fontSize: 24,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
          },
        }, "A premium social club for verified medical professionals")
      )
    );

    const response = new ImageResponse(element, {
      width: 1200,
      height: 630,
    });

    const buffer = await response.arrayBuffer();
    resObj
      .status(200)
      .setHeader("Content-Type", "image/png")
      .setHeader("Cache-Control", "public, max-age=31536000, immutable")
      .send(Buffer.from(buffer));
  } catch {
    resObj.status(500).send(Buffer.from("Failed to generate image", "utf-8"));
  }
}
