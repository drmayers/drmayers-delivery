 "use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { full_name: string; phone: string | null; role: string };
type User = { id: string; email: string };
type Order = {
  id: string;
  customer_id: string;
  vendor_id: string | null;
  rider_id: string | null;
  pickup_address: string;
  delivery_address: string;
  service_type: string;
  amount: number;
  delivery_fee: number;
  status: string;
  created_at: string;
};

const nextStatus: Record<string, string> = {
  order_placed: "vendor_accepted",
  vendor_accepted: "rider_accepted",
  rider_accepted: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered"
};

export default function HomeClient({
  initialUser,
  initialProfile
}: {
  initialUser: User | null;
  initialProfile: Profile | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [mode, setMode] = useState<"home" | "login" | "signup" | "dashboard">("home");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("id,customer_id,vendor_id,rider_id,pickup_address,delivery_address,service_type,amount,delivery_fee,status,created_at")
      .order("created_at", { ascending: false });
    if (!error) setOrders((data ?? []) as Order[]);
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email ?? "" };
        setUser(u);
        const { data } = await supabase.from("profiles").select("full_name,phone,role").eq("id", u.id).maybeSingle();
        setProfile(data);
        setMode("dashboard");
        await loadOrders();
      } else {
        setUser(null); setProfile(null); setOrders([]); setMode("home");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => { if (user) loadOrders(); }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    setMessage("Signed out.");
  }

  async function signIn(email: string, password: string) {
    setLoading(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
  }

  async function signUp(name: string, phone: string, email: string, password: string) {
    setLoading(true); setMessage("");
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name, phone } }
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    setMessage(data.session
      ? "Account created and signed in."
      : "Account created. Check your email to confirm, then sign in.");
  }

  async function createOrder(form: FormData) {
    if (!user) return;
    setLoading(true); setMessage("");
    const payload = {
      customer_id: user.id,
      pickup_address: String(form.get("pickup_address") || ""),
      delivery_address: String(form.get("delivery_address") || ""),
      service_type: String(form.get("service_type") || "parcel"),
      amount: Number(form.get("amount") || 0),
      delivery_fee: Number(form.get("delivery_fee") || 0),
      status: "order_placed"
    };
    const { error } = await supabase.from("orders").insert(payload);
    setLoading(false);
    if (error) return setMessage(error.message);
    setMessage("Order placed successfully.");
    await loadOrders();
  }

  async function advanceOrder(order: Order) {
    const status = nextStatus[order.status];
    if (!status) return;
    setLoading(true); setMessage("");
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    setLoading(false);
    if (error) setMessage(error.message);
    else await loadOrders();
  }

  const role = profile?.role || "customer";
  const visibleOrders = role === "customer"
    ? orders.filter(o => o.customer_id === user?.id)
    : role === "vendor"
      ? orders.filter(o => o.vendor_id === user?.id)
      : role === "rider"
        ? orders.filter(o => o.rider_id === user?.id)
        : orders;

  return (
    <main className="shell">
      <header className="nav">
        <div>
          <div className="brand">Drmayers <span>Delivery</span></div>
          <div className="tagline">Connected delivery platform for Nasarawa State</div>
        </div>
        <div className="nav-actions">
          {user ? <>
            <button className="ghost" onClick={() => setMode("dashboard")}>Dashboard</button>
            <button className="ghost" onClick={signOut}>Sign out</button>
          </> : <>
            <button className="ghost" onClick={() => setMode("login")}>Log in</button>
            <button className="primary" onClick={() => setMode("signup")}>Create account</button>
          </>}
        </div>
      </header>

      {message && <div className="notice">{message}</div>}

      {mode === "home" && !user && (
        <section className="hero">
          <div>
            <p className="eyebrow">NASARAWA • DELIVERY • LOCAL COMMERCE</p>
            <h1>Food, groceries, parcels and express delivery.</h1>
            <p className="lead">
              A real Supabase-connected starting point for customers, vendors, riders and admins.
              Customer accounts and orders are stored in your database.
            </p>
            <button className="primary big" onClick={() => setMode("signup")}>Create customer account</button>
          </div>
          <div className="card coverage">
            <h3>Initial coverage</h3>
            <p>Lafia · Keffi · Akwanga · Karu · Nasarawa · Doma · Keana · Obi · Awe · Wamba · Kokona · Toto · Nasarawa-Eggon</p>
          </div>
        </section>
      )}

      {mode === "login" && !user && (
        <AuthForm title="Welcome back" submitLabel="Log in" loading={loading}
          onSubmit={(f) => signIn(String(f.get("email")), String(f.get("password")))}
          footer={<button className="link" onClick={() => setMode("signup")}>Need an account? Sign up</button>} />
      )}

      {mode === "signup" && !user && (
        <AuthForm title="Create customer account" submitLabel="Create account" signup loading={loading}
          onSubmit={(f) => signUp(String(f.get("full_name")), String(f.get("phone")), String(f.get("email")), String(f.get("password")))}
          footer={<button className="link" onClick={() => setMode("login")}>Already registered? Log in</button>} />
      )}

      {user && mode === "dashboard" && (
        <section className="dashboard">
          <div className="dash-head">
            <div>
              <p className="eyebrow">{role.toUpperCase()} DASHBOARD</p>
              <h2>Hello, {profile?.full_name || user.email}</h2>
              <p className="muted">Signed in as {user.email}</p>
            </div>
            {role === "customer" && <button className="primary" onClick={() => setMode("home")}>New order</button>}
          </div>

          <div className="grid2">
            {role === "customer" && (
              <div className="card">
                <h3>Place a delivery</h3>
                <form action={createOrder} className="form">
                  <label>Pickup address<input name="pickup_address" required placeholder="e.g. Akwanga market" /></label>
                  <label>Delivery address<input name="delivery_address" required placeholder="Destination" /></label>
                  <label>Service
                    <select name="service_type" defaultValue="parcel">
                      <option value="food">Food</option><option value="groceries">Groceries</option>
                      <option value="parcel">Parcel</option><option value="express">Express</option>
                    </select>
                  </label>
                  <div className="row">
                    <label>Item amount (₦)<input name="amount" type="number" min="0" defaultValue="0" /></label>
                    <label>Delivery fee (₦)<input name="delivery_fee" type="number" min="0" defaultValue="0" /></label>
                  </div>
                  <button className="primary" disabled={loading}>{loading ? "Saving..." : "Place order"}</button>
                </form>
              </div>
            )}

            <div className={role === "customer" ? "card" : "card full"}>
              <h3>{role === "admin" ? "All orders" : "Orders"}</h3>
              {visibleOrders.length === 0 ? <p className="muted">No orders available for this account yet.</p> : (
                <div className="orders">
                  {visibleOrders.map(o => (
                    <div className="order" key={o.id}>
                      <div className="order-top">
                        <strong>#{o.id.slice(0,8)}</strong>
                        <span className="badge">{o.status.replaceAll("_"," ")}</span>
                      </div>
                      <p>{o.pickup_address} → {o.delivery_address}</p>
                      <small>{o.service_type} · ₦{Number(o.amount || 0).toLocaleString()} + ₦{Number(o.delivery_fee || 0).toLocaleString()} delivery</small>
                      {role !== "customer" && nextStatus[o.status] && (
                        <button className="small-action" disabled={loading} onClick={() => advanceOrder(o)}>
                          Mark: {nextStatus[o.status].replaceAll("_"," ")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <footer>Drmayers Delivery • Supabase-connected starter</footer>
    </main>
  );
}

function AuthForm({
  title, submitLabel, signup, loading, onSubmit, footer
}: {
  title: string; submitLabel: string; signup?: boolean; loading: boolean;
  onSubmit: (form: FormData) => void | Promise<void>; footer: React.ReactNode;
}) {
  return (
    <section className="auth card">
      <p className="eyebrow">DRMAYERS DELIVERY</p>
      <h2>{title}</h2>
      <form action={onSubmit} className="form">
        {signup && <>
          <label>Full name<input name="full_name" required placeholder="Your name" /></label>
          <label>Phone<input name="phone" placeholder="+234..." /></label>
        </>}
        <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
        <label>Password<input name="password" type="password" required minLength={6} placeholder="At least 6 characters" /></label>
        <button className="primary" disabled={loading}>{loading ? "Please wait..." : submitLabel}</button>
      </form>
      {footer}
    </section>
  );
}
