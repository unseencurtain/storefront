import styled from "styled-components";
import { mq } from "../../shared/styles/theme.js";
import {
  ContainerNarrow,
  H1,
  LeadMd,
  BodySm,
  Button,
  FieldLabel,
  Input,
  FieldError,
  FieldHint,
  FieldRow,
  Required,
  Select,
  UnderlineLink
} from "./primitives.js";

/* =============================================================
   Centred auth shell shared by /login and /signup
   ============================================================= */

export const AuthShell = styled(ContainerNarrow)`
  padding-top: 72px;
  padding-bottom: 120px;

  ${mq.lg} {
    padding-top: 40px;
    padding-bottom: 80px;
  }
`;

export const AuthIntro = styled.header`
  max-width: 460px;
  /* The 460px column is narrower than the shell, so it has to be centred
     itself or the heading and form sit off to the left. */
  margin-inline: auto;
  margin-bottom: 44px;

  ${H1} {
    margin-bottom: 14px;
  }
`;

export const AuthNote = styled(BodySm)`
  /* Keep the closing line inside the same 460px column as the form, otherwise
     it spans the shell and sits visibly left of the fields. */
  max-width: 460px;
  margin-inline: auto;
  margin-top: 28px;
  color: ${({ theme: t }) => t.color.sonicSilver};

  ${UnderlineLink} {
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.2px;
  }
`;

export const Form = styled.form`
  max-width: 460px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FormError = styled.p`
  padding: 12px 16px;
  border-left: 2px solid ${({ theme: t }) => t.color.rust};
  background: ${({ theme: t }) => t.color.dawnPink};
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/** `Button` carries `attrs({ type: "button" })`, and that value wins over a
 *  `type` prop passed at the call site — which left these forms with no submit
 *  control at all. Re-asserting it here keeps the button a real submit. */
export const Submit = styled(Button).attrs({ type: "submit" })`
  align-self: flex-start;
  min-width: 200px;
`;

export const CheckoutLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

export { FieldLabel, Input, FieldError, FieldHint, Required, FieldRow, H1, LeadMd, Select };
