import { useState } from "react";
import styled from "styled-components";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "../AccountContext.jsx";
import {
  AuthShell,
  AuthIntro,
  AuthNote,
  Form,
  Field,
  FieldRow,
  FormError,
  Submit,
  FieldLabel,
  Input,
  FieldError,
  Required,
  H1,
  LeadMd
} from "../../../shared/ui/accountForms.js";

const EMPTY = { first_name: "", last_name: "", email: "", password: "", website: "" };

/** Kept in the layout but out of reach — see the note at its use site. */
const Honeypot = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

/**
 * Mirrors WooCommerce's own password rules so the shopper is not told a
 * password is too weak only after the round trip.
 */
function passwordProblem(password) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one capital letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/\d/.test(password)) return "Include at least one number.";
  return "";
}

export default function Signup() {
  const { register, busy } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const redirect = location.state?.from ?? "/account";

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!values.first_name.trim()) nextErrors.first_name = "Enter your first name.";
    if (!values.last_name.trim()) nextErrors.last_name = "Enter your last name.";
    if (!values.email.trim()) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
      nextErrors.email = "That doesn't look like a valid email address.";
    }

    const passwordError = passwordProblem(values.password);
    if (passwordError) nextErrors.password = passwordError;

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setError("");

    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        website: values.website
      });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || "We couldn't create your account. Please try again.");
    }
  }

  return (
    <AuthShell as="main" className="page">
      <AuthIntro>
        <H1>Create account</H1>
        <LeadMd $weight={400}>
          Save your details for a quicker checkout and keep every order in one place.
        </LeadMd>
      </AuthIntro>

      <Form onSubmit={handleSubmit} noValidate>
        {error ? <FormError role="alert">{error}</FormError> : null}

        <FieldRow>
          <Field>
            <FieldLabel htmlFor="signup-first">
              First name <Required aria-hidden="true">*</Required>
            </FieldLabel>
            <Input
              id="signup-first"
              name="first_name"
              value={values.first_name}
              onChange={update("first_name")}
              autoComplete="given-name"
              autoFocus
              aria-invalid={Boolean(fieldErrors.first_name)}
            />
            {fieldErrors.first_name ? <FieldError>{fieldErrors.first_name}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="signup-last">
              Last name <Required aria-hidden="true">*</Required>
            </FieldLabel>
            <Input
              id="signup-last"
              name="last_name"
              value={values.last_name}
              onChange={update("last_name")}
              autoComplete="family-name"
              aria-invalid={Boolean(fieldErrors.last_name)}
            />
            {fieldErrors.last_name ? <FieldError>{fieldErrors.last_name}</FieldError> : null}
          </Field>
        </FieldRow>

        <Field>
          <FieldLabel htmlFor="signup-email">
            Email <Required aria-hidden="true">*</Required>
          </FieldLabel>
          <Input
            id="signup-email"
            type="email"
            name="email"
            value={values.email}
            onChange={update("email")}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-password">
            Password <Required aria-hidden="true">*</Required>
          </FieldLabel>
          <Input
            id="signup-password"
            type="password"
            name="password"
            value={values.password}
            onChange={update("password")}
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="signup-password-hint"
          />
          <FieldError id="signup-password-hint">
            {fieldErrors.password || "At least 8 characters, with a capital, a lowercase and a number."}
          </FieldError>
        </Field>

        {/* Honeypot: off-screen and hidden from assistive tech, so only a bot
            that fills every input will ever set it. */}
        <Honeypot aria-hidden="true">
          <label htmlFor="signup-website">Website</label>
          <input
            id="signup-website"
            type="text"
            name="website"
            value={values.website}
            onChange={update("website")}
            tabIndex={-1}
            autoComplete="off"
          />
        </Honeypot>

        <Submit type="submit" $large disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Submit>
      </Form>

      <AuthNote>
        Already have an account?{" "}
        <Link to="/login" state={location.state}>
          Sign in
        </Link>{" "}
        — or <Link to="/checkout">check out as a guest</Link>, no account needed.
      </AuthNote>
    </AuthShell>
  );
}
