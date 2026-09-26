import { useState } from "react";
import styled from "styled-components";
import { useCart } from "../../features/cart/CartContext.jsx";
import { MinusIcon, PlusIcon } from "./Icons.jsx";

const Wrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 140px;
`;

const StepBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 ${({ $small }) => ($small ? "32px" : "48px")};
  width: ${({ $small }) => ($small ? "32px" : "48px")};
  height: ${({ $small }) => ($small ? "32px" : "48px")};
  border-radius: 50%;
  background: ${({ theme: t, disabled }) => (disabled ? t.color.grey100 : t.color.grey300)};
  color: ${({ theme: t, disabled }) => (disabled ? t.color.grey400 : t.color.cocoa)};
  transition: background-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover:not(:disabled) {
    background: ${({ theme: t }) => t.color.grey400};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const Value = styled.span`
  flex: 1 1 auto;
  text-align: center;
  font-size: 16px;
  letter-spacing: -0.32px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/**
 * Circular −/+ stepper. While a request is in flight the buttons disable so a
 * double-tap cannot queue up two conflicting quantities.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  label = "quantity",
  size = "md",
  disabled = false
}) {
  const { busy } = useCart();
  const [pending, setPending] = useState(false);
  const inflight = pending || busy.size > 0;
  const small = size === "sm";

  function commit(next) {
    const clamped = Math.max(min, Math.min(max, next));
    if (clamped === value) return;

    setPending(true);
    Promise.resolve(onChange?.(clamped)).finally(() => setPending(false));
  }

  return (
    <Wrap>
      <StepBtn
        type="button"
        $small={small}
        onClick={() => commit(value - 1)}
        disabled={disabled || inflight || value <= min}
        aria-label={`Decrement ${label} by 1`}
      >
        <MinusIcon size={small ? 10 : 12} />
      </StepBtn>

      <Value aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </Value>

      <StepBtn
        type="button"
        $small={small}
        onClick={() => commit(value + 1)}
        disabled={disabled || inflight || value >= max}
        aria-label={`Increment ${label} by 1`}
      >
        <PlusIcon size={small ? 10 : 12} />
      </StepBtn>
    </Wrap>
  );
}
