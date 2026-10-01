import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUI, useBodyLock, useDebounced } from "../../../shared/UIContext.jsx";
import { getProducts } from "../../../shared/lib/woo.js";
import { useCategories } from "../../../shared/lib/catalog.js";
import { ProductTile } from "../../catalog/components/ProductCard.jsx";
import { CloseIcon, SearchIcon, ArrowIcon, CheckIcon } from "../../../shared/ui/Icons.jsx";
import {
  Container,
  SubSm,
  BodySm,
  Tag,
  SrOnly,
  ButtonLink,
  IconButton,
  Skeleton
} from "../../../shared/ui/primitives.js";
import {
  Scrim,
  SearchPanel,
  SearchInner,
  SearchForm,
  SearchField,
  SearchIconSlot,
  SearchInput,
  SearchActions,
  SearchClear,
  SearchBody,
  SearchSplit,
  SearchRailHead,
  SearchTags,
  SearchProductsHead,
  SearchGrid,
  SearchEmpty
} from "../../layout/components/chrome.js";

const RESULT_LIMIT = 4;
const SUGGESTION_POOL = ["mascara", "serum", "perfume", "shampoo", "sunscreen", "retinol"];

/**
 * Predictive search panel.
 *
 * A magnifier in the header drops a full-width sheet over the page. Before you
 * type it suggests popular searches and shows best sellers; while you type it
 * swaps to live product matches, query suggestions, and a link through to the
 * full result page. Everything is debounced and guarded against out-of-order
 * responses.
 */
export default function SearchOverlay() {
  const { isOpen, close } = useUI();
  const open = isOpen("search");
  const navigate = useNavigate();
  const { roots } = useCategories();

  const [term, setTerm] = useState("");
  const [state, setState] = useState("idle"); // idle | searching | results | empty
  const [results, setResults] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const sequence = useRef(0);

  const debounced = useDebounced(term.trim(), 300);

  useBodyLock(open);

  // Reset to the idle state each time the panel is opened.
  useEffect(() => {
    if (!open) return;
    setTerm("");
    setResults([]);
    setState("idle");

    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [open]);

  // Warm the best-seller rail shown before anything is typed.
  useEffect(() => {
    if (!open || bestsellers.length) return;

    let alive = true;
    getProducts({ perPage: RESULT_LIMIT, orderby: "popularity", order: "desc" })
      .then((result) => alive && setBestsellers(result.items))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [open, bestsellers.length]);

  // Live results.
  useEffect(() => {
    if (!open) return undefined;

    if (!debounced) {
      setResults([]);
      setState("idle");
      return undefined;
    }

    const ticket = ++sequence.current;
    setState("searching");

    getProducts({ search: debounced, perPage: RESULT_LIMIT })
      .then((result) => {
        if (ticket !== sequence.current) return;
        setResults(result.items);
        setState(result.items.length ? "results" : "empty");
      })
      .catch(() => {
        if (ticket === sequence.current) setState("empty");
      });

    return undefined;
  }, [debounced, open]);

  const submit = useCallback(
    (event) => {
      event?.preventDefault();
      const value = term.trim();
      if (!value) return;
      close();
      navigate(`/search?q=${encodeURIComponent(value)}`);
    },
    [term, close, navigate]
  );

  const clear = useCallback(() => {
    sequence.current += 1;
    setTerm("");
    setResults([]);
    setState("idle");
    inputRef.current?.focus();
  }, []);

  // Arrow-key navigation through the result list, Escape to dismiss.
  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      const first = panelRef.current?.querySelector("a[href], .tag");
      if (first) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.key === "ArrowUp" && document.activeElement === inputRef.current) {
      event.preventDefault();
    }
  }

  const popular = SUGGESTION_POOL.filter((word) => roots.some((root) =>
    [root.name, ...(root.children ?? []).map((child) => child.name)]
      .join(" ")
      .toLowerCase()
      .includes(word.slice(0, 4))
  )).slice(0, 5);

  return (
    <>
      <Scrim $open={open} $z={60} $tone="dim" onClick={close} aria-hidden="true" />

      <SearchPanel
        as="div"
        ref={panelRef}
        $open={open}
        role="dialog"
        aria-modal={open}
        aria-label="Search"
        aria-hidden={!open}
      >
        <Container>
          <SearchInner>
          <SearchForm role="search" onSubmit={submit}>
            <SearchField>
              <SearchIconSlot as={SearchIcon} size={18} />

              <SearchInput
                as="input"
                ref={inputRef}
                type="search"
                name="q"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search products and categories"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                aria-label="Search products and categories"
                aria-expanded={state === "results"}
                tabIndex={open ? 0 : -1}
              />

              <SearchActions>
                {term ? (
                  <SearchClear type="button" onClick={clear} tabIndex={open ? 0 : -1}>
                    Clear
                  </SearchClear>
                ) : null}

                <IconButton
                  type="button"
                  onClick={close}
                  aria-label="Close search"
                  tabIndex={open ? 0 : -1}
                >
                  <CloseIcon />
                </IconButton>
              </SearchActions>
            </SearchField>
          </SearchForm>

          <SearchBody $busy={state === "searching"}>
            <SrOnly as="p" role="status" aria-live="polite">
              {state === "searching"
                ? "Searching…"
                : state === "results"
                  ? `${results.length} product${results.length === 1 ? "" : "s"} found for ${debounced}.`
                  : state === "empty"
                    ? `No results found for ${debounced}. Showing best sellers.`
                    : ""}
            </SrOnly>

            {state === "idle" ? (
              <IdleState roots={roots} bestsellers={bestsellers} popular={popular} onPick={setTerm} />
            ) : null}

            {state === "results" ? (
              <ResultsState
                term={debounced}
                results={results}
                onViewAll={() => {
                  close();
                  navigate(`/search?q=${encodeURIComponent(debounced)}`);
                }}
                roots={roots}
                onPick={setTerm}
              />
            ) : null}

            {state === "empty" ? (
              <EmptyState term={debounced} bestsellers={bestsellers} />
            ) : null}
          </SearchBody>
          </SearchInner>
        </Container>
      </SearchPanel>
    </>
  );
}

function IdleState({ roots, bestsellers, popular, onPick }) {
  const categories = roots.flatMap((root) => [
    root,
    ...(root.children ?? [])
  ]).slice(0, 6);

  return (
    <SearchSplit>
      <section>
        <SubSm as="h2">Popular Categories</SubSm>

        <SearchTags>
          {(categories.length ? categories : []).map((category) => (
            <li key={category.id}>
              <Tag as={Link} to={category.href}>
                {category.name}
              </Tag>
            </li>
          ))}
        </SearchTags>

        {popular.length ? (
          <>
            <SearchRailHead as={SubSm}>Popular Searches</SearchRailHead>
            <SearchTags>
              {popular.map((word) => (
                <li key={word}>
                  <Tag type="button" onClick={() => onPick(word)}>
                    {word}
                  </Tag>
                </li>
              ))}
            </SearchTags>
          </>
        ) : null}
      </section>

      <section>
        <SubSm as="h2">Popular Products</SubSm>
        <ProductStrip products={bestsellers} />
      </section>
    </SearchSplit>
  );
}

function ResultsState({ term, results, onViewAll, roots, onPick }) {
  const suggestions = buildSuggestions(term, roots).slice(0, 5);

  return (
    <SearchSplit>
      <section>
        {suggestions.length ? (
          <>
            <SubSm as="h2">Suggestions</SubSm>
            <SearchTags>
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <Tag type="button" onClick={() => onPick(suggestion)}>
                    {suggestion}
                  </Tag>
                </li>
              ))}
            </SearchTags>
          </>
        ) : null}

        <SearchRailHead as={SubSm}>Categories</SearchRailHead>
        <SearchTags>
          {roots.slice(0, 5).map((root) => (
            <li key={root.id}>
              <Tag as={Link} to={root.href}>
                {root.name}
              </Tag>
            </li>
          ))}
        </SearchTags>
      </section>

      <section>
        <SearchProductsHead>
          <SubSm as="h2">
            {results.length} Product{results.length === 1 ? "" : "s"}
          </SubSm>

          <ButtonLink type="button" onClick={onViewAll}>
            View all results for “{term}”
            <ArrowIcon />
          </ButtonLink>
        </SearchProductsHead>

        <ProductStrip products={results} />
      </section>
    </SearchSplit>
  );
}

function EmptyState({ term, bestsellers }) {
  return (
    <SearchEmpty>
      <SubSm as="p">Sorry, there are no search results for “{term}”.</SubSm>
      <BodySm as="p" $muted>
        Please check the spelling or try a different search term.
      </BodySm>

      <SearchRailHead as={SubSm}>Our Best Sellers</SearchRailHead>
      <ProductStrip products={bestsellers} />
    </SearchEmpty>
  );
}

function ProductStrip({ products }) {
  if (!products.length) {
    return (
      <SearchGrid>
        {Array.from({ length: RESULT_LIMIT }, (_, index) => (
          <li key={index}>
            <Skeleton $tile />
          </li>
        ))}
      </SearchGrid>
    );
  }

  return (
    <SearchGrid>
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile product={product} />
        </li>
      ))}
    </SearchGrid>
  );
}

/** Category names and product words that start with what has been typed. */
function buildSuggestions(term, roots) {
  const needle = term.toLowerCase();
  const names = roots.flatMap((root) => [root.name, ...(root.children ?? []).map((c) => c.name)]);

  const prefix = names
    .filter((name) => name.toLowerCase().startsWith(needle.slice(0, 3)))
    .map((name) => name.toLowerCase());

  const contains = names
    .filter((name) => !prefix.includes(name.toLowerCase()) && name.toLowerCase().includes(needle))
    .map((name) => name.toLowerCase());

  return [...new Set([...prefix, ...contains, ...SUGGESTION_POOL.filter((w) => w.startsWith(needle))])];
}

export { CheckIcon };
