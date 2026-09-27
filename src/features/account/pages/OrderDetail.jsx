import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCustomerOrder } from "../../../shared/lib/woo.js";
import { decimalMoney, formatDate } from "../../../shared/lib/format.js";
import { BodySm, BodyXs, H1, H2 } from "../../../shared/ui/primitives.js";
import {
  Container,
  Empty,
  OrderMeta,
  Page,
  Panel,
  PanelHeader,
  SectionTitle,
  Skeleton,
  StatusPill
} from "../../../shared/ui/accountLayout.js";
import { ChevronIcon } from "../../../shared/ui/Icons.jsx";
import {
  DetailShell,
  BackLink,
  DetailAddress,
  DetailHeader,
  InfoGrid,
  InfoCard,
  DetailLabel,
  DetailList,
  DetailRow,
  DetailValue,
  LineImage,
  LineMeta,
  LineName,
  LineQty,
  Thumbnail,
  TotalsBox,
  TotalsRow
} from "./orderDetail.css.js";

const PAID_STATUSES = new Set(["processing", "completed"]);

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getCustomerOrder(id)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.status === 404 ? "We couldn't find that order." : "We couldn't load that order.");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <Page>
        <Container>
          <Empty role="alert">
            <H2>Order unavailable</H2>
            <BodySm $muted>{error}</BodySm>
            <BackLink as={Link} to="/account">
              Back to your account
            </BackLink>
          </Empty>
        </Container>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page>
        <Container>
          <Skeleton style={{ width: 220, height: 34 }} />
          <Skeleton style={{ width: 320, height: 16, marginTop: 18 }} />
          <Skeleton style={{ height: 180, marginTop: 32 }} />
        </Container>
      </Page>
    );
  }

  const money = (value) => decimalMoney(value, order.currency);
  const shippingLabel = order.shipping_method || "Shipping";

  return (
    <DetailShell>
      <Container>
        <BackLink as={Link} to="/account">
          <ChevronIcon size={12} direction="left" />
          All orders
        </BackLink>

        <DetailHeader>
          <H1>Order #{order.number}</H1>
          <OrderMeta>
            <StatusPill $paid={PAID_STATUSES.has(order.status_slug)}>{order.status}</StatusPill>
            <span>Placed {formatDate(order.date)}</span>
          </OrderMeta>
        </DetailHeader>

        <Panel>
          <PanelHeader>
            <SectionTitle>Items</SectionTitle>
          </PanelHeader>

          <DetailList>
            {order.items?.map((item, index) => (
              <DetailRow key={`${order.id}-${index}`}>
                <LineImage>
                  {item.image ? (
                    <Thumbnail as="img" src={item.image} alt={item.name} />
                  ) : (
                    <Thumbnail aria-label={item.name} />
                  )}
                </LineImage>

                <div>
                  <LineName>{item.name}</LineName>
                  <LineMeta>
                    {item.sku ? <span>SKU {item.sku}</span> : null}
                    <LineQty>Qty {item.quantity}</LineQty>
                  </LineMeta>
                </div>

                <DetailValue $align="right">{money(item.total)}</DetailValue>
              </DetailRow>
            ))}
          </DetailList>

          <TotalsBox>
            <TotalsRow>
              <span>Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </TotalsRow>

            {Number(order.discount) > 0 ? (
              <TotalsRow>
                <span>
                  Discount{order.coupons?.length ? ` (${order.coupons.join(", ")})` : ""}
                </span>
                <span>−{money(order.discount)}</span>
              </TotalsRow>
            ) : null}

            <TotalsRow>
              <span>{shippingLabel}</span>
              <span>{Number(order.shipping) === 0 ? "Free" : money(order.shipping)}</span>
            </TotalsRow>

            {Number(order.tax) > 0 ? (
              <TotalsRow>
                <span>Tax</span>
                <span>{money(order.tax)}</span>
              </TotalsRow>
            ) : null}

            <TotalsRow $strong>
              <span>Total</span>
              <span>{money(order.total)}</span>
            </TotalsRow>
          </TotalsBox>
        </Panel>

        <InfoGrid>
          <InfoCard>
            <DetailLabel>Shipping address</DetailLabel>
            <DetailAddress>
              {(order.shipping_address ?? []).map((line) => (
                <DetailValue key={line}>{line}</DetailValue>
              ))}
            </DetailAddress>
          </InfoCard>

          <InfoCard>
            <DetailLabel>Billing address</DetailLabel>
            <DetailAddress>
              {(order.billing ?? []).map((line) => (
                <DetailValue key={line}>{line}</DetailValue>
              ))}
            </DetailAddress>
          </InfoCard>

          <InfoCard>
            <DetailLabel>Payment</DetailLabel>
            <DetailValue>{order.payment || "—"}</DetailValue>
            {order.transaction ? (
              <BodyXs $muted>Reference {order.transaction}</BodyXs>
            ) : null}
          </InfoCard>
        </InfoGrid>

        {order.note ? (
          <Panel as="div">
            <PanelHeader>
              <SectionTitle>Your note</SectionTitle>
            </PanelHeader>
            <BodySm $muted>{order.note}</BodySm>
          </Panel>
        ) : null}
      </Container>
    </DetailShell>
  );
}
