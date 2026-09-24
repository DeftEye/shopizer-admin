export const APP_MODES = ["STANDARD", "MARKETPLACE", "BTB"] as const;

export type AppMode = (typeof APP_MODES)[number];

export type AppEnv = {
  shopizerApiUrl: string;
  shopizerShippingApiUrl: string;
  mode: AppMode;
  defaultLang: string;
  langs: string[];
};

function isAppMode(value: string): value is AppMode {
  return (APP_MODES as readonly string[]).includes(value);
}

export function readEnv(): AppEnv {
  const modeRaw = process.env.NEXT_PUBLIC_MODE ?? "STANDARD";

  return {
    shopizerApiUrl: process.env.SHOPIZER_API_URL ?? "http://localhost:8080/api",
    shopizerShippingApiUrl:
      process.env.SHOPIZER_SHIPPING_API_URL ??
      "http://localhost:9090/shipping/api/v1",
    mode: isAppMode(modeRaw) ? modeRaw : "STANDARD",
    defaultLang: process.env.NEXT_PUBLIC_DEFAULT_LANG ?? "en",
    langs: (process.env.NEXT_PUBLIC_LANGS ?? "en,fr")
      .split(",")
      .map((lang) => lang.trim())
      .filter(Boolean),
  };
}
