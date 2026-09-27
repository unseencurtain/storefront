import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "../AccountContext.jsx";
import { WooError } from "../../../shared/lib/woo.js";
import { decimalMoney, formatDate } from "../../../shared/lib/format.js";
import {
  AuthIntro,
  Field,
  FieldError,
  FieldLabel,
  FieldRow,
  FormError,
  Input
} from "../../../shared/ui/accountForms.js";
import {
  BodySm,
  Button,
  ButtonLink,
  Container,
  Divider,
  Empty,
  H1,
  H2,
  LoadingRow,
  OrderItems,
  OrderList,
  OrderMeta,
  OrderNumber,
  OrderRow,
  OrderTotal,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
  ProfileGrid,
  SaveBar,
  Saved,
  SectionTitle,
  SignOutButton,
  Skeleton,
  StatusPill,
  Tabs,
  Tab,
  Thumb
} from "../../../shared/ui/accountLayout.js";
import { OrderView } from "./orderDetail.css.js";
import { ChevronIcon } from "../../../shared/ui/Icons.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PAID_STATUSES = new Set(["processing", "completed"]);

function toForm(customer) {
  return {
    first_name: customer.first_name ?? "",
    last_name: customer.last_name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    address_1: customer.billing?.address_1 ?? "",
    city: customer.billing?.city ?? "",
    state: customer.billing?.state ?? "",
    postcode: customer.billing?.postcode ?? "",
    country: customer.billing?.country || "US"
  };
}

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

function ProfilePanel() {
  const { customer, updateProfile, busy } = useAccount();
  const [values, setValues] = useState(() => toForm(customer));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saved, setSaved] = useState(false);

  // Keep the form in step with a session that arrived or changed elsewhere.
  useEffect(() => {
    setValues(toForm(customer));
  }, [customer]);

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setSaved(false);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!values.first_name.trim()) nextErrors.first_name = "Enter your first name.";
    if (!values.last_name.trim()) nextErrors.last_name = "Enter your last name.";
    if (!EMAIL_RE.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setError("");
    setSaved(false);

    try {
      // The customer endpoint namespaces address fields per address block.
      // Names, phone and email are shared and set on both.
      await updateProfile({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        billing_address_1: values.address_1.trim(),
        billing_city: values.city.trim(),
        billing_state: values.state.trim(),
        billing_postcode: values.postcode.trim(),
        billing_country: values.country,
        shipping_address_1: values.address_1.trim(),
        shipping_city: values.city.trim(),
        shipping_state: values.state.trim(),
        shipping_postcode: values.postcode.trim(),
        shipping_country: values.country
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || "We couldn't save your details. Please try again.");
    }
  }

  return (
    <Panel as="form" onSubmit={handleSubmit} noValidate>
      <PanelHeader>
        <SectionTitle>Your details</SectionTitle>
        <BodySm $muted>Used to prefill checkout and on your invoices.</BodySm>
      </PanelHeader>

      {error ? <FormError role="alert">{error}</FormError> : null}

      <ProfileGrid>
        <Field>
          <FieldLabel htmlFor="account-first">First name</FieldLabel>
          <Input
            id="account-first"
            name="first_name"
            value={values.first_name}
            onChange={update("first_name")}
            autoComplete="given-name"
            aria-invalid={Boolean(fieldErrors.first_name)}
          />
          {fieldErrors.first_name ? <FieldError>{fieldErrors.first_name}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="account-last">Last name</FieldLabel>
          <Input
            id="account-last"
            name="last_name"
            value={values.last_name}
            onChange={update("last_name")}
            autoComplete="family-name"
            aria-invalid={Boolean(fieldErrors.last_name)}
          />
          {fieldErrors.last_name ? <FieldError>{fieldErrors.last_name}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="account-email">Email</FieldLabel>
          <Input
            id="account-email"
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
          <FieldLabel htmlFor="account-phone">Phone</FieldLabel>
          <Input
            id="account-phone"
            type="tel"
            name="phone"
            value={values.phone}
            onChange={update("phone")}
            autoComplete="tel"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="account-address">Address</FieldLabel>
          <Input
            id="account-address"
            name="address_1"
            value={values.address_1}
            onChange={update("address_1")}
            autoComplete="address-line1"
          />
        </Field>

        <FieldRow>
          <Field>
            <FieldLabel htmlFor="account-city">City</FieldLabel>
            <Input
              id="account-city"
              name="city"
              value={values.city}
              onChange={update("city")}
              autoComplete="address-level2"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-postcode">Postcode</FieldLabel>
            <Input
              id="account-postcode"
              name="postcode"
              value={values.postcode}
              onChange={update("postcode")}
              autoComplete="postal-code"
            />
          </Field>
        </FieldRow>

        {/* State and country were never rendered, so a shopper could not see or
            correct the two fields checkout needs to match a shipping zone. */}
        <FieldRow>
          <Field>
            <FieldLabel htmlFor="account-state">State</FieldLabel>
            <Input
              id="account-state"
              name="state"
              value={values.state}
              onChange={update("state")}
              autoComplete="address-level1"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-country">Country</FieldLabel>
            <Input
              id="account-country"
              name="country"
              value={values.country}
              onChange={update("country")}
              autoComplete="country"
            />
          </Field>
        </FieldRow>
      </ProfileGrid>

      <SaveBar>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        {saved ? <Saved role="status">Details saved.</Saved> : null}
      </SaveBar>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

function OrdersPanel() {
  const { getOrders } = useAccount();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getOrders({ perPage: 20 })
      .then((data) => {
        if (!cancelled) setOrders(data.items);
      })
      .catch((err) => {
        if (cancelled) return;
        // A lapsed session is not a failure worth shouting about.
        if (err instanceof WooError && err.status === 401) {
          setOrders([]);
          return;
        }
        setError(err.message || "We couldn't load your orders.");
        setOrders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [getOrders]);

  if (error) {
    return <Empty role="alert">{error}</Empty>;
  }

  if (!orders) {
    return (
      <OrderList aria-busy="true" aria-label="Loading your orders">
        {[0, 1].map((row) => (
          <LoadingRow key={row}>
            <Skeleton style={{ width: 120, height: 14 }} />
            <Skeleton style={{ width: 180, height: 14 }} />
          </LoadingRow>
        ))}
      </OrderList>
    );
  }

  if (!orders.length) {
    return (
      <Empty>
        <H2>No orders yet</H2>
        <BodySm $muted>When you place an order it will appear here.</BodySm>
        <ButtonLink as={Link} to="/shop" $large>
          Start shopping
        </ButtonLink>
      </Empty>
    );
  }

  return (
    <OrderList>
      {orders.map((order) => (
        <OrderRow key={order.id} as={Link} to={`/account/orders/${order.id}`} $link>
          <div>
            <OrderMeta>
              <OrderNumber>Order #{order.number}</OrderNumber>
              <StatusPill $paid={PAID_STATUSES.has(order.status_slug)}>{order.status}</StatusPill>
              <span>{formatDate(order.date)}</span>
              <span>{order.payment}</span>
            </OrderMeta>

            {order.items?.length ? (
              <OrderItems>
                {order.items.map((item, index) => (
                  <Thumb
                    key={`${order.id}-${index}`}
                    as={item.image ? "img" : "li"}
                    src={item.image ?? undefined}
                    alt={item.image ? item.name : undefined}
                    aria-label={item.image ? undefined : item.name}
                  />
                ))}
              </OrderItems>
            ) : null}
          </div>

          <OrderTotal>
            <strong>{decimalMoney(order.total, order.currency)}</strong>
            <OrderView>
              View details
              <ChevronIcon size={12} direction="right" />
            </OrderView>
          </OrderTotal>
        </OrderRow>
      ))}
    </OrderList>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function Account() {
  const { customer, signOut, busy, isResolved } = useAccount();
  const [tab, setTab] = useState("orders");

  return (
    <Page>
      <Container>
        <PageHeader>
          <AuthIntro>
            {/* The address lives in Your details; the greeting is just a welcome. */}
            <H1>
              Hello{isResolved && customer.first_name ? `, ${customer.first_name}` : ""}
            </H1>
          </AuthIntro>
        </PageHeader>

        <Tabs role="tablist" aria-label="Account sections">
          <Tab
            type="button"
            role="tab"
            aria-selected={tab === "orders"}
            $active={tab === "orders"}
            onClick={() => setTab("orders")}
          >
            Orders
          </Tab>
          <Tab
            type="button"
            role="tab"
            aria-selected={tab === "details"}
            $active={tab === "details"}
            onClick={() => setTab("details")}
          >
            Your details
          </Tab>
        </Tabs>

        {tab === "orders" ? <OrdersPanel /> : <ProfilePanel />}

        <Divider style={{ marginTop: 48 }} />

        <div style={{ paddingTop: 32, maxWidth: 260 }}>
          <SignOutButton type="button" $quiet disabled={busy} onClick={signOut}>
            {busy ? "Signing out…" : "Sign out"}
          </SignOutButton>
        </div>
      </Container>
    </Page>
  );
}
