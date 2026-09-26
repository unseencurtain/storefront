import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUI, useBodyLock } from "../../../shared/UIContext.jsx";
import { useCategories } from "../../../shared/lib/catalog.js";
import {
  CloseIcon,
  MenuIcon,
  SearchIcon,
  AccountIcon,
  BagIcon,
  ArrowIcon,
  CheckIcon
} from "../../../shared/ui/Icons.jsx";
import { ButtonLink, IconButton } from "../../../shared/ui/primitives.js";
import { Wordmark } from "./chrome.js";
import {
  Scrim,
  Drawer,
  DrawerHead,
  DrawerBody,
  DrawerFoot,
  MenuSearch,
  MenuNav,
  MenuRow,
  MenuLink,
  MenuToggle,
  MenuSub,
  MenuSubList,
  MenuSubLink,
  MenuUtils,
  MenuSocial,
  MenuSocialLink
} from "./chrome.js";
import { AccordionIcon } from "../../../shared/ui/primitives.js";
import { SOCIALS } from "./Footer.jsx";

/**
 * Mobile navigation drawer.
 *
 * Accordion taxonomy over a full-height panel, with account, help and social
 * pinned to the bottom. Slides in from the left, matching the desktop drawer's
 * timing so the two feel like the same system.
 */
export default function MobileMenu({ onOpenSearch, onOpenCart }) {
  const { isOpen, close } = useUI();
  const open = isOpen("menu");
  const { roots } = useCategories();
  const [expanded, setExpanded] = useState(null);
  const panelRef = useRef(null);

  useBodyLock(open);

  // Start collapsed each time the drawer is opened.
  useEffect(() => {
    if (open) setExpanded(null);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const first = panelRef.current?.querySelector(
      "button, a[href], input, [tabindex]:not([tabindex='-1'])"
    );
    first?.focus();
  }, [open]);

  return (
    <>
      <Scrim $open={open} onClick={close} aria-hidden="true" />

      <Drawer
        as="div"
        ref={panelRef}
        $side="left"
        $open={open}
        role="dialog"
        aria-modal={open}
        aria-label="Menu"
        aria-hidden={!open}
      >
        <DrawerHead>
          <Wordmark as={Link} to="/" $small onClick={close}>
            CEREVE
          </Wordmark>

          <IconButton type="button" onClick={close} aria-label="Close menu">
            <MenuIcon open size={20} />
          </IconButton>
        </DrawerHead>

        <DrawerBody>
          <MenuSearch
            type="button"
            onClick={() => {
              close();
              onOpenSearch();
            }}
          >
            <SearchIcon size={18} />
            <span>Search</span>
          </MenuSearch>

          <MenuNav aria-label="Mobile">
            <NavRow label="Shop All" to="/shop" onNavigate={close} strong />

            {roots.map((category) => (
              <div key={category.id}>
                <NavRow
                  label={category.name}
                  to={category.href}
                  onNavigate={close}
                  expanded={expanded === category.id}
                  onToggle={() =>
                    setExpanded((current) => (current === category.id ? null : category.id))
                  }
                />

                {category.children?.length ? (
                  <MenuSub $open={expanded === category.id}>
                    <li>
                      <MenuSubList>
                        {category.children.map((child) => (
                          <li key={child.id}>
                            <MenuSubLink as={Link} to={child.href} onClick={close}>
                              {child.name}
                            </MenuSubLink>
                          </li>
                        ))}
                      </MenuSubList>
                    </li>
                  </MenuSub>
                ) : null}
              </div>
            ))}

            <NavRow label="Bestsellers" to="/shop?sort=popularity" onNavigate={close} />
            <NavRow label="My Account" to="/account" onNavigate={close} />
            <NavRow label="Help & Contact" to="/help" onNavigate={close} />
          </MenuNav>
        </DrawerBody>

        <DrawerFoot $row>
          <MenuUtils>
            <li>
              <ButtonLink as={Link} to="/account" onClick={close}>
                <AccountIcon size={16} />
                Account
              </ButtonLink>
            </li>
            <li>
              <ButtonLink
                type="button"
                onClick={() => {
                  close();
                  onOpenCart();
                }}
              >
                <BagIcon size={16} />
                Bag
              </ButtonLink>
            </li>
          </MenuUtils>

          <MenuSocial>
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <MenuSocialLink
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                >
                  <social.icon size={17} />
                </MenuSocialLink>
              </li>
            ))}
          </MenuSocial>
        </DrawerFoot>
      </Drawer>
    </>
  );
}

function NavRow({ label, to, onNavigate, expanded, onToggle, strong }) {
  if (!onToggle) {
    return (
      <MenuLink as={Link} to={to} onClick={onNavigate} $strong={strong}>
        {label}
        <ArrowIcon size={13} />
      </MenuLink>
    );
  }

  return (
    <MenuRow>
      <MenuLink as={Link} to={to} onClick={onNavigate} $strong={strong}>
        {label}
      </MenuLink>

      <MenuToggle
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
      >
        <AccordionIcon $open={expanded} aria-hidden="true" />
      </MenuToggle>
    </MenuRow>
  );
}

export { CheckIcon, CloseIcon };
