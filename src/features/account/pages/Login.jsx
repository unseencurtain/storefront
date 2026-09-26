import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "../AccountContext.jsx";
import {
  AuthShell,
  AuthIntro,
  AuthNote,
  Form,
  Field,
  FormError,
  Submit,
  FieldLabel,
  Input,
  FieldError,
  H1,
  LeadMd
} from "../../../shared/ui/accountForms.js";

export default function Login() {
  const { signIn, busy } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Return the shopper to whatever they were doing, defaulting to the account.
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
    if (!values.email.trim()) nextErrors.email = "Enter your email address.";
    if (!values.password) nextErrors.password = "Enter your password.";

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setError("");

    try {
      await signIn({ email: values.email.trim(), password: values.password });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || "We couldn't sign you in. Please try again.");
    }
  }

  return (
    <AuthShell as="main" className="page">
      <AuthIntro>
        <H1>Sign in</H1>
        <LeadMd $weight={400}>
          Access your orders, saved details and a faster checkout.
        </LeadMd>
      </AuthIntro>

      <Form onSubmit={handleSubmit} noValidate>
        {error ? <FormError role="alert">{error}</FormError> : null}

        <Field>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            name="email"
            value={values.email}
            onChange={update("email")}
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
          {fieldErrors.email ? <FieldError id="login-email-error">{fieldErrors.email}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <Input
            id="login-password"
            type="password"
            name="password"
            value={values.password}
            onChange={update("password")}
            autoComplete="current-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
          />
          {fieldErrors.password ? (
            <FieldError id="login-password-error">{fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        <Submit type="submit" $large disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Submit>
      </Form>

      <AuthNote>
        New here?{" "}
        <Link to="/signup" state={location.state}>
          Create an account
        </Link>{" "}
        — or <Link to="/checkout">check out as a guest</Link>, no account needed.
      </AuthNote>
    </AuthShell>
  );
}
