"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthCard } from "@/components/auth-card";
import card from "@/components/auth-card.module.css";
import { useI18n } from "@/components/i18n-provider";
import { ApiError, client } from "@/lib/api/client";
import type { Country, StoreUniqueResponse, Zone } from "@/lib/api/types";
import { isStrictEmail } from "@/lib/auth/login";
import { PASSWORD_PATTERN } from "@/lib/constants";

const emptyUser = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  repeatPassword: "",
  name: "",
  code: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  state: "",
};

export default function RegisterPage() {
  const { t } = useI18n();
  const [user, setUser] = useState(emptyUser);
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Zone[]>([]);
  const [showPass, setShowPass] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [isCodeUnique, setIsCodeUnique] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client
      .get("/v1/country")
      .then((data) => setCountries(data as Country[]))
      .catch(() => undefined);
  }, []);

  function patch<K extends keyof typeof emptyUser>(key: K, value: string) {
    setUser((current) => ({ ...current, [key]: value }));
  }

  async function onCountry(code: string) {
    patch("country", code);
    patch("state", "");
    setProvinces([]);
    if (!code) {
      return;
    }
    try {
      const zones = (await client.get("/v1/zones", { code })) as Zone[];
      setProvinces(zones);
    } catch {
      setErrorMessage(t("STORE_FORM.ERROR_STATE_PROVINCE"));
    }
  }

  async function checkCode(code: string) {
    setCodeTouched(true);
    if (!code) {
      setIsCodeUnique(false);
      return;
    }
    try {
      const res = (await client.get("/v1/store/unique", {
        code,
      })) as StoreUniqueResponse;
      setIsCodeUnique(!!res.exists);
    } catch {
      setIsCodeUnique(false);
    }
  }

  const emailInvalid = !!user.email && !isStrictEmail(user.email);
  const passwordInvalid = !!user.password && !PASSWORD_PATTERN.test(user.password);
  const passwordsMatch = user.password === user.repeatPassword;
  const formValid =
    !!user.firstName &&
    !!user.lastName &&
    isStrictEmail(user.email) &&
    PASSWORD_PATTERN.test(user.password) &&
    passwordsMatch &&
    !!user.name &&
    !!user.code &&
    !isCodeUnique &&
    !!user.address &&
    !!user.city &&
    !!user.postalCode &&
    !!user.country &&
    !!user.state;

  async function onRegister(event: React.FormEvent) {
    event.preventDefault();
    if (!formValid) {
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    const param = {
      address: user.address,
      city: user.city,
      code: user.code,
      country: user.country,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      password: user.password,
      postalCode: user.postalCode,
      repeatPassword: user.repeatPassword,
      stateProvince: user.state,
      url: `${window.location.origin}/`,
    };
    try {
      await client.post("/v1/store/signup", param);
      setSuccessMessage(
        `Your account is created successfully and email has been sent to ${user.email} with details on completing the new store signup`,
      );
      setUser(emptyUser);
      setProvinces([]);
      setIsCodeUnique(false);
    } catch (error) {
      if (error instanceof ApiError) {
        const body = error.body as { message?: string } | null;
        setErrorMessage(body?.message || t("COMMON.INTERNAL_SERVER_ERROR"));
      } else {
        setErrorMessage(t("COMMON.INTERNAL_SERVER_ERROR"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <form onSubmit={onRegister} noValidate>
        {errorMessage ? (
          <div className={`${card.banner} ${card.bannerError}`}>{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className={`${card.banner} ${card.bannerSuccess}`}>{successMessage}</div>
        ) : null}

        <p className={card.section}>Merchant administrator information</p>
        <Field label="First Name" name="firstName" value={user.firstName} onChange={patch} />
        <Field label="Last Name" name="lastName" value={user.lastName} onChange={patch} />

        <div className={card.field}>
          <label className={card.label} htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={card.input}
            placeholder="Email Address"
            value={user.email}
            onChange={(e) => patch("email", e.target.value)}
            required
          />
        </div>
        {!user.email ? (
          <p className={card.error}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_REQUIRED")}</p>
        ) : null}
        {emailInvalid ? (
          <p className={card.error}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_NOT_VALID")}</p>
        ) : null}

        <div className={card.field}>
          <label className={card.label} htmlFor="password">
            {t("LOGIN.PASSWORD")}
          </label>
          <div className={card.passwordWrap}>
            <input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              className={card.input}
              placeholder="Password"
              value={user.password}
              onChange={(e) => patch("password", e.target.value)}
              autoComplete="off"
              required
            />
            <button
              type="button"
              className={card.toggle}
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {!user.password ? (
          <p className={card.error}>{t("USER_CHANGE_PASSWORD.PASSWORD_ERROR_REQUIRED")}</p>
        ) : null}
        {passwordInvalid ? (
          <p className={card.error}>{t("USER_CHANGE_PASSWORD.PASSWORD_ERROR_RULES")}</p>
        ) : null}

        <div className={card.field}>
          <label className={card.label} htmlFor="repeatPassword">
            Repeat Password
          </label>
          <input
            id="repeatPassword"
            name="repeatPassword"
            type={showPass ? "text" : "password"}
            className={card.input}
            placeholder="Password"
            value={user.repeatPassword}
            onChange={(e) => patch("repeatPassword", e.target.value)}
            autoComplete="off"
            required
          />
        </div>
        {user.repeatPassword && !passwordsMatch ? (
          <p className={card.error}>{t("USER_CHANGE_PASSWORD.PASSWORDS_NOT_MATCH")}</p>
        ) : null}

        <p className={card.section}>Store information</p>
        <Field label="Store name" name="name" value={user.name} onChange={patch} />

        <div className={card.field}>
          <label className={card.label} htmlFor="code">
            Unique Store Code
          </label>
          <input
            id="code"
            name="code"
            className={card.input}
            placeholder="Unique Store Code"
            value={user.code}
            onChange={(e) => patch("code", e.target.value)}
            onBlur={(e) => checkCode(e.target.value)}
            required
          />
        </div>
        {codeTouched && !user.code ? (
          <p className={card.error}>{t("COMMON.CODE_REQUIRED")}</p>
        ) : null}
        {isCodeUnique ? (
          <p className={card.error}>{t("COMMON.CODE_EXISTS")}</p>
        ) : null}

        <Field
          label={t("STORE_FORM.ADDRESS")}
          name="address"
          value={user.address}
          onChange={patch}
        />
        <Field label={t("STORE_FORM.CITY")} name="city" value={user.city} onChange={patch} />
        <Field
          label={t("STORE_FORM.POSTAL_CODE")}
          name="postalCode"
          value={user.postalCode}
          onChange={patch}
        />

        <div className={card.field}>
          <label className={card.label} htmlFor="country">
            {t("STORE_FORM.COUNTRY")}
          </label>
          <select
            id="country"
            name="country"
            className={card.select}
            value={user.country}
            onChange={(e) => onCountry(e.target.value)}
            required
          >
            <option value="">{t("STORE_FORM.COUNTRY")}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className={card.field}>
          <label className={card.label} htmlFor="state">
            {t("STORE_FORM.STATE_PROVINCE")}
          </label>
          <select
            id="state"
            name="state"
            className={card.select}
            value={user.state}
            onChange={(e) => patch("state", e.target.value)}
            required
          >
            <option value="">{t("STORE_FORM.STATE_PROVINCE")}</option>
            {provinces.map((zone) => (
              <option key={zone.code} value={zone.code}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={card.button} disabled={!formValid || loading}>
          Register
        </button>
        <p className={card.footer}>
          Already have an account?{" "}
          <Link href="/auth" className={card.link}>
            Login
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: keyof typeof emptyUser;
  value: string;
  onChange: (key: keyof typeof emptyUser, value: string) => void;
}) {
  return (
    <div className={card.field}>
      <label className={card.label} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={card.input}
        value={value}
        placeholder={label}
        onChange={(e) => onChange(name, e.target.value)}
        required
      />
    </div>
  );
}
