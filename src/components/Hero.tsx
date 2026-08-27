import { useNavigate } from "react-router-dom";
import ChessBoard from "@/components/ChessBoard";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative py-10">
      <div className="container">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wider text-accent/80">Modern Chess Hub</p>
            <h1 className="text-4xl font-heading font-bold text-card-foreground">Готові до партії?</h1>
            <p className="text-sm text-card-foreground/80">Швидкий доступ до матчів, задач та уроків.</p>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => navigate("/play")}
                className="btn-cta w-48 flex items-center justify-center"
                aria-label="Грати зараз"
              >
                ▶ ГРАТИ ЗАРАЗ
              </button>

              <button
                onClick={() => navigate("/learn")}
                className="border border-[var(--card-border)] px-4 py-2 rounded text-card-foreground bg-transparent uppercase tracking-wider"
              >
                Навчитись грати
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="card p-3">
              <ChessBoard interactive={false} size={320} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
