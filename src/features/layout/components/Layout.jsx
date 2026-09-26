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

/** Persistent chrome: announcement, header, every overlay, footer. */
export default function Layout() {
  const { open, close } = useUI();
  const { announcement } = useCart();
  const location = useLocation();

  // Route changes dismiss any open overlay and return the reader to the top.
  useEffect(() => {
    close();
    window.scrollTo({ top: 0 });
  }, [location.pathname, close]);

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
