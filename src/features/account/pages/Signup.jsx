import { useRef, useState } from "react";
import styled from "styled-components";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "../AccountContext.jsx";
import { EyeIcon } from "../../../shared/ui/Icons.jsx";
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
  FieldHint,
  Required,
  H1,
  LeadMd
} from "../../../shared/ui/accountForms.js";

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirm: "",
  website: ""
};

/** Password input with a Show/Hide control, so a typo can be caught before
 *  submitting rather than after a failed round trip. */
const PasswordWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled(Input)`
  padding-right: 68px;
`;

const RevealButton = styled.button`
  position: absolute;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: none;
  color: ${({ theme: t }) => t.color.cavernous};
  cursor: pointer;

  &:hover {
    background: ${({ theme: t }) => t.color.grey200};
    color: ${({ theme: t }) => t.color.cocoa};
  }
`;


/** Kept in the layout but out of reach — see the note at its use site. */
const Honeypot = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

const PASSWORD_RULES = "At least 8 characters, with a capital, a lowercase and a number.";

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
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState({});
  const formRef = useRef(null);

  const redirect = location.state?.from ?? "/account";

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  function blur(field) {
    return () => setTouched((current) => ({ ...current, [field]: true }));
  }

  function toggleReveal(field) {
    return () => setRevealed((current) => ({ ...current, [field]: !current[field] }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

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

    if (!values.password_confirm) {
      nextErrors.password_confirm = "Re-enter your password.";
    } else if (values.password_confirm !== values.password) {
      nextErrors.password_confirm = "Those passwords don't match.";
    }

    setTouched({ first_name: true, last_name: true, email: true, password: true, password_confirm: true });

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      /* Bring the first problem into view — otherwise a required field further
         down the form blocks submit with the reason left off-screen. */
      const firstField = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => {
        const el = formRef.current?.querySelector(`[name="${firstField}"]`);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus?.({ preventScroll: true });
      });
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

  /* Only speak up about a field once it has been visited, so the form opens
     clean instead of looking like it is already rejecting everything. */
  const visited = (field) => touched[field] || submitted;
  const showPasswordError = visited("password") && Boolean(fieldErrors.password);
  // While there is something to check, name the rule that is still unmet. This
  // is a live region, so the shortfall is announced instead of only shown.
  const livePasswordProblem = values.password ? passwordProblem(values.password) : "";
  const showPasswordRules =
    visited("password") && !showPasswordError && !livePasswordProblem;
  const passwordNoteId = "signup-password-note";
  const hasPasswordNote = showPasswordError || Boolean(livePasswordProblem) || showPasswordRules;

  return (
    <AuthShell as="main" className="page">
      <AuthIntro>
        <H1>Create account</H1>
        <LeadMd $weight={400}>
          Save your details for a quicker checkout and keep every order in one place.
        </LeadMd>
      </AuthIntro>

      <Form ref={formRef} onSubmit={handleSubmit} noValidate>
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
          <PasswordWrap>
            <PasswordInput
              id="signup-password"
              type={revealed.password ? "text" : "password"}
              name="password"
              value={values.password}
              onChange={update("password")}
              onBlur={blur("password")}
              autoComplete="new-password"
              aria-invalid={showPasswordError}
              aria-describedby={hasPasswordNote ? passwordNoteId : undefined}
            />
            <RevealButton
              type="button"
              onClick={toggleReveal("password")}
              aria-pressed={Boolean(revealed.password)}
              aria-label={revealed.password ? "Hide password" : "Show password"}
            >
              <EyeIcon off={Boolean(revealed.password)} />
            </RevealButton>
          </PasswordWrap>
          {showPasswordError ? (
            <FieldError id={passwordNoteId} role="alert">
              {fieldErrors.password}
            </FieldError>
          ) : livePasswordProblem ? (
            <FieldHint id={passwordNoteId} aria-live="polite">
              {livePasswordProblem}
            </FieldHint>
          ) : showPasswordRules ? (
            <FieldHint id={passwordNoteId}>{PASSWORD_RULES}</FieldHint>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-password-confirm">
            Confirm password <Required aria-hidden="true">*</Required>
          </FieldLabel>
          <PasswordWrap>
            <PasswordInput
              id="signup-password-confirm"
              type={revealed.password_confirm ? "text" : "password"}
              name="password_confirm"
              value={values.password_confirm}
              onChange={update("password_confirm")}
              onBlur={blur("password_confirm")}
              autoComplete="new-password"
              aria-invalid={visited("password_confirm") && Boolean(fieldErrors.password_confirm)}
            />
            <RevealButton
              type="button"
              onClick={toggleReveal("password_confirm")}
              aria-pressed={Boolean(revealed.password_confirm)}
              aria-label={revealed.password_confirm ? "Hide password" : "Show password"}
            >
              <EyeIcon off={Boolean(revealed.password_confirm)} />
            </RevealButton>
          </PasswordWrap>
          {visited("password_confirm") && fieldErrors.password_confirm ? (
            <FieldError role="alert">{fieldErrors.password_confirm}</FieldError>
          ) : null}
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
