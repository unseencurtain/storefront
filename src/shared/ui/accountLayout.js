import styled from "styled-components";
import { mq } from "../styles/theme.js";
import {
  Container,
  H1,
  H2,
  H3,
  LeadMd,
  BodySm,
  BodyXs,
  SubSm,
  Button,
  ButtonLink,
  Divider,
  Skeleton
} from "./primitives.js";

export const Page = styled.main`
  min-height: 55vh;
  padding-bottom: 120px;
`;

export const PageHeader = styled.header`
  padding: 72px 0 44px;

  ${mq.lg} {
    padding: 40px 0 28px;
  }
`;

export const Greeting = styled(H1)`
  margin-bottom: 12px;
`;

export const Panel = styled.section`
  border: 1px solid ${({ theme: t }) => t.color.grey300};
  padding: 32px;

  ${mq.lg} {
    padding: 24px 20px;
  }
`;

export const PanelHeader = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 22px;
  margin-bottom: 28px;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey300};
`;

export const SectionTitle = styled(H3)`
  margin-bottom: 6px;
`;

export const Tabs = styled.nav`
  display: flex;
  gap: 28px;
  margin-bottom: 36px;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey300};
`;

export const Tab = styled(ButtonLink)`
  padding-bottom: 14px;
  border-bottom: 1.5px solid
    ${({ theme: t, $active }) => ($active ? t.color.cocoa : "transparent")};
  color: ${({ theme: t, $active }) => ($active ? t.color.cocoa : t.color.sonicSilver)};

  &:hover {
    color: ${({ theme: t }) => t.color.cocoa};
  }
`;

export const ProfileGrid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  ${mq.md} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SaveBar = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid ${({ theme: t }) => t.color.grey300};
`;

export const Saved = styled(BodyXs)`
  color: ${({ theme: t }) => t.color.kabulHover};
`;

/* ---- Order history ------------------------------------------- */

export const OrderList = styled.ul`
  display: flex;
  flex-direction: column;
`;

export const OrderRow = styled.li`
  display: grid;
  gap: 6px 24px;
  padding: 26px 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey300};

  &:last-child {
    border-bottom: 0;
  }

  @media (min-width: 768px) {
    grid-template-columns: 1fr auto;
    align-items: start;
  }
`;

export const OrderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

export const OrderNumber = styled(SubSm)`
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const OrderTotal = styled.div`
  text-align: left;

  @media (min-width: 768px) {
    text-align: right;
  }
`;

export const OrderItems = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
`;

export const Thumb = styled.li`
  width: 56px;
  height: 72px;
  background: ${({ theme: t }) => t.color.grey200};
  object-fit: cover;
`;

export const StatusPill = styled.span`
  display: inline-block;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: ${({ theme: t, $paid }) => ($paid ? t.color.dawnPink : t.color.grey300)};
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const Empty = styled.div`
  display: grid;
  gap: 18px;
  padding: 64px 0;
  text-align: center;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

export const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 26px 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey300};
`;

export const SignOutButton = styled(Button)`
  ${mq.lg} {
    width: 100%;
  }
`;

export {
  Container,
  H1,
  H2,
  LeadMd,
  BodySm,
  Button,
  ButtonLink,
  Divider,
  Skeleton
};
