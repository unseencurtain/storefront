import { Component } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "styled-components";
import GlobalStyle from "./shared/styles/GlobalStyle.js";
import theme from "./shared/styles/theme.js";
import App from "./App.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/chrome.css";
import "./styles/shop.css";
import "./styles/footer.css";
import "./styles/ui.css";

class BootError extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <pre style={{ margin: 0, padding: 24, whiteSpace: "pre-wrap", color: "#271f1f" }}>
          {String(this.state.error?.stack || this.state.error)}
        </pre>
      );
    }

    return this.props.children;
  }
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root");
}

createRoot(root).render(
  <StrictMode>
    <BootError>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </BootError>
  </StrictMode>
);
