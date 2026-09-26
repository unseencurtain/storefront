import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { CartProvider } from "./features/cart/CartContext.jsx";
import { AccountProvider } from "./features/account/AccountContext.jsx";
import { UIProvider } from "./shared/UIContext.jsx";
import Layout from "./features/layout/components/Layout.jsx";
import Home from "./features/catalog/pages/Home.jsx";
import Shop from "./features/catalog/pages/Shop.jsx";
import ProductPage from "./features/catalog/pages/ProductPage.jsx";
import CartPage from "./features/cart/pages/CartPage.jsx";
import Checkout from "./features/checkout/pages/Checkout.jsx";
import SearchPage from "./features/search/pages/SearchPage.jsx";
import Login from "./features/account/pages/Login.jsx";
import Signup from "./features/account/pages/Signup.jsx";
import AccountRoute from "./features/account/pages/AccountRoute.jsx";
import ContentPage, { NotFound } from "./features/content/pages/ContentPage.jsx";

/** Two-segment collection paths, e.g. /shop/fashion/shoes. */
function ShopRoute() {
  const { slug, child } = useParams();
  return <Shop key={`${slug ?? ""}/${child ?? ""}`} />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Cart first: the account context needs to re-read the bag on sign in
          so a guest cart is reflected in state once it belongs to a user. */}
      <CartProvider>
        <AccountProvider>
          <UIProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />

                <Route path="shop" element={<Shop />} />
                <Route path="shop/:slug" element={<ShopRoute />} />
                <Route path="shop/:slug/:child" element={<ShopRoute />} />

                <Route path="product/:slug" element={<ProductPage />} />
                <Route path="products/:slug" element={<ProductPage />} />

                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="search" element={<SearchPage />} />

                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                <Route path="account" element={<AccountRoute />} />

                <Route path="about" element={<ContentPage />} />
                <Route path="help" element={<ContentPage />} />

                <Route path="collection/:slug" element={<ShopRoute />} />
                <Route path="bags" element={<Navigate to="/cart" replace />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </UIProvider>
        </AccountProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
