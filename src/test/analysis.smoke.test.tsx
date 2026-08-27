import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Analysis from "@/pages/Analysis";
import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";

vi.mock("@/components/ChessBoard", () => ({
  default: () => <div data-testid="analysis-board" />,
}));

vi.mock("react-chessboard", () => ({
  Chessboard: () => <div data-testid="analysis-editor-board" />,
}));

vi.mock("@/lib/stockfish", () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue({
    backend: "worker",
    scoreCp: 18,
    scoreMate: null,
    bestmove: "e2e4",
    raw: [],
    pv: ["e2e4", "e7e5", "g1f3"],
    lines: [],
  }),
}));

describe("Analysis page", () => {
  it("renders without crashing", async () => {
    render(
      <MemoryRouter initialEntries={["/analysis"]}>
        <BoardSettingsProvider>
          <Analysis />
        </BoardSettingsProvider>
      </MemoryRouter>,
    );

    expect(await screen.findAllByText(/Аналіз|РђРЅР°Р»С–Р·/i)).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: /Розпочати аналіз|Р РѕР·РїРѕС‡Р°С‚Рё Р°РЅР°Р»С–Р·/i })).toBeInTheDocument();
    expect(screen.getByTestId("analysis-board")).toBeInTheDocument();
  });
});
