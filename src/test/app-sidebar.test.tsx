import { secondaryNavigation } from "@/app/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, isGuest: false, signOut: vi.fn() }) }));
describe("Application navigation", () => {
    it("exposes four working destinations and marks the current workspace", () => {
        render(<MemoryRouter initialEntries={["/analysis"]}><AppHeader /></MemoryRouter>);
        const nav = screen.getByRole("navigation", { name: "Головна навігація" });
        expect(nav.querySelectorAll("a")).toHaveLength(4);
        expect(screen.getByRole("link", { name: "Аналіз" })).toHaveAttribute("aria-current", "page");
        expect(secondaryNavigation.some(item => ["/messages", "/tournaments", "/quests", "/ai-trainer"].includes(item.path))).toBe(false);
    });
});
