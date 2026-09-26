import { useId, useState } from "react";
import styled from "styled-components";
import { ArrowIcon } from "./Icons.jsx";
import {
  AccordionRoot,
  AccordionTrigger,
  AccordionIcon,
  AccordionPanel,
  AccordionContent,
  SubSm,
  BodySm,
  ButtonLink
} from "./primitives.js";

/* =============================================================
   Accordion
   ============================================================= */

/** Uppercase label + chevron disclosure that grows a panel to full height. */
export function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <AccordionRoot>
      <h3>
        <AccordionTrigger
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{title}</span>
          <AccordionIcon aria-hidden="true" />
        </AccordionTrigger>
      </h3>

      <AccordionPanel id={id} $open={open} role="region">
        <div>
          <AccordionContent>{children}</AccordionContent>
        </div>
      </AccordionPanel>
    </AccordionRoot>
  );
}

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

/** FAQ-style list where each row is a standalone question. */
export function DisclosureList({ items }) {
  return (
    <List>
      {items.map((item) => (
        <Accordion key={item.question} title={item.question}>
          {item.answer}
        </Accordion>
      ))}
    </List>
  );
}

/* =============================================================
   Email capture
   ============================================================= */

const Capture = styled.form`
  width: 100%;
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid ${({ theme: t }) => t.color.cavernous};
`;

const CaptureInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 2px;
  background: transparent;
  border: 0;
  color: ${({ theme: t }) => t.color.cocoa};
  font-size: 14px;

  &::placeholder {
    color: ${({ theme: t }) => t.color.sonicSilver};
  }

  &:focus {
    outline: none;
  }
`;

const Submit = styled(ButtonLink)`
  flex: 0 0 auto;
`;

const ErrorText = styled.p`
  margin-top: 8px;
  font-size: 12px;
  color: ${({ theme: t }) => t.color.rust};
`;

const Sub = styled(BodySm)`
  margin-bottom: 10px;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

/** Newsletter / promo capture with an inline success state. */
export function EmailCapture({
  onSubmit,
  placeholder = "Email",
  submitLabel = "Send",
  subhead
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | invalid | busy | done
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setState("invalid");
      setMessage("Enter a valid email address.");
      return;
    }

    setState("busy");

    try {
      await onSubmit?.(email.trim());
      setState("done");
    } catch (err) {
      setState("invalid");
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <Sub role="status" as={SubSm} $size="subheaderSm">
        Success. You’re on the list!
      </Sub>
    );
  }

  return (
    <Capture onSubmit={handleSubmit} noValidate aria-describedby={subhead ? id : undefined}>
      {subhead ? <Sub id={id}>{subhead}</Sub> : null}

      <Group>
        <CaptureInput
          type="email"
          name="email"
          value={email}
          placeholder={placeholder}
          autoComplete="email"
          aria-label={placeholder}
          aria-invalid={state === "invalid"}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state === "invalid") setState("idle");
          }}
        />
        <Submit type="submit" disabled={state === "busy"}>
          <span>{submitLabel}</span>
          <ArrowIcon size={14} />
        </Submit>
      </Group>

      {state === "invalid" ? <ErrorText role="alert">{message}</ErrorText> : null}
    </Capture>
  );
}
