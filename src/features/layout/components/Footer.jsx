import { Link } from "react-router-dom";
import { EmailCapture } from "../../../shared/ui/Accordion.jsx";
import {
  Button,
  Container,
  H2,
  SubSm,
  BodyMd,
  BodyXs
} from "../../../shared/ui/primitives.js";
import {
  SiteFooter,
  Mission,
  MissionInner,
  MissionTitle,
  MissionBody,
  FooterClient,
  ClientBrand,
  ClientMark,
  ClientCopy,
  ClientAddress,
  FooterMain,
  FooterMainInner,
  FooterNavDesktop,
  FooterNavMobile,
  FooterNavColumn,
  FooterNavHeading,
  FooterNavLink,
  FooterNews,
  FooterNewsSocial,
  FooterLegal,
  FooterLegalInner,
  FooterLegalLinks,
  FooterLegalLink,
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
} from "../../../shared/ui/Icons.jsx";
import { STORE_NAME } from "../../../shared/lib/branding.js";

/**
 * Footer.
 *
 * Four stacked bands, matching the editorial reference: a light mission panel,
 * then the rose-clay main footer carrying the link columns and newsletter,
 * then the locale row, then a legal strip with social and payment
 * marks. Link columns collapse into accordions on small screens.
 */

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { label: "Bestsellers", to: "/shop?sort=popularity" },
      { label: "All Products", to: "/shop" },
      { label: "Brands", to: "/brands" },
      { label: "Gifts", to: "/shop/gifts" }
    ]
  },
  {
    heading: "Help",
    links: [
      { label: "My Account", to: "/account" },
      { label: "Track Package", to: "/order-tracking" },
      { label: "Contact Us", to: "/contact" }
    ]
  },
  {
    heading: "About",
    links: [
      { label: "About Us", to: "/about" }
    ]
  },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { label: "TikTok", href: "https://tiktok.com", icon: TikTokIcon },
  { label: "Facebook", href: "https://facebook.com", icon: FacebookIcon },
  { label: "YouTube", href: "https://youtube.com", icon: YouTubeIcon },
  { label: "Pinterest", href: "https://pinterest.com", icon: PinterestIcon },
  { label: "X", href: "https://x.com", icon: XIcon }
];

const LEGAL = [
  { label: "Privacy", to: "/privacy-policy" },
  { label: "Terms", to: "/terms-and-conditions" },
  { label: "Returns", to: "/refund-and-returns" },
  { label: "Refunds", to: "/refund-and-returns" }
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <SiteFooter>
      {/* Mission panel */}
      <Mission>
        <Container>
          <MissionInner>
            <MissionTitle as={H2}>Thousands of brands. One checkout.</MissionTitle>

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
            <FooterClient>
            <ClientBrand>
              <ClientMark aria-hidden="true">P</ClientMark>
              <SubSm as="h2">PrinsCosmetic</SubSm>
            </ClientBrand>
            <ClientCopy as={BodyMd}>
              A premium destination for authentic perfumes, skincare, makeup and
              gift sets — sourced directly from the world's most celebrated brands.
            </ClientCopy>
            <ClientAddress as={BodyMd}>
              Lovely Perfume Store B.V.<br />
              Bargelaan 200, 2333 CW Leiden<br />
              The Netherlands
            </ClientAddress>
            </FooterClient>
           <FooterNav />

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
            <FooterNewsSocial aria-label="Social media">
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
            </FooterNewsSocial>
          </FooterNews>
          </FooterMainInner>
        </Container>
      </FooterMain>

      {/* Legal strip */}
      <FooterLegal>
        <Container>
          <FooterLegalInner>
            <BodyXs as="p">©{year} {STORE_NAME}. All rights reserved.</BodyXs>

            <FooterLegalLinks>
              {LEGAL.map((item) => (
                <li key={item.label}>
                  <FooterLegalLink as={Link} to={item.to}>
                    {item.label}
                  </FooterLegalLink>
                </li>
              ))}
            </FooterLegalLinks>

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
      </FooterNavMobile>
    </div>
  );
}

export { SOCIALS, COLUMNS, ArrowIcon, ChevronIcon };
