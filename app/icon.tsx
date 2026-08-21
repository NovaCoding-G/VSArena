import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Crisp favicon so Slack/HN do not inherit the 3D PNG mark.
 *
 * @example fetched as /icon
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#07080b",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        <span style={{ color: "#00AEEF" }}>V</span>
        <span style={{ color: "#F7941E" }}>S</span>
      </div>
    ),
    { ...size },
  );
}
