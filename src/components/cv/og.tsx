import { ImageResponse } from "next/og";
import { CV_NAME } from "@/content/cv";

export const CV_OG_SIZE = { width: 1200, height: 630 };

/** Text-only social card shared by every CV route. */
export function cvOgImage(eyebrow: string, headline: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f8fc",
          padding: "72px 80px",
          color: "#0c2546",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#1f56d8" }}>
          {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05 }}>{CV_NAME}</div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.3, color: "#2b3b55" }}>{headline}</div>
        </div>
        <div style={{ display: "flex", height: 6, width: 160, background: "#0c2546" }} />
      </div>
    ),
    CV_OG_SIZE,
  );
}
