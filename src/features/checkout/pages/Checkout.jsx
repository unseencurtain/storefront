import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useAccount } from "../../account/AccountContext.jsx";
import { money } from "../../../shared/lib/format.js";
import { describeGateways } from "../../../shared/lib/gateways.js";
import { ArrowIcon, CheckIcon, BagIcon } from "../../../shared/ui/Icons.jsx";
import {
  BodyMd, BodySm, BodyXs, H1, H2, LeadMd, LeadSm, SubSm, SubXs
} from "../../../shared/ui/primitives.js";
import {
  AppliedCode, AppliedDetail, AppliedList, AppliedRemove, Assurance, Button,
  CheckoutGrid, CheckoutMain, CheckoutNav, CheckoutPage, CheckoutTop,
  CheckLabel, Confirmation, ConfirmationList, ContactSummary, EmptyState, ErrorBanner,
  Field, FieldError, FieldLabel, FieldRow, Input, InlineLink, Legal, Ledger,
  LedgerMuted, LedgerRow, Option, OptionBody, OptionDot, OptionList, OptionPrice,
  Panel, PanelHead, PromoForm, PromoInput, StepButton, StepDot, StepItem, Steps,
  Select, Summary, SummaryAside, SummaryItem, SummaryItems, SummaryNames,
  SummaryPrice, SummaryQty, SummaryThumb, TextLink, Textarea, Title, WordmarkSmall
} from "../checkout.css.js";

const STATES_US = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

const COUNTRIES = [
  { code: "US", name: "United States", states: STATES_US },
  { code: "CA", name: "Canada", states: [] },
  { code: "GB", name: "United Kingdom", states: [] },
  { code: "AU", name: "Australia", states: [] },
  { code: "DE", name: "Germany", states: [] },
  { code: "FR", name: "France", states: [] }
];

const STEPS = ["Information", "Shipping", "Payment"];

const EMPTY_ADDRESS = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "US",
  phone: "",
  email: ""
};

/**
 * Checkout.
 *
 * Three steps with a persistent order summary. Moving between steps pushes the
 * address into the cart so WooCommerce can quote real shipping, and the final
 * step hands off to the Store API's checkout endpoint.
 */
export default function Checkout() {
  const {
    cart,
    isEmpty,
    setAddress,
    chooseShippingRate,
    applyCoupon,
    removeCoupon,
    checkout,
    busy,
    error,
    clearError
  } = useCart();

  const [step, setStep] = useState(0);
  const [address, setAddressState] = useState(EMPTY_ADDRESS);
  const [rateKey, setRateKey] = useState("");
  const [payment, setPayment] = useState("");
  const [note, setNote] = useState("");
  const [placed, setPlaced] = useState(null);
  const [touched, setTouched] = useState({});
  const [promo, setPromo] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);

  const pending = busy.has("address") || busy.has("checkout");

  /** Field handlers send a single-key patch, so merge rather than replace. */
  const updateAddress = (patch) => setAddressState((current) => ({ ...current, ...patch }));

  // Seed from anything already in the cart.
  useEffect(() => {
    const existing = cart.billing_address ?? {};
    const shipping = cart.shipping_address ?? {};

    setAddressState((current) => ({
      ...current,
      ...Object.fromEntries(
        Object.entries({ ...shipping, ...existing }).filter(([, value]) => value)
      ),
      email: existing.email || current.email
    }));
  }, [cart.billing_address, cart.shipping_address]);

  // A signed-in shopper should not retype what we already hold. Only blank
  // fields are filled, so anything the cart or the shopper typed still wins.
  const { customer, isLoggedIn } = useAccount();

  useEffect(() => {
    if (!isLoggedIn) return;

    const saved = { ...(customer.shipping ?? {}), ...(customer.billing ?? {}) };

    setAddressState((current) => {
      const filled = {};

      for (const [key, value] of Object.entries(saved)) {
        if (!(key in current)) continue;
        if (!value) continue;
        if (current[key]) continue;
        filled[key] = value;
      }

      return Object.keys(filled).length ? { ...current, ...filled } : current;
    });
  }, [isLoggedIn, customer]);

  const states = useMemo(
    () => COUNTRIES.find((country) => country.code === address.country)?.states ?? [],
    [address.country]
  );

  const errors = useMemo(() => validate(address, step === 2), [address, step]);
  const invalid = Object.keys(errors).length > 0;

  const rates = useMemo(
    () =>
      (cart.shipping_rates ?? []).flatMap((entry) =>
        (entry.shipping_rates ?? []).map((rate) => ({
          ...rate,
          package_id: entry.package_id,
          meta: entry.meta_data ?? []
        }))
      ),
    [cart.shipping_rates]
  );

  // The cart only exposes gateway ids, so resolve them to displayable options.
  const gateways = useMemo(() => describeGateways(cart.payment_methods ?? []), [cart.payment_methods]);

  /**
   * Shipping rate and payment gateway are independent choices, so each keeps its
   * own state. A stored choice that has since disappeared falls back to the
   * first option, which also preselects for us without an extra render pass.
   */
  const rateKeys = rates.map((rate) => `${rate.package_id}:${rate.rate_id}`);
  const selectedRate = rateKeys.includes(rateKey) ? rateKey : (rateKeys[0] ?? "");
  const selectedPayment = gateways.some((option) => option.id === payment)
    ? payment
    : (gateways[0]?.id ?? "");

  async function goToShipping() {
    if (invalid) {
      setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])));
      return;
    }

    const result = await setAddress({
      ...address,
      state: address.state || (address.country === "US" ? "TX" : "")
    });

    if (result) setStep(1);
  }

  async function goToPayment() {
    if (invalid) {
      setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])));
      return;
    }

    const [packageId, rateId] = selectedRate.split(":");
    if (packageId && rateId) await chooseShippingRate(packageId, rateId);
    setStep(2);
  }

  async function submitPromo(event) {
    event.preventDefault();
    const code = promo.trim();
    if (!code || promoBusy) return;

    setPromoBusy(true);
    const result = await applyCoupon(code);
    setPromoBusy(false);

    if (result) setPromo("");
  }

  async function submit(event) {
    event.preventDefault();
    if (invalid || pending) {
      setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])));
      return;
    }

    // The checkout response carries no totals, so snapshot them before the cart
    // is emptied by a successful order.
    const totalsAtOrder = cart.totals ?? {};
    const paymentLabel = gateways.find((option) => option.id === selectedPayment)?.name;

    const result = await checkout({
      billingAddress: { ...address, email: address.email },
      shippingAddress: address,
      paymentMethod: selectedPayment || undefined,
      customerNote: note
    });

    if (!result) {
      clearError();
      return;
    }

    // Offline gateways complete immediately; card-style gateways need the shopper
    // sent to the gateway to finish authorizing before the order is confirmed.
    const payment = result.payment_result ?? {};
    if (payment.payment_status && payment.payment_status !== "success" && payment.redirect_url) {
      window.location.assign(payment.redirect_url);
      return;
    }

    setPlaced({ order: result, totals: totalsAtOrder, paymentLabel });
    window.scrollTo({ top: 0 });
  }

  if (placed) return <OrderConfirmation receipt={placed} />;

  if (isEmpty) {
    return (
      <EmptyState as="main">
        <BagIcon size={28} />
        <H2>Your bag is empty</H2>
        <BodySm $muted>Add something to your bag before checking out.</BodySm>
        <Button as={Link} to="/shop">
          Shop All
        </Button>
      </EmptyState>
    );
  }

  return (
    <CheckoutPage>
      <CheckoutGrid>
        <CheckoutMain>
          <CheckoutTop>
            <WordmarkSmall as={Link} to="/" aria-label="Cereve, home">
              CEREVE
            </WordmarkSmall>

            <TextLink as={Link} to="/cart">
              Back to bag
            </TextLink>
          </CheckoutTop>

          <div>
            <Title>Checkout</Title>
            <BodyXs $muted $session>
              {isLoggedIn ? (
                <>
                  Checking out as{" "}
                  <InlineLink as={Link} to="/account">
                    {customer.email}
                  </InlineLink>
                </>
              ) : (
                <>
                  Checking out as a guest.{" "}
                  <InlineLink as={Link} to="/login" state={{ from: "/checkout" }}>
                    Sign in
                  </InlineLink>{" "}
                  for faster checkout.
                </>
              )}
            </BodyXs>
          </div>

          <Steps aria-label="Checkout progress">
            {STEPS.map((label, index) => {
              const state = index < step ? "done" : index === step ? "current" : "todo";

              return (
                <StepItem key={label}>
                  <StepButton
                    type="button"
                    $state={state}
                    onClick={() => index < step && setStep(index)}
                    disabled={index > step}
                  >
                    <StepDot $state={state}>
                      {index < step ? <CheckIcon size={11} /> : index + 1}
                    </StepDot>
                    {label}
                  </StepButton>
                </StepItem>
              );
            })}
          </Steps>

          {error ? (
            <ErrorBanner role="alert">{error}</ErrorBanner>
          ) : null}

          <form onSubmit={submit} noValidate>
            {/* ---- Information ---- */}
            <Panel hidden={step !== 0}>
              <PanelHead>Contact</PanelHead>

              <CheckoutField
                name="email"
                label="Email"
                type="email"
                value={address.email}
                error={touched.email ? errors.email : ""}
                onChange={updateAddress}
                autoComplete="email"
                required
              />

              <CheckLabel>
                <input type="checkbox" />
                <span>Email me with news and offers</span>
              </CheckLabel>

              <PanelHead>Shipping address</PanelHead>

              <FieldRow>
                <CheckoutField
                  name="first_name"
                  label="First name"
                  value={address.first_name}
                  error={touched.first_name ? errors.first_name : ""}
                  onChange={updateAddress}
                  autoComplete="given-name"
                  required
                />
                <CheckoutField
                  name="last_name"
                  label="Last name"
                  value={address.last_name}
                  error={touched.last_name ? errors.last_name : ""}
                  onChange={updateAddress}
                  autoComplete="family-name"
                  required
                />
              </FieldRow>

              <CheckoutField
                name="company"
                label="Company (optional)"
                value={address.company}
                onChange={updateAddress}
                autoComplete="organization"
              />

              <CheckoutField
                name="address_1"
                label="Address"
                value={address.address_1}
                error={touched.address_1 ? errors.address_1 : ""}
                onChange={updateAddress}
                autoComplete="address-line1"
                required
              />

              <CheckoutField
                name="address_2"
                label="Apartment, suite, etc. (optional)"
                value={address.address_2}
                onChange={updateAddress}
                autoComplete="address-line2"
              />

              <FieldRow>
                <CheckoutField
                  name="city"
                  label="City"
                  value={address.city}
                  error={touched.city ? errors.city : ""}
                  onChange={updateAddress}
                  autoComplete="address-level2"
                  required
                />
                <CheckoutField
                  name="postcode"
                  label="ZIP / Postal code"
                  value={address.postcode}
                  error={touched.postcode ? errors.postcode : ""}
                  onChange={updateAddress}
                  autoComplete="postal-code"
                  required
                />
              </FieldRow>

              <FieldRow>
                <CheckoutField
                  name="country"
                  label="Country / Region"
                  select
                  value={address.country}
                  onChange={updateAddress}
                  options={COUNTRIES.map((country) => ({ value: country.code, label: country.name }))}
                  required
                />

                {states.length ? (
                  <CheckoutField
                    name="state"
                    label="State"
                    select
                    value={address.state}
                    onChange={updateAddress}
                    options={states.map((state) => ({ value: state, label: state }))}
                    required
                  />
                ) : null}
              </FieldRow>

              <CheckoutField
                name="phone"
                label="Phone (optional)"
                type="tel"
                value={address.phone}
                onChange={updateAddress}
                autoComplete="tel"
              />

              <Button $block onClick={goToShipping} disabled={pending}>
                {pending ? "Saving…" : "Continue to shipping"}
                <ArrowIcon />
              </Button>
            </Panel>

            {/* ---- Shipping ---- */}
            <Panel hidden={step !== 1}>
              <PanelHead>Shipping method</PanelHead>

              <ContactCard address={address} onEdit={() => setStep(0)} />

              {rates.length ? (
                <OptionList>
                  {rates.map((rate) => {
                    const value = `${rate.package_id}:${rate.rate_id}`;
                    const on = selectedRate === value;

                    return (
                      <li key={value}>
                        <Option $active={on}>
                          <input
                            type="radio"
                            name="rate"
                            value={value}
                            checked={on}
                            onChange={() => setRateKey(value)}
                          />

                          <OptionDot $active={on} aria-hidden="true" />

                          <OptionBody>
                            <SubXs>{rate.name}</SubXs>
                            {rate.meta?.length ? (
                              <BodyXs $muted>
                                {rate.meta.map((entry) => entry.value).join(" · ")}
                              </BodyXs>
                            ) : null}
                          </OptionBody>

                          <OptionPrice>
                            {Number(rate.price) === 0 ? "Free" : money(rate.price, rate)}
                          </OptionPrice>
                        </Option>
                      </li>
                    );
                  })}
                </OptionList>
              ) : (
                <BodySm $muted>No shipping options are available for this address.</BodySm>
              )}

              <CheckoutNav>
                <Button $quiet onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={goToPayment} disabled={pending || !rates.length}>
                  Continue to payment
                  <ArrowIcon />
                </Button>
              </CheckoutNav>
            </Panel>

            {/* ---- Payment ---- */}
            <Panel hidden={step !== 2}>
              <PanelHead>Payment</PanelHead>

              <ContactCard address={address} onEdit={() => setStep(0)} />

              {gateways.length ? (
                <OptionList>
                  {gateways.map((option) => {
                    const on = selectedPayment === option.id;

                    return (
                      <li key={option.id}>
                        <Option $active={on}>
                          <input
                            type="radio"
                            name="payment"
                            value={option.id}
                            checked={on}
                            onChange={() => setPayment(option.id)}
                          />
                          <OptionDot $active={on} aria-hidden="true" />
                          <OptionBody>
                            <SubXs>{option.name}</SubXs>
                            <BodyXs $muted>{option.description}</BodyXs>
                          </OptionBody>
                        </Option>
                      </li>
                    );
                  })}
                </OptionList>
              ) : (
                <BodySm $muted>No payment method is enabled on this store.</BodySm>
              )}

              <CheckoutField
                name="note"
                label="Order notes (optional)"
                textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Delivery instructions, gift note…"
              />

              <CheckoutNav>
                <Button $quiet onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={pending || !selectedPayment}>
                  {pending ? "Placing order…" : "Place order"}
                  <ArrowIcon />
                </Button>
              </CheckoutNav>
            </Panel>
          </form>

          <Legal>
            By placing this order you agree to our{" "}
            <InlineLink as={Link} to="/about">
              Terms
            </InlineLink>{" "}
            and{" "}
            <InlineLink as={Link} to="/about">
              Privacy Policy
            </InlineLink>
            .
          </Legal>
        </CheckoutMain>

        {/* ---- Order summary ---- */}
        <SummaryAside aria-label="Order summary">
          <SummaryRail
            cart={cart}
            promo={promo}
            onPromo={setPromo}
            onApplyPromo={submitPromo}
            onRemoveCoupon={removeCoupon}
            promoBusy={promoBusy || busy.has("coupon")}
          />
        </SummaryAside>
      </CheckoutGrid>
    </CheckoutPage>
  );
}

/* ------------------------------------------------------------------ *
 * Summary rail
 * ------------------------------------------------------------------ */

function SummaryRail({ cart, promo, onPromo, onApplyPromo, onRemoveCoupon, promoBusy }) {
  const totals = cart.totals ?? {};
  const subtotal = Number(totals.total_items ?? 0);
  const shipping = totals.total_shipping == null ? null : Number(totals.total_shipping);
  const total = Number(totals.total_price ?? 0);
  const coupons = cart.coupons ?? [];

  return (
    <Summary>
      <SubSm>Order summary</SubSm>

      <SummaryItems>
        {cart.items.map((item) => (
          <SummaryItem key={item.key}>
            <SummaryThumb>
              {item.images?.[0] ? (
                <img src={item.images[0].thumbnail ?? item.images[0].src} alt="" loading="lazy" />
              ) : null}
              <SummaryQty>{item.quantity}</SummaryQty>
            </SummaryThumb>

            <SummaryNames>
              <BodySm>{item.name}</BodySm>
              {item.variation?.length ? (
                <BodyXs $muted>
                  {item.variation.map((variation) => variation.value).join(", ")}
                </BodyXs>
              ) : null}
            </SummaryNames>

            <SummaryPrice>{money(item.totals?.line_total, item.totals)}</SummaryPrice>
          </SummaryItem>
        ))}
      </SummaryItems>

      <PromoForm onSubmit={onApplyPromo}>
        <PromoInput
          type="text"
          value={promo}
          onChange={(event) => onPromo(event.target.value)}
          placeholder="Discount code or gift card"
          aria-label="Discount code"
        />
        <Button type="submit" disabled={promoBusy || !promo.trim()}>
          {promoBusy ? "Applying…" : "Apply"}
        </Button>
      </PromoForm>

      {coupons.length ? (
        <AppliedList>
          {coupons.map((coupon) => (
            <li key={coupon.code}>
              <AppliedCode>{coupon.code}</AppliedCode>
              <AppliedDetail>{describeCoupon(coupon)}</AppliedDetail>
              <AppliedRemove
                type="button"
                onClick={() => onRemoveCoupon(coupon.code)}
                aria-label={`Remove discount code ${coupon.code}`}
              >
                Remove
              </AppliedRemove>
            </li>
          ))}
        </AppliedList>
      ) : null}

      <Ledger>
        <LedgerRow>
          <span>Subtotal</span>
          <LeadSm>{money(subtotal, totals)}</LeadSm>
        </LedgerRow>

        <LedgerRow>
          <span>Shipping</span>
          <LedgerMuted>
            {shipping === null ? "Calculated at next step" : Number(shipping) === 0 ? "Free" : money(shipping, totals)}
          </LedgerMuted>
        </LedgerRow>

        <LedgerRow $total>
          <LeadMd>Total</LeadMd>
          <LeadMd>
            {money(total, totals)} <BodyXs $muted as="small">{totals.currency_code}</BodyXs>
          </LeadMd>
        </LedgerRow>
      </Ledger>

      <Assurance>
        <span>Secure checkout</span>
        <span>Free returns</span>
      </Assurance>
    </Summary>
  );
}

function ContactCard({ address, onEdit }) {
  return (
    <ContactSummary>
      <div>
        <BodySm>
          {address.first_name} {address.last_name}
        </BodySm>
        <BodySm $muted>{address.email}</BodySm>
        <BodySm $muted>
          {address.address_1}
          {address.address_2 ? `, ${address.address_2}` : ""}, {address.city} {address.state}{" "}
          {address.postcode}, {address.country}
        </BodySm>
      </div>

      <TextLink type="button" onClick={onEdit}>
        Change
      </TextLink>
    </ContactSummary>
  );
}

/* ------------------------------------------------------------------ *
 * Confirmation
 * ------------------------------------------------------------------ */

function OrderConfirmation({ receipt }) {
  const { order, totals, paymentLabel } = receipt;
  const reference = order.order_number ?? order.order_id;
  const email = order.billing_address?.email;

  return (
    <Confirmation as="main">
      <SubSm>Thank you</SubSm>

      <H1>Order confirmed</H1>

      <BodyMd $muted>
        Order <strong>#{reference}</strong> is on its way. A
        confirmation has been sent to {email ?? "your inbox"}.
      </BodyMd>

      <ConfirmationList>
        <div>
          <SubXs $muted as="dt">Order number</SubXs>
          <LeadSm as="dd">#{reference}</LeadSm>
        </div>
        <div>
          <SubXs $muted as="dt">Total</SubXs>
          <LeadSm as="dd">{money(Number(totals.total_price ?? 0), totals)}</LeadSm>
        </div>
        <div>
          <SubXs $muted as="dt">Payment</SubXs>
          <LeadSm as="dd">{paymentLabel ?? order.payment_method ?? "—"}</LeadSm>
        </div>
      </ConfirmationList>

      <Button as={Link} to="/shop">
        Continue shopping
        <ArrowIcon />
      </Button>
    </Confirmation>
  );
}

/* ------------------------------------------------------------------ *
 * Form field
 * ------------------------------------------------------------------ */

function CheckoutField({
  name,
  label,
  value,
  onChange,
  error,
  type = "text",
  select = false,
  textarea = false,
  options = [],
  ...rest
}) {
  const invalid = Boolean(error);

  return (
    <Field>
      <FieldLabel as="label" htmlFor={`co-${name}`}>
        {label}
        {rest.required ? <span> *</span> : null}
      </FieldLabel>

      {select ? (
        <Select
          id={`co-${name}`}
          name={name}
          value={value}
          onChange={(event) => onChange({ [name]: event.target.value })}
          aria-invalid={invalid}
          {...rest}
        >
          <option value="">Select…</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : textarea ? (
        <Textarea
          id={`co-${name}`}
          name={name}
          value={value}
          onChange={(event) => onChange({ [name]: event.target.value })}
          aria-invalid={invalid}
          {...rest}
        />
      ) : (
        <Input
          id={`co-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange({ [name]: event.target.value })}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${name}-error` : undefined}
          {...rest}
        />
      )}

      {invalid ? (
        <FieldError id={`${name}-error`} role="alert">
          {error}
        </FieldError>
      ) : null}
    </Field>
  );
}

/**
 * Summarize a cart coupon. The cart only reports the discount it actually
 * applied (`totals.total_discount`, in minor units) — it never echoes the
 * percentage — so we show the real amount rather than guessing the rule.
 */
function describeCoupon(coupon) {
  const totals = coupon.totals ?? {};
  if (totals.total_discount == null) return "Discount applied";
  return `${money(Number(totals.total_discount), totals)} off`;
}
/** Cart-sourced values are not guaranteed to be strings, so normalize before use. */
const text = (value) => (typeof value === "string" ? value : value == null ? "" : String(value)).trim();

function validate(address, isPaymentStep) {
  const errors = {};
  const email = text(address.email);

  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address.";

  if (!isPaymentStep) {
    if (!text(address.first_name)) errors.first_name = "Enter your first name.";
    if (!text(address.last_name)) errors.last_name = "Enter your last name.";
    if (!text(address.address_1)) errors.address_1 = "Enter your address.";
    if (!text(address.city)) errors.city = "Enter your city.";
    if (!text(address.postcode)) errors.postcode = "Enter your postal code.";
    if (address.country === "US" && !text(address.state)) errors.state = "Select your state.";
  }

  return errors;
}
