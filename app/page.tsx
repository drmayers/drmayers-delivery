import { createClient } from "@/lib/supabase/server";
import HomeClient from "./home-client";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, role")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <HomeClient
      initialUser={user ? { id: user.id, email: user.email ?? "" } : null}
      initialProfile={profile}
    />
  );
}
