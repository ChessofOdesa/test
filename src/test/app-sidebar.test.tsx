import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isGuest: false,
    signOut: vi.fn(),
  }),
}));

describe("App sidebar", () => {
  it("keeps four primary links visible and reveals the rest on demand", () => {
    render(
      <MemoryRouter initialEntries={["/analysis"]}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Головна навігація" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Грати" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Задачі" })).toHaveAttribute("href", "/puzzles");
    expect(screen.getByRole("link", { name: "Уроки" })).toHaveAttribute("href", "/lessons");
    expect(screen.getByRole("link", { name: "Аналіз" })).toHaveAttribute("href", "/analysis");
    expect(screen.getByText("Chess of Odesa")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Онлайн" })).not.toBeInTheDocument();
    expect(screen.queryByText("Одеський клуб")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Показати інші розділи" }));

    expect(screen.getByRole("link", { name: "Головна" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Онлайн" })).toHaveAttribute("href", "/online");
    expect(screen.getByRole("link", { name: "Турніри" })).toHaveAttribute("href", "/tournaments");
    expect(screen.getByRole("button", { name: "Сховати інші розділи" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
