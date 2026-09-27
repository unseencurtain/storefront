import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useUI } from "../../../shared/UIContext.jsx";
import { SrOnly, SkipLink } from "../../../shared/ui/primitives.js";
import Header from "./Header.jsx";
import AnnouncementBar from "./AnnouncementBar.jsx";
import MobileMenu from "./MobileMenu.jsx";
import SearchOverlay from "../../search/components/SearchOverlay.jsx";
import CartDrawer from "../../cart/components/CartDrawer.jsx";
import Footer from "./Footer.jsx";
import { useCart } from "../../../features/cart/CartContext.jsx";

/** Checkout is a focused task, not a browsing page: it keeps the wordmark and
 *  the legal line it renders itself, and drops the promo bar, nav, marketing
 *  footer and overlays. Matches the reference checkout, which has no store
 *  chrome at all. */
const BARE_ROUTES = ["/checkout"];

function isBare(pathname) {
  return BARE_ROUTES.some((route) => pathname.startsWith(route));
}

/** Persistent chrome: announcement, header, every overlay, footer. */
export default function Layout() {
  const { open, close } = useUI();
  const { announcement, clearError } = useCart();
  const location = useLocation();
  const bare = isBare(location.pathname);

  // Route changes dismiss any open overlay, drop a stale cart error (the
  // banner is global, so an error raised in the bag would otherwise follow
  // the shopper into checkout) and return the reader to the top.
  useEffect(() => {
    close();
    clearError();
    window.scrollTo({ top: 0 });
  }, [location.pathname, close, clearError]);

  if (bare) {
    return (
      <>
        <SkipLink href="#main">Skip to content</SkipLink>

        <div id="main">
          <Outlet />
        </div>

        <SrOnly as="p" role="status" aria-live="polite">
          {announcement}
        </SrOnly>
      </>
    );
  }

  return (
    <>
      <SkipLink href="#main">Skip to content</SkipLink>

      <AnnouncementBar />
      <Header
        onOpenSearch={() => open("search")}
        onOpenMenu={() => open("menu")}
        onOpenCart={() => open("cart")}
      />

      <div id="main">
        <Outlet />
      </div>

      <Footer />

      <MobileMenu onOpenSearch={() => open("search")} onOpenCart={() => open("cart")} />
      <SearchOverlay />
      <CartDrawer />

      <SrOnly as="p" role="status" aria-live="polite">
        {announcement}
      </SrOnly>
    </>
  );
}
