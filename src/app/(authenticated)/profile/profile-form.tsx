"use client";

import { useState } from "react";
import type { SafeUser } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/error";

interface ProfileFormProps {
  user: SafeUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to update profile"
        );
      }
      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to change password"
        );
      }
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-12">
      <div>
        <h1 className="text-2xl font-semibold text-black mb-1">Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account information.</p>
      </div>

      {/* Profile section */}
      <section>
        <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-4">
          Account
        </h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email
            </label>
            <Input
              value={user.email}
              disabled
              className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Email cannot be changed.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="text-black border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Role
            </label>
            <Input
              value={user.role}
              disabled
              className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            />
          </div>

          {profileError && <FormError message={profileError} />}
          {profileSuccess && <FormSuccess message={profileSuccess} />}

          <Button
            type="submit"
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>

      {/* Password section */}
      <section>
        <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-4">
          Change password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Current password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="text-black border-gray-300"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              New password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className="text-black border-gray-300"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Confirm new password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="text-black border-gray-300"
              autoComplete="new-password"
            />
          </div>

          {passwordError && <FormError message={passwordError} />}
          {passwordSuccess && <FormSuccess message={passwordSuccess} />}

          <Button
            type="submit"
            disabled={changingPassword}
            className="bg-black text-white hover:bg-gray-800"
          >
            {changingPassword ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
