import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useAccount } from "../../account/AccountContext.jsx";
import { useCategories, useFeatured } from "../../../shared/lib/catalog.js";
import { ProductTile } from "../../catalog/components/ProductCard.jsx";
import {
  ArrowIcon,
  SearchIcon,
  AccountIcon,
  BagIcon,
  MenuIcon
} from "../../../shared/ui/Icons.jsx";
import {
  Container,
  H2,
  SubSm,
  SubXs,
  BodySm,
  ButtonLink,
  IconButton,
  Skeleton
} from "../../../shared/ui/primitives.js";
import {
  SiteHeader,
  TopBar as TopBarGrid,
  TopBarSide,
  Burger,
  Wordmark,
  TopBarUtils,
  CartButton,
  CartCount,
  NavRail,
  NavRailList,
  NavRailItem,
  NavRailLink,
  NavRailRule,
  NavRailSkeleton,
  Mega as MegaShell,
  MegaClip,
  MegaInner,
  MegaPanel,
  MegaLead,
  MegaLinks,
  MegaLink,
  MegaBlurb,
  MegaProducts,
  MegaProductGrid
} from "./chrome.js";

/**
 * Header navigation.
 *
 * Layout follows the editorial reference: a slim utility bar above a centred
 * wordmark, with the category links spread edge to edge beneath it. Those
 * links are buttons — activating one drops a full-width panel from under the
 * bar rather than navigating straight away, the way a modern beauty storefront
 * handles its taxonomy. A hover sweep swaps an already-open panel instantly.
 */
export default function Header({ onOpenSearch, onOpenMenu, onOpenCart }) {
  const { roots, loading } = useCategories();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(null);
  const closeTimer = useRef(null);

  // Any navigation dismisses the panel.
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const items = useMemo(() => {
    const categories = roots.map((root) => ({
      id: `cat-${root.id}`,
      label: root.name,
      kind: "category",
      href: root.href,
      category: root
    }));

    return [
      { id: "all", label: "Shop All", kind: "all", href: "/shop" },
      ...categories,
      { id: "best", label: "Bestsellers", kind: "best", href: "/shop?sort=popularity" }
    ];
  }, [roots]);

  const openItem = items.find((item) => item.id === openMenu) ?? null;
  const columns = useMemo(() => buildColumns(openItem), [openItem]);
  const products = usePanelProducts(openItem);
  const onNavigate = () => setOpenMenu(null);

  function activate(item) {
    clearTimeout(closeTimer.current);
    setOpenMenu((current) => (current === item.id ? null : item.id));
  }

  /** Grace period so a diagonal mouse path into the panel doesn't dismiss it. */
  function scheduleClose() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  }

  function cancelClose() {
    clearTimeout(closeTimer.current);
  }

  return (
    <SiteHeader>
      <TopBar onOpenSearch={onOpenSearch} onOpenMenu={onOpenMenu} onOpenCart={onOpenCart} />

      <NavRail onMouseLeave={scheduleClose}>
        <Container>
          <NavRailList aria-label="Primary">
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <NavRailItem key={index} aria-hidden="true">
                    <NavRailSkeleton as={Skeleton} />
                  </NavRailItem>
                ))
              : items.map((item) => {
                  const isOpen = openMenu === item.id;

                  return (
                    <NavRailItem key={item.id}>
                      <NavRailLink
                        type="button"
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        onClick={() => activate(item)}
                        onMouseEnter={() => {
                          cancelClose();
                          // Hovering opens the panel outright; only the click
                          // handler toggles, so re-entering never closes it.
                          setOpenMenu(item.id);
                        }}
                      >
                        <span>{item.label}</span>
                        <NavRailRule $on={isOpen} />
                      </NavRailLink>
                    </NavRailItem>
                  );
                })}
          </NavRailList>
        </Container>
        <MegaShell
          $open={Boolean(openItem)}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <MegaClip>
            <MegaPanel $open={Boolean(openItem)} aria-hidden={!openItem}>
              {openItem ? (
                <Container>
                  <MegaInner>
                    <MegaLead>
                      <SubXs $muted>Browse</SubXs>

                      <H2>{panelTitle(openItem)}</H2>

                      <ButtonLink as={Link} to={openItem.href} onClick={onNavigate} $lg>
                        Shop all
                        <ArrowIcon />
                      </ButtonLink>
                    </MegaLead>

                    <MegaLinks>
                      {columns.map((column, index) => (
                        <div key={column.heading ?? `col-${index}`}>
                          {column.heading ? <SubSm>{column.heading}</SubSm> : null}

                          {column.links?.length ? (
                            <ul>
                              {column.links.map((link) => (
                                <li key={link.href}>
                                  <MegaLink as={Link} to={link.href} onClick={onNavigate}>
                                    {link.label}
                                  </MegaLink>
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          {column.promo ? (
                            <ButtonLink as={Link} to={column.promo.href} onClick={onNavigate}>
                              {column.promo.label}
                              <ArrowIcon />
                            </ButtonLink>
                          ) : null}
                        </div>
                      ))}
                    </MegaLinks>

                    <MegaProducts>
                      <SubXs $muted>
                        {openItem.kind === "category" ? "Popular in category" : "Featured"}
                      </SubXs>

                      <MegaProductGrid>
                        {products.length ? (
                          products.map((product) => (
                            <li key={product.id}>
                              <ProductTile product={product} onNavigate={onNavigate} />
                            </li>
                          ))
                        ) : (
                          Array.from({ length: 4 }, (_, index) => (
                            <li key={index}>
                              <Skeleton $tile />
                            </li>
                          ))
                        )}
                      </MegaProductGrid>
                    </MegaProducts>
                  </MegaInner>
                </Container>
              ) : null}
            </MegaPanel>
          </MegaClip>
        </MegaShell>
      </NavRail>
    </SiteHeader>
  );
}

/* ------------------------------------------------------------------ *
 * Utility bar
 * ------------------------------------------------------------------ */

function TopBar({ onOpenSearch, onOpenMenu, onOpenCart }) {
  const { isLoggedIn } = useAccount();

  return (
    <TopBarGrid>
        <TopBarSide>
          <Burger type="button" onClick={onOpenMenu} aria-label="Open menu">
            <MenuIcon open={false} size={20} />
          </Burger>
        </TopBarSide>

        <Wordmark as={Link} to="/" aria-label="Cereve, home">
          CEREVE
        </Wordmark>

        <TopBarUtils>
          <IconButton type="button" onClick={onOpenSearch} aria-label="Search">
            <SearchIcon />
          </IconButton>

          <IconButton
            as={Link}
            to={isLoggedIn ? "/account" : "/login"}
            aria-label={isLoggedIn ? "Your account" : "Sign in"}
          >
            <AccountIcon />
          </IconButton>

          <BagButton onClick={onOpenCart} />
        </TopBarUtils>
    </TopBarGrid>
  );
}

function BagButton({ onClick }) {
  const { count } = useCart();
  const [bump, setBump] = useState(false);
  const previous = useRef(count);

  useEffect(() => {
    if (count > previous.current) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 500);
      previous.current = count;
      return () => clearTimeout(timer);
    }

    previous.current = count;
    return undefined;
  }, [count]);

  return (
    <CartButton as={IconButton} type="button" onClick={onClick}
      aria-label={`Open shopping bag, ${count} item${count === 1 ? "" : "s"}`}>
      <BagIcon />
      {count > 0 ? (
        <CartCount $animate={bump} aria-hidden="true">
          {count}
        </CartCount>
      ) : null}
    </CartButton>
  );
}

/* ------------------------------------------------------------------ *
 * The dropdown box
 * ------------------------------------------------------------------ */

function panelTitle(item) {
  if (!item) return "";
  if (item.kind === "category") return item.category.name;
  if (item.kind === "best") return "Most loved";
  return "Everything";
}

/**
 * The panel stays mounted between hovers so it can animate, so `item` is null
 * whenever the menu is closed — every branch has to tolerate that.
 */
function buildColumns(item) {
  if (!item) return [];

  if (item.kind === "category") {
    const children = item.category.children ?? [];

    if (children.length) {
      return [
        { heading: "Shop by Category", links: children.map((child) => ({ label: child.name, href: child.href })) },
        { heading: "More", links: [{ label: `All ${item.category.name}`, href: item.category.href }] }
      ];
    }

    return [
      {
        heading: "Explore",
        links: [{ label: `All ${item.category.name}`, href: item.category.href }],
        promo: { label: `Shop all ${item.category.name}`, href: item.category.href }
      }
    ];
  }

  if (item.kind === "all") {
    return [{ heading: "Start here", links: [{ label: "View everything", href: "/shop" }, { label: "Bestsellers", href: "/shop?sort=popularity" }] }];
  }

  return [{ heading: "Popular right now", links: [{ label: "See all bestsellers", href: "/shop?sort=popularity" }] }];
}

/** Featured tiles shown in the panel's right column. */
function usePanelProducts(item) {
  const categorySlug = item?.kind === "category" ? item.category.slug : "";
  const inCategory = useFeatured(categorySlug, 4);
  const everything = useFeatured("", 4);

  return item?.kind === "category" ? inCategory : everything;
}
