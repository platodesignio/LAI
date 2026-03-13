import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { SafeUser } from "@/types";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await requireSession();

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const safeUser: SafeUser = user;

  return <ProfileForm user={safeUser} />;
}
