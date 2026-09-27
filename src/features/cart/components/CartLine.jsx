import { Link } from "react-router-dom";
import { useCart } from "../CartContext.jsx";
import QuantityStepper from "../../../shared/ui/QuantityStepper.jsx";
import { CloseIcon } from "../../../shared/ui/Icons.jsx";
import { money, plural } from "../../../shared/lib/format.js";
import { SrOnly } from "../../../shared/ui/primitives.js";
import {
  LineControls,
  LineInfo,
  LineMedia,
  LineName,
  LineNames,
  LinePrice,
  LineRemoveIcon,
  LineRemoveLink,
  LineRow,
  LineTop,
  LineVariant,
  PageLine
} from "../cart.css.js";

/** One bag line. `$page` swaps the drawer's dense rhythm for the page's
 *  roomier one and the icon remove button for a text link. */
export function CartLine({ item, onChange, $page = false }) {
  const { busy } = useCart();
  const image = item.images?.[0];
  const variation = item.variation?.length ? item.variation.map((v) => v.value).join(", ") : "";
  // The drawer renders at 88px wide and prefers the thumbnail; the page is
  // wider and prefers the full-size source.
  const src = $page ? image?.src ?? image?.thumbnail : image?.thumbnail ?? image?.src;

  const Row = $page ? PageLine : LineRow;

  return (
    <Row $busy={busy.has(`item:${item.key}`)}>
      <LineMedia as={Link} to={`/product/${item.slug ?? item.id}`} tabIndex={-1} aria-hidden="true">
        {src ? <img src={src} alt="" loading="lazy" /> : null}
      </LineMedia>

      <LineInfo>
        <LineTop>
          <LineNames>
            <LineName as={Link} to={`/product/${item.slug ?? item.id}`}>
              {item.name}
            </LineName>
            {variation ? <LineVariant>{variation}</LineVariant> : null}
            {$page ? (
              <SrOnly>
                {item.quantity} {plural(Number(item.quantity), "unit")} in bag
              </SrOnly>
            ) : null}
          </LineNames>

          <LinePrice>{money(item.totals?.line_total, item.totals)}</LinePrice>
        </LineTop>

        <LineControls>
          <QuantityStepper
            value={item.quantity}
            onChange={onChange}
            min={Math.max(1, item.quantity_limits?.minimum ?? 1)}
            max={item.quantity_limits?.maximum ?? 9999}
            label={`quantity of ${item.name}`}
          />

          {$page ? <PageRemove itemKey={item.key} name={item.name} /> : <RemoveIcon itemKey={item.key} name={item.name} />}
        </LineControls>
      </LineInfo>
    </Row>
  );
}

function RemoveIcon({ itemKey, name }) {
  const { removeItem, busy } = useCart();
  const pending = busy.has(`item:${itemKey}`);

  return (
    <LineRemoveIcon
      onClick={() => removeItem(itemKey)}
      disabled={pending}
      aria-label={name ? `Remove ${name} from bag` : "Remove item from bag"}
    >
      <CloseIcon size={14} />
    </LineRemoveIcon>
  );
}

function PageRemove({ itemKey, name }) {
  const { removeItem, busy } = useCart();
  const pending = busy.has(`item:${itemKey}`);

  return (
    <LineRemoveLink
      onClick={() => removeItem(itemKey)}
      disabled={pending}
      aria-label={name ? `Remove ${name} from bag` : "Remove item from bag"}
    >
      Remove
    </LineRemoveLink>
  );
}
