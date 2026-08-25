import { redirect } from "next/navigation";

/**
 * Live spectator lives inside Studio (`?view=live`). Keep /live as a short alias.
 *
 * @example /live → /simulation?view=live
 */
export default function LiveRedirectPage() {
  redirect("/simulation?view=live");
}
