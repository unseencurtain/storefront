import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useAccount } from "../../account/AccountContext.jsx";
import { money } from "../../../shared/lib/format.js";
import { describeGateways } from "../../../shared/lib/gateways.js";
import { ArrowIcon, CheckIcon, BagIcon } from "../../../shared/ui/Icons.jsx";

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

  if (placed) return <Confirmation receipt={placed} />;

  if (isEmpty) {
    return (
      <main className="page container-inset">
        <div className="state-msg">
          <BagIcon size={28} />
          <h1 className="hdr-md">Your bag is empty</h1>
          <p className="body-sm muted">Add something to your bag before checking out.</p>
          <Link to="/shop" className="btn">
            Shop All
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page checkout">
      <div className="container checkout__inner">
        <div className="checkout__main">
          <div className="checkout__top">
            <Link to="/" className="wordmark wordmark--sm" aria-label="Cereve, home">
              CEREVE
            </Link>

            <Link to="/cart" className="btn-link">
              Back to bag
            </Link>
          </div>

          <div className="checkout__titlewrap">
            <h1 className="checkout__title sub-md">Checkout</h1>
            <p className="body-xs muted checkout__session">
              {isLoggedIn ? (
                <>
                  Checking out as{" "}
                  <Link to="/account" className="link-underline">
                    {customer.email}
                  </Link>
                </>
              ) : (
                <>
                  Checking out as a guest.{" "}
                  <Link to="/login" className="link-underline" state={{ from: "/checkout" }}>
                    Sign in
                  </Link>{" "}
                  for faster checkout.
                </>
              )}
            </p>
          </div>

          <ol className="steps" aria-label="Checkout progress">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className="steps__item"
                data-state={index < step ? "done" : index === step ? "current" : "todo"}
              >
                <button
                  type="button"
                  className="steps__btn"
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                >
                  <span className="steps__dot">
                    {index < step ? <CheckIcon size={11} /> : index + 1}
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ol>

          {error ? (
            <p className="checkout__error" role="alert">
              {error}
            </p>
          ) : null}

          <form onSubmit={submit} noValidate>
            {/* ---- Information ---- */}
            <section className="checkout__panel" data-active={step === 0} hidden={step !== 0}>
              <h2 className="sub-sm checkout__panelhead">Contact</h2>

              <Field
                name="email"
                label="Email"
                type="email"
                value={address.email}
                error={touched.email ? errors.email : ""}
                onChange={updateAddress}
                autoComplete="email"
                required
              />

              <label className="check">
                <input type="checkbox" />
                <span>Email me with news and offers</span>
              </label>

              <h2 className="sub-sm checkout__panelhead">Shipping address</h2>

              <div className="field-row">
                <Field
                  name="first_name"
                  label="First name"
                  value={address.first_name}
                  error={touched.first_name ? errors.first_name : ""}
                  onChange={updateAddress}
                  autoComplete="given-name"
                  required
                />
                <Field
                  name="last_name"
                  label="Last name"
                  value={address.last_name}
                  error={touched.last_name ? errors.last_name : ""}
                  onChange={updateAddress}
                  autoComplete="family-name"
                  required
                />
              </div>

              <Field
                name="company"
                label="Company (optional)"
                value={address.company}
                onChange={updateAddress}
                autoComplete="organization"
              />

              <Field
                name="address_1"
                label="Address"
                value={address.address_1}
                error={touched.address_1 ? errors.address_1 : ""}
                onChange={updateAddress}
                autoComplete="address-line1"
                required
              />

              <Field
                name="address_2"
                label="Apartment, suite, etc. (optional)"
                value={address.address_2}
                onChange={updateAddress}
                autoComplete="address-line2"
              />

              <div className="field-row">
                <Field
                  name="city"
                  label="City"
                  value={address.city}
                  error={touched.city ? errors.city : ""}
                  onChange={updateAddress}
                  autoComplete="address-level2"
                  required
                />
                <Field
                  name="postcode"
                  label="ZIP / Postal code"
                  value={address.postcode}
                  error={touched.postcode ? errors.postcode : ""}
                  onChange={updateAddress}
                  autoComplete="postal-code"
                  required
                />
              </div>

              <div className="field-row">
                <Field
                  name="country"
                  label="Country / Region"
                  select
                  value={address.country}
                  onChange={updateAddress}
                  options={COUNTRIES.map((country) => ({ value: country.code, label: country.name }))}
                  required
                />

                {states.length ? (
                  <Field
                    name="state"
                    label="State"
                    select
                    value={address.state}
                    onChange={updateAddress}
                    options={states.map((state) => ({ value: state, label: state }))}
                    required
                  />
                ) : null}
              </div>

              <Field
                name="phone"
                label="Phone (optional)"
                type="tel"
                value={address.phone}
                onChange={updateAddress}
                autoComplete="tel"
              />

              <button type="button" className="btn btn--lg btn--block" onClick={goToShipping} disabled={pending}>
                {pending ? "Saving…" : "Continue to shipping"}
                <ArrowIcon />
              </button>
            </section>

            {/* ---- Shipping ---- */}
            <section className="checkout__panel" hidden={step !== 1}>
              <h2 className="sub-sm checkout__panelhead">Shipping method</h2>

              <ContactSummary address={address} onEdit={() => setStep(0)} />

              {rates.length ? (
                <ul className="rates">
                  {rates.map((rate) => {
                    const value = `${rate.package_id}:${rate.rate_id}`;
                    const on = selectedRate === value;

                    return (
                      <li key={value}>
                        <label className="rate" data-active={on || undefined}>
                          <input
                            type="radio"
                            name="rate"
                            value={value}
                            checked={on}
                            onChange={() => setRateKey(value)}
                          />

                          <span className="rate__dot" aria-hidden="true" />

                          <span className="rate__body">
                            <span className="sub-xs">{rate.name}</span>
                            {rate.meta?.length ? (
                              <span className="body-xs muted">
                                {rate.meta.map((entry) => entry.value).join(" · ")}
                              </span>
                            ) : null}
                          </span>

                          <span className="rate__price lead-sm">
                            {Number(rate.price) === 0 ? "Free" : money(rate.price, rate)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="body-sm muted">No shipping options are available for this address.</p>
              )}

              <div className="checkout__nav">
                <button type="button" className="btn btn--quiet" onClick={() => setStep(0)}>
                  Back
                </button>
                <button type="button" className="btn btn--lg" onClick={goToPayment} disabled={pending || !rates.length}>
                  Continue to payment
                  <ArrowIcon />
                </button>
              </div>
            </section>

            {/* ---- Payment ---- */}
            <section className="checkout__panel" hidden={step !== 2}>
              <h2 className="sub-sm checkout__panelhead">Payment</h2>

              <ContactSummary address={address} onEdit={() => setStep(0)} />

              {gateways.length ? (
                <ul className="rates">
                  {gateways.map((option) => {
                    const on = selectedPayment === option.id;

                    return (
                      <li key={option.id}>
                        <label className="rate" data-active={on || undefined}>
                          <input
                            type="radio"
                            name="payment"
                            value={option.id}
                            checked={on}
                            onChange={() => setPayment(option.id)}
                          />
                          <span className="rate__dot" aria-hidden="true" />
                          <span className="rate__body">
                            <span className="sub-xs">{option.name}</span>
                            <span className="body-xs muted">{option.description}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="body-sm muted">No payment method is enabled on this store.</p>
              )}

              <Field
                name="note"
                label="Order notes (optional)"
                textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Delivery instructions, gift note…"
              />

              <div className="checkout__nav">
                <button type="button" className="btn btn--quiet" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" className="btn btn--lg" disabled={pending || !selectedPayment}>
                  {pending ? "Placing order…" : "Place order"}
                  <ArrowIcon />
                </button>
              </div>
            </section>
          </form>

          <p className="checkout__legal body-xs muted">
            By placing this order you agree to our{" "}
            <Link to="/about" className="link-underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/about" className="link-underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* ---- Order summary ---- */}
        <aside className="checkout__summary" aria-label="Order summary">
          <Summary
            cart={cart}
            promo={promo}
            onPromo={setPromo}
            onApplyPromo={submitPromo}
            onRemoveCoupon={removeCoupon}
            promoBusy={promoBusy || busy.has("coupon")}
          />
        </aside>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Summary rail
 * ------------------------------------------------------------------ */

function Summary({ cart, promo, onPromo, onApplyPromo, onRemoveCoupon, promoBusy }) {
  const totals = cart.totals ?? {};
  const subtotal = Number(totals.total_items ?? 0);
  const shipping = totals.total_shipping == null ? null : Number(totals.total_shipping);
  const total = Number(totals.total_price ?? 0);
  const coupons = cart.coupons ?? [];

  return (
    <div className="summary">
      <h2 className="sub-sm">Order summary</h2>

      <ul className="summary__items">
        {cart.items.map((item) => (
          <li key={item.key} className="summary__item">
            <span className="summary__thumb">
              {item.images?.[0] ? (
                <img src={item.images[0].thumbnail ?? item.images[0].src} alt="" loading="lazy" />
              ) : null}
              <span className="summary__qty">{item.quantity}</span>
            </span>

            <span className="summary__names">
              <span className="body-sm">{item.name}</span>
              {item.variation?.length ? (
                <span className="body-xs muted">
                  {item.variation.map((variation) => variation.value).join(", ")}
                </span>
              ) : null}
            </span>

            <span className="body-sm summary__price">
              {money(item.totals?.line_total, item.totals)}
            </span>
          </li>
        ))}
      </ul>

      <form className="promo__form" onSubmit={onApplyPromo}>
        <input
          className="promo__input"
          type="text"
          value={promo}
          onChange={(event) => onPromo(event.target.value)}
          placeholder="Discount code or gift card"
          aria-label="Discount code"
        />
        <button type="submit" className="btn" disabled={promoBusy || !promo.trim()}>
          {promoBusy ? "Applying…" : "Apply"}
        </button>
      </form>

      {coupons.length ? (
        <ul className="promo__applied">
          {coupons.map((coupon) => (
            <li key={coupon.code}>
              <span className="promo__code">{coupon.code}</span>
              <span className="body-xs muted">{describeCoupon(coupon)}</span>
              <button
                type="button"
                className="promo__remove"
                onClick={() => onRemoveCoupon(coupon.code)}
                aria-label={`Remove discount code ${coupon.code}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="ledger">
        <div className="ledger__row">
          <span>Subtotal</span>
          <span className="lead-sm">{money(subtotal, totals)}</span>
        </div>

        <div className="ledger__row">
          <span>Shipping</span>
          <span className="ledger__muted">
            {shipping === null ? "Calculated at next step" : Number(shipping) === 0 ? "Free" : money(shipping, totals)}
          </span>
        </div>

        <div className="ledger__row ledger__row--total">
          <span className="lead-md">Total</span>
          <span className="lead-md">
            {money(total, totals)} <small className="body-xs muted">{totals.currency_code}</small>
          </span>
        </div>
      </div>

      <div className="assurance">
        <span>Secure checkout</span>
        <span>Free returns</span>
      </div>
    </div>
  );
}

function ContactSummary({ address, onEdit }) {
  return (
    <div className="contact-summary">
      <div>
        <p className="body-sm">
          {address.first_name} {address.last_name}
        </p>
        <p className="body-sm muted">{address.email}</p>
        <p className="body-sm muted">
          {address.address_1}
          {address.address_2 ? `, ${address.address_2}` : ""}, {address.city} {address.state}{" "}
          {address.postcode}, {address.country}
        </p>
      </div>

      <button type="button" className="btn-link" onClick={onEdit}>
        Change
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Confirmation
 * ------------------------------------------------------------------ */

function Confirmation({ receipt }) {
  const { order, totals, paymentLabel } = receipt;
  const reference = order.order_number ?? order.order_id;
  const email = order.billing_address?.email;

  return (
    <main className="page container-narrow confirmation">
      <p className="sub-sm">Thank you</p>

      <h1 className="hdr-lg confirmation__title">Order confirmed</h1>

      <p className="body-md muted">
        Order <strong>#{reference}</strong> is on its way. A
        confirmation has been sent to {email ?? "your inbox"}.
      </p>

      <dl className="confirmation__list">
        <div>
          <dt className="sub-xs muted">Order number</dt>
          <dd className="lead-sm">#{reference}</dd>
        </div>
        <div>
          <dt className="sub-xs muted">Total</dt>
          <dd className="lead-sm">{money(Number(totals.total_price ?? 0), totals)}</dd>
        </div>
        <div>
          <dt className="sub-xs muted">Payment</dt>
          <dd className="lead-sm">{paymentLabel ?? order.payment_method ?? "—"}</dd>
        </div>
      </dl>

      <Link to="/shop" className="btn">
        Continue shopping
        <ArrowIcon />
      </Link>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Form field
 * ------------------------------------------------------------------ */

function Field({
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
    <div className={`field ${invalid ? "field--invalid" : ""}`}>
      <label className="field__label" htmlFor={`co-${name}`}>
        {label}
        {rest.required ? <span className="req"> *</span> : null}
      </label>

      {select ? (
        <select
          id={`co-${name}`}
          name={name}
          className="field__select"
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
        </select>
      ) : textarea ? (
        <textarea
          id={`co-${name}`}
          name={name}
          className="field__textarea"
          value={value}
          onChange={(event) => onChange({ [name]: event.target.value })}
          aria-invalid={invalid}
          {...rest}
        />
      ) : (
        <input
          id={`co-${name}`}
          name={name}
          className="field__input"
          type={type}
          value={value}
          onChange={(event) => onChange({ [name]: event.target.value })}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${name}-error` : undefined}
          {...rest}
        />
      )}

      {invalid ? (
        <p className="field__error" id={`${name}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
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
