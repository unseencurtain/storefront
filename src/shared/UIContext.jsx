import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

/**
 * One overlay at a time, mirroring how the reference storefronts behave:
 * opening search dismisses the bag, and Escape closes whatever is up.
 */
const UIContext = createContext(null);

const OVERLAYS = new Set(["cart", "search", "menu", "msearch", "offers"]);

export function UIProvider({ children }) {
  const [overlay, setOverlay] = useState(null);
  const triggerRef = useRef(null);

  const open = useCallback((name) => {
    if (!OVERLAYS.has(name)) return;
    setOverlay(name);
  }, []);

  const close = useCallback(() => setOverlay(null), []);

  const toggle = useCallback((name) => {
    setOverlay((current) => (current === name ? null : name));
  }, []);

  // Remember which control opened the overlay so focus can be handed back.
  useEffect(() => {
    if (overlay) triggerRef.current = document.activeElement;
  }, [overlay]);

  useEffect(() => {
    if (!overlay) {
      const previous = triggerRef.current;
      if (previous && typeof previous.focus === "function" && previous.isConnected) {
        previous.focus();
      }
      triggerRef.current = null;
    }
  }, [overlay]);

  useEffect(() => {
    if (!overlay) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [overlay, close]);

  const value = useMemo(
    () => ({ overlay, isOpen: (name) => overlay === name, open, close, toggle }),
    [overlay, open, close, toggle]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used inside <UIProvider>");
  return context;
}

/** Freeze background scroll while an overlay owns the viewport. */
export function useBodyLock(active) {
  useEffect(() => {
    if (!active) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    body.classList.add("is-locked");

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      body.classList.remove("is-locked");
    };
  }, [active]);
}

/** Close a panel when a pointer press lands outside of it. */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const onPointerDown = (event) => {
      const node = ref.current;
      if (!node || node.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [ref, handler, active]);
}

/** Delay a value — used to debounce predictive search requests. */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
