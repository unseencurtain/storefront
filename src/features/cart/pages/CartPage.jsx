import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../CartContext.jsx";
import { useUI } from "../../../shared/UIContext.jsx";
import { money, plural } from "../../../shared/lib/format.js";
import { loadBestSellers } from "../../../shared/lib/catalog.js";
import { MiniRow } from "../../catalog/components/ProductCard.jsx";
import { ArrowIcon, BagIcon, CheckIcon } from "../../../shared/ui/Icons.jsx";
import { Button, ContainerInset, StateMsg, SubSm, SubXs } from "../../../shared/ui/primitives.js";
import { CartLine } from "../components/CartLine.jsx";
import { Ledger } from "../components/Ledger.jsx";
import { CartCoupon } from "../components/CartCoupon.jsx";
import { FREE_SHIPPING_AT, ASSURANCE } from "../constants.js";
import {
  CartPage as CartPageShell,
  CartPageTitle,
  CartMain,
  EmptyBag,
  EmptyRecs,
  LineList,
  PageActions,
  PageNote,
  PageSummary,
  Perks
} from "../cart.css.js";

/** Full-page bag. Mirrors the drawer, with the wider ledger from the reference. */
export default function CartPage() {
  const { cart, count, isEmpty, setQuantity, status } = useCart();
  const { open } = useUI();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!isEmpty) return;

    let alive = true;
    loadBestSellers(3).then((items) => alive && setSuggestions(items));

    return () => {
      alive = false;
    };
  }, [isEmpty]);

  if (status === "idle") {
    return (
      <CartPageShell>
        <StateMsg>
          <span className="spinner" />
        </StateMsg>
      </CartPageShell>
    );
  }

  return (
    <CartPageShell>
      <ContainerInset>
        <CartPageTitle>
          Shopping bag ({count}) {plural(count, "item")}
        </CartPageTitle>

        {isEmpty ? (
          <>
            <EmptyBag $page>
              <BagIcon size={30} />
              <SubSm>Your bag is empty.</SubSm>
              <Button as={Link} to="/shop">
                Shop All
              </Button>

              {suggestions.length ? (
                <EmptyRecs>
                  <SubXs $muted>Best sellers</SubXs>
                  {suggestions.map((product) => (
                    <MiniRow key={product.id} product={product} />
                  ))}
                </EmptyRecs>
              ) : null}
            </EmptyBag>
            <CartCoupon />
          </>
        ) : (
          <CartMain>
            <LineList>
              {cart.items.map((item) => (
                <CartLine
                  key={item.key}
                  item={item}
                  onChange={(quantity) => setQuantity(item.key, quantity)}
                  $page
                />
              ))}
            </LineList>

            <PageSummary>
              <Ledger cart={cart} showEstimate />

              <CartCoupon />

              <PageNote>Discount codes are applied to your bag total.</PageNote>

              <PageActions>
                <Button as={Link} to="/checkout" $large $block>
                  Checkout
                  <ArrowIcon />
                </Button>

                <Button $quiet $block onClick={() => open("cart")}>
                  Continue shopping
                </Button>
              </PageActions>

              <Perks>
                {[
                  Number(cart.totals?.total_items ?? 0) >= FREE_SHIPPING_AT
                    ? "You’ve unlocked free shipping"
                    : `Spend ${money(FREE_SHIPPING_AT - Number(cart.totals?.total_items ?? 0), cart.totals)} for free shipping`,
                  ...ASSURANCE
                ].map((perk) => (
                  <li key={perk}>
                    <CheckIcon size={13} />
                    {perk}
                  </li>
                ))}
              </Perks>
            </PageSummary>
          </CartMain>
        )}
      </ContainerInset>
    </CartPageShell>
  );
}
