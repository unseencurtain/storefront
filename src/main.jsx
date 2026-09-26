import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "styled-components";
import GlobalStyle from "./shared/styles/GlobalStyle.js";
import theme from "./shared/styles/theme.js";
import App from "./App.jsx";

/**
 * Transitional: the legacy stylesheets still style the features that have not
 * been converted to styled-components yet. Each import is removed as its
 * feature is migrated; the directory goes away once the last one lands.
 */
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/chrome.css";
import "./styles/shop.css";
import "./styles/footer.css";
import "./styles/ui.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>
);
