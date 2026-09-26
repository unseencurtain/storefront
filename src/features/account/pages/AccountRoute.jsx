import { Navigate, useLocation } from "react-router-dom";
import Account from "./Account.jsx";
import { useAccount } from "../AccountContext.jsx";

/**
 * Gate for the account area. The session is restored on boot, so we wait for
 * that first request to settle rather than bouncing a signed-in shopper to the
 * login page on a hard refresh.
 */
export default function AccountRoute() {
  const { isLoggedIn, isResolved } = useAccount();
  const location = useLocation();

  if (!isResolved) {
    return <AccountSkeleton />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Account />;
}

function AccountSkeleton() {
  return (
    <main style={{ minHeight: "55vh", padding: "120px 0" }} aria-busy="true">
      <div className="container">
        <div className="skeleton" style={{ width: 220, height: 40, marginBottom: 20 }} />
        <div className="skeleton" style={{ width: 320, height: 16 }} />
      </div>
    </main>
  );
}
