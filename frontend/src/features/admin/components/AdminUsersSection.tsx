import type { FormEvent } from "react";
import { UserPanel } from "./UserPanel";
import { AdminSection } from "./AdminSection";
import type { UserAdmin, UserForm } from "../types";

type AdminUsersSectionProps = {
  form: UserForm;
  currentUserEmail: string;
  busyKey: string | null;
  users: UserAdmin[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  search: string;
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  roleFilter: "ALL" | "USER" | "ADMIN";
  loading: boolean;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: UserForm) => UserForm) => void;
  onEdit: (user: UserAdmin) => void;
  onReset: () => void;
  onInvalidate: (userId: string) => void;
  onReactivate: (userId: string) => void;
  onSearchChange: (value: string) => void;
  onActiveFilterChange: (value: "ALL" | "ACTIVE" | "INACTIVE") => void;
  onRoleFilterChange: (value: "ALL" | "USER" | "ADMIN") => void;
  onPageChange: (page: number) => void;
};

export function AdminUsersSection(props: AdminUsersSectionProps) {
  return (
    <AdminSection
      eyebrow="Operacao"
      title="Gestao de usuarios"
      description="Edite dados basicos, aplique filtros reais do backend e controle acesso sem apagar historico de leitura, reviews e auditoria."
      variant="wide"
    >
      <UserPanel {...props} />
    </AdminSection>
  );
}
