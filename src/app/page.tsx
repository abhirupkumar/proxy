import Hero from "@/components/custom/hero";
import { getUser } from "@/lib/queries";

export default async function Home() {
  const user = await getUser();
  return (
    <>
      <Hero user={user} />
    </>
  );
}
