import { render, screen } from "@testing-library/react";
import { AdminAlertsPage } from "./AdminAlertsPage";
import { AdminCatalogPage } from "./AdminCatalogPage";
import { AdminEngagementPage } from "./AdminEngagementPage";
import { AdminUsersPage } from "./AdminUsersPage";

const adminPageSpy = vi.fn();

vi.mock("./AdminPage", () => {
  return {
    AdminPage: (props: { visibleSections?: string[] }) => {
      adminPageSpy(props);
      return <div>admin-page-mock</div>;
    },
  };
});

describe("Admin route pages", () => {
  beforeEach(() => {
    adminPageSpy.mockReset();
  });

  it("deve abrir catalogo com a secao correta", () => {
    render(<AdminCatalogPage />);

    expect(screen.getByText("admin-page-mock")).toBeInTheDocument();
    expect(adminPageSpy).toHaveBeenCalledWith({ visibleSections: ["catalog"] });
  });

  it("deve abrir engajamento com a secao correta", () => {
    render(<AdminEngagementPage />);

    expect(screen.getByText("admin-page-mock")).toBeInTheDocument();
    expect(adminPageSpy).toHaveBeenCalledWith({ visibleSections: ["engagement"] });
  });

  it("deve abrir usuarios com a secao correta", () => {
    render(<AdminUsersPage />);

    expect(screen.getByText("admin-page-mock")).toBeInTheDocument();
    expect(adminPageSpy).toHaveBeenCalledWith({ visibleSections: ["users"] });
  });

  it("deve abrir alertas com a secao correta", () => {
    render(<AdminAlertsPage />);

    expect(screen.getByText("admin-page-mock")).toBeInTheDocument();
    expect(adminPageSpy).toHaveBeenCalledWith({ visibleSections: ["alerts"] });
  });
});
