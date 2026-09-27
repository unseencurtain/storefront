import styled from "styled-components";
import { BodySm, H1, Page } from "../../../shared/ui/accountLayout.js";
import { mq } from "../../../shared/styles/theme.js";

export const DetailShell = styled(Page)`
  padding-top: 40px;

  ${mq.lg} {
    padding-top: 28px;
  }
`;

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.cocoa};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const DetailHeader = styled.header`
  margin-bottom: 36px;

  ${H1} {
    margin-bottom: 10px;
  }
`;

/**
 * Shipping / billing / payment used to be bare text on the page wash, so the
 * labels butted straight up against the item panel above with no padding. They
 * are cards now: bordered, padded, and evenly distributed on a shared gap.
 */
export const InfoGrid = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  margin: 40px 0;

  ${mq.lg} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${mq.md} {
    grid-template-columns: minmax(0, 1fr);
  }

  @media (min-width: ${({ theme: t }) => t.bp.lg}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const InfoCard = styled.div`
  min-width: 0;
  padding: 24px 22px;
  border: 1px solid ${({ theme: t }) => t.color.grey300};

  ${mq.lg} {
    padding: 20px 18px;
  }
`;

export const DetailList = styled.ul`
  display: flex;
  flex-direction: column;
`;

export const DetailRow = styled.li`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey300};

  &:last-child {
    border-bottom: 0;
  }
`;

export const LineImage = styled.div`
  display: flex;
`;

export const Thumbnail = styled.div`
  width: 64px;
  height: 82px;
  background: ${({ theme: t }) => t.color.grey200};
  object-fit: cover;
`;

export const LineName = styled(BodySm)`
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const LineMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
  font-size: ${({ theme: t }) => t.type.bodyXs[0]};
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

export const LineQty = styled.span`
  white-space: nowrap;
`;

export const TotalsBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme: t }) => t.color.grey300};
  max-width: 320px;
  margin-left: auto;
`;

export const TotalsRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  color: ${({ theme: t, $strong }) => ($strong ? t.color.cocoa : t.color.sonicSilver)};
  font-weight: ${({ $strong }) => ($strong ? 600 : 400)};

  ${({ $strong }) =>
    $strong &&
    `
    padding-top: 10px;
    border-top: 1px solid;
  `}
`;

export const DetailAddress = styled.address`
  margin: 0;
  font-style: normal;
`;

export const DetailLabel = styled.dt`
  margin: 0 0 10px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

export const DetailValue = styled.dd`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  line-height: 1.6;
  color: ${({ theme: t }) => t.color.cocoa};
  text-align: ${({ $align }) => ($align === "right" ? "right" : "left")};
  white-space: ${({ $nowrap }) => ($nowrap ? "nowrap" : "normal")};
`;

export const OrderView = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: ${({ theme: t }) => t.type.bodyXs[0]};
  letter-spacing: 0.075rem;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
`;
