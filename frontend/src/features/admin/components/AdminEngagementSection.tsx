import type { FormEvent } from "react";
import { AdminSection } from "./AdminSection";
import { BadgePanel } from "./BadgePanel";
import { FavoriteAdminPanel } from "./FavoriteAdminPanel";
import type { Badge, BadgeForm, FavoriteAdmin } from "../types";

type AdminEngagementSectionProps = {
  form: BadgeForm;
  badges: Badge[];
  favorites: FavoriteAdmin[];
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: BadgeForm) => BadgeForm) => void;
  onEdit: (badge: Badge) => void;
  onReset: () => void;
  onDelete: (badgeId: string) => void;
};

export function AdminEngagementSection({
  form,
  badges,
  favorites,
  busyKey,
  onSubmit,
  onFormChange,
  onEdit,
  onReset,
  onDelete,
}: AdminEngagementSectionProps) {
  return (
    <AdminSection
      eyebrow="Engajamento"
      title="Gamificacao e comunidade"
      description="Acompanhe mecanismos de permanencia, reputacao social e uso real da plataforma."
    >
      <BadgePanel
        form={form}
        badges={badges}
        busyKey={busyKey}
        onSubmit={onSubmit}
        onFormChange={onFormChange}
        onEdit={onEdit}
        onReset={onReset}
        onDelete={onDelete}
      />

      <FavoriteAdminPanel favorites={favorites} />
    </AdminSection>
  );
}
