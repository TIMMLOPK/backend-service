"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { IconLoader2 } from "@tabler/icons-react";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChildCard } from "@/components/children/child-card";
import { AddChildModal } from "@/components/children/add-child-modal";
import { ROUTES } from "@/lib/constants";
import type { ChildOverview } from "@/lib/types";

export default function ChildrenPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [children, setChildren] = useState<ChildOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.user_type !== "parent") {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const fetchChildren = async () => {
    try {
      const data = await api<ChildOverview[]>("/api/v1/parent/children");
      setChildren(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.user_type === "parent") {
      fetchChildren();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Children</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your children&apos;s learning progress
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          size="md"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Add Child
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No children added yet
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mb-4">
            Add a child account to monitor their learning progress and manage
            their courses.
          </p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Your First Child
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}

      <AddChildModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          fetchChildren();
        }}
      />
    </div>
  );
}
