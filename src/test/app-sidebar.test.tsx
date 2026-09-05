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
  it("renders the complete Ukrainian navigation and can collapse", () => {
    render(
      <MemoryRouter initialEntries={["/analysis"]}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Головна навігація" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Грати" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Аналіз" })).toHaveAttribute("href", "/analysis");
    expect(screen.getByText("Chess of Odesa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Згорнути меню" }));

    expect(screen.queryByText("Chess of Odesa")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Розгорнути меню" })).toBeInTheDocument();
  });
});
