import { useEffect, useState } from "react";
import styled from "styled-components";
import { useUI, useBodyLock } from "../../../shared/UIContext.jsx";
import { CloseIcon, ArrowIcon } from "../../../shared/ui/Icons.jsx";
import { SubMd, SubSm, BodySm, Muted, IconButton } from "../../../shared/ui/primitives.js";
import {
  AnnounceBar,
  AnnounceButton,
  AnnounceText,
  AnnounceChevron,
  Scrim,
  Drawer,
  DrawerHead
} from "./chrome.js";

/** The rotating offer strip above the header, with its own disclosure panel. */
const OFFERS = [
  {
    title: "Free EU shipping over €75",
    body: "Standard shipping is free on qualifying orders. Rates at checkout follow WooCommerce zones."
  },
  {
    title: "Shop 2,000+ brands",
    body: "Use the Brands menu or the shop filter to jump straight to a house."
  },
  {
    title: "Pharmacy & prestige",
    body: "Parapharmacy, drugstore, makeup and professional hair in one catalogue."
  }
];

const OfferList = styled.ul`
  flex: 1;
  overflow-y: auto;
  padding: 8px 32px 40px;

  @media (max-width: 1023px) {
    padding: 8px 16px 40px;
  }
`;

const OfferItem = styled.li`
  padding: 20px 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.greyLightish};
`;

const OfferTitle = styled(SubSm)`
  color: ${({ theme: t }) => t.color.cocoa};
  margin-bottom: 6px;
`;

const OfferBody = styled(BodySm)`
  ${Muted};
  max-width: 40ch;
`;

export default function AnnouncementBar() {
  const { isOpen, open, close } = useUI();
  const drawerOpen = isOpen("offers");
  const [index, setIndex] = useState(0);

  useBodyLock(drawerOpen);

  useEffect(() => {
    if (drawerOpen) return undefined;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % OFFERS.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [drawerOpen]);

  return (
    <>
      <AnnounceBar>
        <AnnounceButton type="button" onClick={() => open("offers")}>
          {/* Keyed so the slide-in animation replays on each rotation. */}
          <AnnounceText key={index}>{OFFERS[index].title}</AnnounceText>
          <AnnounceChevron aria-hidden="true">
            <ArrowIcon size={14} direction="right" />
          </AnnounceChevron>
        </AnnounceButton>
      </AnnounceBar>

      <Scrim $open={drawerOpen} $z={55} onClick={close} aria-hidden="true" />

      <Drawer
        $open={drawerOpen}
        $width="min(420px, 100%)"
        $side="right"
        style={{ zIndex: 80 }}
        role="dialog"
        aria-modal={drawerOpen}
        aria-label="Current promotions"
        aria-hidden={!drawerOpen}
      >
        <DrawerHead>
          <SubMd as="h2">Promotions</SubMd>
          <IconButton type="button" onClick={close} aria-label="Close promotions">
            <CloseIcon />
          </IconButton>
        </DrawerHead>

        <OfferList>
          {OFFERS.map((offer) => (
            <OfferItem key={offer.title}>
              <OfferTitle>{offer.title}</OfferTitle>
              <OfferBody>{offer.body}</OfferBody>
            </OfferItem>
          ))}
        </OfferList>
      </Drawer>
    </>
  );
}
