import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useAccount } from "../../account/AccountContext.jsx";
import { STORE_NAME } from "../../../shared/lib/branding.js";
import { describeGateways } from "../../../shared/lib/gateways.js";
import { money } from "../../../shared/lib/format.js";
import { getCatalogMetadata } from "../../../shared/lib/woo.js";
import { ArrowIcon, BagIcon, ChevronIcon } from "../../../shared/ui/Icons.jsx";
import {
  BodyMd, BodySm, BodyXs, H1, H2, LeadMd, LeadSm, SubSm, SubXs
} from "../../../shared/ui/primitives.js";
import {
  AppliedCode, AppliedDetail, AppliedList, AppliedRemove, Assurance, Button,
  CheckoutGrid, CheckoutHeader, CheckoutMain, CheckoutNav, CheckoutPage, CheckoutTop,
  CheckLabel, Confirmation, ConfirmationList, ContactHead, ContactSummary, EmptyState, ErrorBanner,
  Field, FieldError, FieldLabel, FieldRow, Input, InlineLink, Legal, Ledger,
  LedgerMuted, LedgerRow, Option, OptionBody, OptionDot, OptionList, OptionPrice,
  Panel, PanelHead, PromoForm, PromoInput, RetryButton, ReturnRow, StepButton, StepItem, Steps,
  Select, Summary, SummaryAside, SummaryBar, SummaryBarIcon, SummaryBarLabel, SummaryHead, SummaryItem, SummaryItems,
  SummaryLedger, SummaryNames, SummaryPrice, SummaryQty, SummaryThumb, TextLink,
  Textarea, WordmarkSmall
} from "../checkout.css.js";

const STATES_US = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

const COUNTRIES = [
  { code: "DE", name: "Germany", states: [] },
  { code: "FR", name: "France", states: [] },
  { code: "ES", name: "Spain", states: [] },
  { code: "IT", name: "Italy", states: [] },
  { code: "NL", name: "Netherlands", states: [] },
  { code: "BE", name: "Belgium", states: [] },
  { code: "AT", name: "Austria", states: [] },
  { code: "PT", name: "Portugal", states: [] },
  { code: "IE", name: "Ireland", states: [] },
  { code: "PL", name: "Poland", states: [] },
  { code: "GB", name: "United Kingdom", states: [] },
  { code: "US", name: "United States", states: STATES_US }
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
  country: "DE",
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
    status: cartStatus,
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [catalogMeta, setCatalogMeta] = useState({ products: {}, countries: {} });
  const [catalogMetaLoading, setCatalogMetaLoading] = useState(false);
  const [catalogMetaError, setCatalogMetaError] = useState(false);

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

  const cartProductIds = useMemo(
    () => [...new Set((cart.items ?? []).map((item) => Number(item.id)).filter((id) => id > 0))],
    [cart.items]
  );

  useEffect(() => {
    let alive = true;
    if (!cartProductIds.length) {
      setCatalogMeta({ products: {}, countries: {} });
      setCatalogMetaLoading(false);
      setCatalogMetaError(false);
      return () => { alive = false; };
    }
    setCatalogMetaLoading(true);
    getCatalogMetadata(cartProductIds)
      .then((data) => {
        if (!alive) return;
        setCatalogMeta(data);
        setCatalogMetaLoading(false);
        setCatalogMetaError(false);
      })
      .catch(() => {
        if (!alive) return;
        setCatalogMeta({ products: {}, countries: {} });
        setCatalogMetaLoading(false);
        setCatalogMetaError(true);
      });
    return () => { alive = false; };
  }, [cartProductIds]);

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

  // A returning shopper already has an address on file, so the Information step
  // has nothing to ask them. Push it into the cart, then start on Shipping --
  // "Change" on the contact card brings them back if they need to edit it.
  // Guests have no saved address, so they still start on Information.
  const skippedForSavedAddress = useRef(false);

  useEffect(() => {
    if (skippedForSavedAddress.current || !isLoggedIn || step !== 0) return;

    const complete =
      address.first_name && address.address_1 && address.city && address.postcode && address.country;
    if (!complete) return;

    skippedForSavedAddress.current = true;

    (async () => {
      const ok = await setAddress(address);
      if (ok) {
        setStep(1);
      } else {
        // Let them retry rather than stranding them, and say what went wrong.
        skippedForSavedAddress.current = false;
        setAddressError("We couldn't load your saved address. Please try again.");
      }
    })();
  }, [address, isLoggedIn, setAddress, step]);

  const states = useMemo(
    () => COUNTRIES.find((country) => country.code === address.country)?.states ?? [],
    [address.country]
  );

  const supplierProducts = cartProductIds
    .map((id) => catalogMeta.products[String(id)])
    .filter(Boolean);
  const suppliers = [...new Set(supplierProducts.map((product) => product.vendor))];
  const mixedSuppliers = suppliers.length > 1;
  const unrecognizedCartProducts = !catalogMetaLoading && !catalogMetaError && cartProductIds.some((id) => !catalogMeta.products[String(id)]);
  const supplierNames = { beautyfort: "BeautyFort", bts: "BTS Wholesaler" };
  const supplierName = suppliers.length === 1 ? (supplierNames[suppliers[0]] ?? suppliers[0]) : "";
  const supplierCountries = supplierProducts.find((product) => product.countries?.length)?.countries ?? [];
  const countryDirectory = Object.keys(catalogMeta.countries ?? {}).length
    ? Object.entries(catalogMeta.countries).map(([code, name]) => ({
        code,
        name,
        states: COUNTRIES.find((country) => country.code === code)?.states ?? []
      }))
    : COUNTRIES;
  const availableCountries = supplierCountries.length
    ? countryDirectory.filter((country) => supplierCountries.includes(country.code))
    : countryDirectory;

  useEffect(() => {
    if (!supplierCountries.length || !address.country) return;
    if (!supplierCountries.includes(address.country)) updateAddress({ country: "" });
  }, [supplierCountries.join(","), address.country]);

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

  /**
   * Woo returns no shipping packages for a cart of only virtual products --
   * there is nothing to ship. That is not a failed quote, so the shipping step
   * must not treat it as "no options available for this address" and disable
   * Continue, which left virtual-only carts impossible to complete.
   */
  const needsShipping = cart.needs_shipping !== false;
  const shippingSettled = cart.needs_shipping === false || rates.length > 0;

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

  async function pushAddress() {
    return setAddress({
      ...address,
      state: address.state || (address.country === "US" ? "TX" : "")
    });
  }

  async function goToShipping() {
    if (invalid) {
      setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key], true)));
      return;
    }

    setAddressError("");
    const result = await pushAddress();

    if (result) {
      setStep(1);
    } else {
      // The cart never took the address, so there is nothing for Woo to quote
      // shipping against. Say that, instead of implying the address is
      // undeliverable and leaving Continue permanently disabled.
      setAddressError("We couldn't save your address. Please try again.");
    }
  }

  /** Re-send the address to force Woo to recalculate the shipping packages. */
  async function retryRates() {
    setRetrying(true);
    setAddressError("");
    const result = await pushAddress();
    setRetrying(false);
    if (!result) setAddressError("We couldn't load shipping options. Please try again.");
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

  /* An empty bag is only real once the cart request has settled — otherwise a
     refresh flashes "Your bag is empty" while the cart is still in flight. */
  if (cartStatus === "idle" || cartStatus === "loading") return null;

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
      {/* Wordmark and progress sit above the whole layout, so the mobile
          summary bar can never push them off the top of the page. */}
      <CheckoutHeader>
        <CheckoutTop>
          <WordmarkSmall as={Link} to="/" aria-label={`${STORE_NAME}, home`}>
            {STORE_NAME}
          </WordmarkSmall>
        </CheckoutTop>

        <Steps aria-label="Checkout progress">
          {STEPS.map((label, index) => {
            const state = index < step ? "done" : index === step ? "current" : "todo";

            return (
              <StepItem key={label}>
                {state === "current" ? (
                  /* The current step is the page heading, so the step name is
                     only rendered once instead of twice. */
                  <StepButton as="h1" $state={state}>
                    {label}
                  </StepButton>
                ) : (
                  <StepButton
                    type="button"
                    $state={state}
                    onClick={() => index < step && setStep(index)}
                    disabled={index > step}
                  >
                    {label}
                  </StepButton>
                )}
              </StepItem>
            );
          })}
        </Steps>
      </CheckoutHeader>

      <CheckoutGrid>
        <CheckoutMain>
          {error ? (
            <ErrorBanner role="alert">{error}</ErrorBanner>
          ) : null}

          <form onSubmit={submit} noValidate>
            {/* ---- Information ---- */}
            <Panel hidden={step !== 0}>
              <ContactHead>
                <PanelHead>Contact</PanelHead>

                {isLoggedIn ? (
                  <TextLink as={Link} to="/account">
                    {customer.email}
                  </TextLink>
                ) : (
                  <TextLink as={Link} to="/login" state={{ from: "/checkout" }}>
                    Sign in
                  </TextLink>
                )}
              </ContactHead>

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
                <CountryField
                  value={address.country}
                  countries={availableCountries}
                  onChange={(country) => updateAddress({ country })}
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

              {unrecognizedCartProducts ? (
                <ErrorBanner role="alert">
                  One or more items in your bag are not available through the active suppliers. Remove those items before continuing.
                </ErrorBanner>
              ) : mixedSuppliers ? (
                <ErrorBanner role="alert">
                  BeautyFort and BTS Wholesaler orders ship separately. Remove products from one supplier before continuing.
                </ErrorBanner>
              ) : supplierName && supplierCountries.length ? (
                <p className="body-xs muted" role="status">
                  This order ships from {supplierName}. Available delivery countries are limited to this supplier’s destinations.
                </p>
              ) : null}

              <CheckoutField
                name="phone"
                label="Phone (optional)"
                type="tel"
                value={address.phone}
                onChange={updateAddress}
                autoComplete="tel"
              />

              <Button $block onClick={goToShipping} disabled={pending || catalogMetaLoading || mixedSuppliers || unrecognizedCartProducts}>
                {pending ? "Saving…" : "Continue to shipping"}
                <ArrowIcon />
              </Button>

              {/* Leaving the bag belongs with the primary action at the end of
                  the form, not above the form where the summary sits. */}
              <ReturnRow>
                <TextLink as={Link} to="/cart">
                  <ArrowIcon size={12} direction="left" />
                  Return to bag
                </TextLink>
              </ReturnRow>
            </Panel>

            {/* ---- Shipping ---- */}
            <Panel hidden={step !== 1}>
              <PanelHead>Shipping method</PanelHead>

              {needsShipping ? (
                <ContactCard address={address} onEdit={() => setStep(0)} />
              ) : null}

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
              ) : needsShipping ? (
                <FieldError role="alert">
                  {addressError ||
                    "No shipping options are available for this address. Check the country and postcode, or try another destination."}
                  <RetryButton type="button" onClick={retryRates} disabled={retrying} $quiet>
                    {retrying ? "Retrying…" : "Try again"}
                  </RetryButton>
                </FieldError>
              ) : (
                <BodySm $muted>
                  These items are virtual, so there is nothing to ship. Delivery details will be emailed to
                  you.
                </BodySm>
              )}

              <CheckoutNav>
                <Button $quiet onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={goToPayment} disabled={pending || !shippingSettled}>
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
          <SummaryBar
            onClick={() => setSummaryOpen((value) => !value)}
            aria-expanded={summaryOpen}
            aria-controls="checkout-summary"
          >
            <SummaryBarLabel>
              <span>Order summary</span>
              <SummaryBarIcon>
                <ChevronIcon size={12} direction={summaryOpen ? "up" : "down"} />
              </SummaryBarIcon>
            </SummaryBarLabel>

            <span>{summaryTotalLabel(cart)}</span>
          </SummaryBar>

          <SummaryRail
            id="checkout-summary"
            open={summaryOpen}
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

function summaryTotalLabel(cart) {
  const totals = cart.totals ?? {};
  return money(Number(totals.total_price ?? 0), totals);
}

function SummaryRail({ id, open, cart, promo, onPromo, onApplyPromo, onRemoveCoupon, promoBusy }) {
  const totals = cart.totals ?? {};
  const subtotal = Number(totals.total_items ?? 0);
  const shipping = totals.total_shipping == null ? null : Number(totals.total_shipping);
  const total = Number(totals.total_price ?? 0);
  const coupons = cart.coupons ?? [];

  return (
    <Summary id={id} $open={open}>
      <SummaryHead>Order summary</SummaryHead>

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

      <SummaryLedger>
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
      </SummaryLedger>

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
  // The label stays as a real <label> for assistive tech, but the visible text
  // lives inside the control as its placeholder, the way the reference does.
  const placeholder = rest.placeholder ?? label;

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
          <option value="">{label}</option>
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
          placeholder={placeholder}
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
          placeholder={placeholder}
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

function CountryField({ value, countries, onChange, required }) {
  const selected = countries.find((country) => country.code === value);
  const [query, setQuery] = useState(selected?.name ?? "");

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.name]);

  function update(value) {
    setQuery(value);
    const match = countries.find(
      (country) => country.name.toLowerCase() === value.trim().toLowerCase() || country.code.toLowerCase() === value.trim().toLowerCase()
    );
    onChange(match?.code ?? "");
  }

  return (
    <Field>
      <FieldLabel as="label" htmlFor="co-country">
        Country / Region{required ? <span> *</span> : null}
      </FieldLabel>
      <Input
        id="co-country"
        name="country"
        type="search"
        list="checkout-country-options"
        value={query}
        placeholder="Search countries"
        autoComplete="country-name"
        onChange={(event) => update(event.target.value)}
        onBlur={() => {
          if (!countries.some((country) => country.name.toLowerCase() === query.trim().toLowerCase())) {
            setQuery(selected?.name ?? "");
            onChange("");
          }
        }}
        required={required}
      />
      <datalist id="checkout-country-options">
        {countries.map((country) => (
          <option key={country.code} value={country.name} label={country.code} />
        ))}
      </datalist>
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
