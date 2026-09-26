import { useState } from "react";
import { Link } from "react-router-dom";
import { EmailCapture } from "../../../shared/ui/Accordion.jsx";
import {
  Button,
  Container,
  H2,
  SubSm,
  SubXs,
  BodyMd,
  BodyXs,
  AccordionRoot,
  AccordionTrigger,
  AccordionIcon,
  AccordionPanel,
  AccordionContent
} from "../../../shared/ui/primitives.js";
import {
  SiteFooter,
  Mission,
  MissionInner,
  MissionTitle,
  MissionBody,
  FooterMain,
  FooterMainInner,
  FooterNavDesktop,
  FooterNavMobile,
  FooterNavColumn,
  FooterNavHeading,
  FooterNavLink,
  FooterAccordionRoot,
  FooterAccordionList,
  CommitmentsHead,
  CommitmentsList,
  CommitmentItem,
  CommitmentLink,
  FooterNews,
  FooterLocale,
  FooterLocaleInner,
  FooterLocaleList,
  FooterLocaleItem,
  FooterLegal,
  FooterLegalInner,
  FooterLegalLinks,
  FooterLegalLink,
  FooterLegalSocial,
  FooterLegalSocialLink
} from "./footer.js";
import {
  ArrowIcon,
  ChevronIcon,
  InstagramIcon,
  TikTokIcon,
  FacebookIcon,
  YouTubeIcon,
  PinterestIcon,
  XIcon,
  PlanetIcon,
  BunnyIcon,
  AccessibilityIcon
} from "../../../shared/ui/Icons.jsx";

/**
 * Footer.
 *
 * Four stacked bands, matching the editorial reference: a light mission panel,
 * then the rose-clay main footer carrying the link columns, commitments and
 * newsletter, then the locale row, then a legal strip with social and payment
 * marks. Link columns collapse into accordions on small screens.
 */

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { label: "Bestsellers", to: "/shop?sort=popularity" },
      { label: "All Products", to: "/shop" },
      { label: "Gifts + Sets", to: "/shop?tag=Gift" },
      { label: "Gift Cards", to: "/shop?tag=Gift+Card" },
      { label: "Find a Store", to: "/help" },
      { label: "Rewards", to: "/help" }
    ]
  },
  {
    heading: "Help",
    links: [
      { label: "My Account", to: "/account" },
      { label: "Shipping + Delivery", to: "/help" },
      { label: "Track Package", to: "/account" },
      { label: "Start a Return", to: "/help" },
      { label: "Contact Us", to: "/help" },
      { label: "FAQ", to: "/help" }
    ]
  },
  {
    heading: "About",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Sustainability", to: "/about" },
      { label: "Careers", to: "/about" },
      { label: "Affiliates", to: "/about" },
      { label: "Press", to: "/about" },
      { label: "Clean at Cereve", to: "/about" }
    ]
  },
  {
    heading: "Promotion Details",
    links: [
      { label: "Current Promotions", to: "/help" },
      { label: "Student Discounts", to: "/help" },
      { label: "Teacher Discounts", to: "/help" },
      { label: "First Order Offer", to: "/help" }
    ]
  }
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { label: "TikTok", href: "https://tiktok.com", icon: TikTokIcon },
  { label: "Facebook", href: "https://facebook.com", icon: FacebookIcon },
  { label: "YouTube", href: "https://youtube.com", icon: YouTubeIcon },
  { label: "Pinterest", href: "https://pinterest.com", icon: PinterestIcon },
  { label: "X", href: "https://x.com", icon: XIcon }
];

const COMMITMENTS = [
  { label: "1% For The Planet", icon: PlanetIcon, to: "/about" },
  { label: "Leaping Bunny", icon: BunnyIcon, to: null },
  { label: "Accessibility", icon: AccessibilityIcon, to: "/help" }
];

const LEGAL = [
  { label: "Privacy", to: "/about" },
  { label: "Terms", to: "/about" },
  { label: "CA Privacy", to: "/about" },
  { label: "Do Not Sell or Share My Personal Information", to: "/about" },
  { label: "Accessibility", to: "/help" },
  { label: "Sitemap", to: "/shop" }
];

const MARKETS = ["$US", "£GB", "€EU", "$CA", "$AU"];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <SiteFooter>
      {/* Mission panel */}
      <Mission>
        <Container>
          <MissionInner>
            <MissionTitle as={H2}>Makeup That Makes Your Skin Better™</MissionTitle>

            <MissionBody as={BodyMd}>
              We believe clean beauty is thoughtful beauty—with carefully-selected
              ingredients meant to perform harmoniously and to protect your skin.
            </MissionBody>

            <Button as={Link} to="/about" $variant="secondary">
              Learn More
            </Button>
          </MissionInner>
        </Container>
      </Mission>

      {/* Main footer */}
      <FooterMain>
        <Container>
          <FooterMainInner>
          <FooterNav />

          <div>
            <CommitmentsHead as={SubXs}>Commitments</CommitmentsHead>

            <CommitmentsList>
              {COMMITMENTS.map((item) => {
                const inner = <item.icon size={26} />;

                return (
                  <CommitmentItem key={item.label}>
                    {item.to ? (
                      <CommitmentLink as={Link} to={item.to} aria-label={item.label}>
                        {inner}
                      </CommitmentLink>
                    ) : (
                      <span aria-label={item.label}>{inner}</span>
                    )}
                  </CommitmentItem>
                );
              })}
            </CommitmentsList>
          </div>

          <FooterNews>
            <SubSm as="h2">15% off your first order</SubSm>

            <EmailCapture
              subhead="Be the first to hear about product launches, exclusive sales, and more news."
              placeholder="Email"
              submitLabel="Send"
              onSubmit={async (email) => {
                // No mailing-list provider is wired up in this environment, so
                // the signup is accepted locally rather than silently failing.
                console.info("Newsletter signup", email);
                await new Promise((resolve) => setTimeout(resolve, 400));
              }}
            />
          </FooterNews>
          </FooterMainInner>
        </Container>
      </FooterMain>

      {/* Locale row */}
      <FooterLocale>
        <Container>
          <FooterLocaleInner>
            <SubXs as="span">Currency</SubXs>

            <FooterLocaleList>
              {MARKETS.map((market, index) => (
                <li key={market}>
                  <FooterLocaleItem type="button" $active={index === 0}>
                    {market}
                    {index === 0 ? <span aria-hidden="true">✓</span> : null}
                  </FooterLocaleItem>
                </li>
              ))}
            </FooterLocaleList>
          </FooterLocaleInner>
        </Container>
      </FooterLocale>

      {/* Legal strip */}
      <FooterLegal>
        <Container>
          <FooterLegalInner>
            <BodyXs as="p">©{year} Cereve. All rights reserved.</BodyXs>

            <FooterLegalLinks>
              {LEGAL.map((item) => (
                <li key={item.label}>
                  <FooterLegalLink as={Link} to={item.to}>
                    {item.label}
                  </FooterLegalLink>
                </li>
              ))}
            </FooterLegalLinks>

            <FooterLegalSocial>
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <FooterLegalSocialLink
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                  >
                    <social.icon size={17} />
                  </FooterLegalSocialLink>
                </li>
              ))}
            </FooterLegalSocial>
          </FooterLegalInner>
        </Container>
      </FooterLegal>
    </SiteFooter>
  );
}

/* ------------------------------------------------------------------ *
 * Link columns — a grid on desktop, an accordion on small screens.
 * ------------------------------------------------------------------ */

function FooterNav() {
  return (
    <div>
      <FooterNavDesktop>
        {COLUMNS.map((column) => (
          <FooterNavColumn key={column.heading} aria-label={column.heading}>
            <FooterNavHeading>{column.heading}</FooterNavHeading>

            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <FooterNavLink as={Link} to={link.to}>
                    {link.label}
                  </FooterNavLink>
                </li>
              ))}
            </ul>
          </FooterNavColumn>
        ))}
      </FooterNavDesktop>

      <FooterNavMobile>
        {COLUMNS.map((column) => (
          <FooterAccordion key={column.heading} column={column} />
        ))}
      </FooterNavMobile>
    </div>
  );
}

function FooterAccordion({ column }) {
  const [open, setOpen] = useState(false);
  const id = `footer-${column.heading.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <AccordionRoot as={FooterAccordionRoot}>
      <AccordionTrigger as="h3">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {column.heading}
          <AccordionIcon $open={open} aria-hidden="true" />
        </button>
      </AccordionTrigger>

      <AccordionPanel id={id} $open={open} role="region">
        <AccordionContent>
          <FooterAccordionList>
            {column.links.map((link) => (
              <li key={link.label}>
                <FooterNavLink as={Link} to={link.to}>
                  {link.label}
                </FooterNavLink>
              </li>
            ))}
          </FooterAccordionList>
        </AccordionContent>
      </AccordionPanel>
    </AccordionRoot>
  );
}

export { SOCIALS, COLUMNS, ArrowIcon, ChevronIcon };
