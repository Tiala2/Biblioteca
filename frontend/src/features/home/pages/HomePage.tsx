import { useEffect, useState } from "react";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";

type BookCard = { id: string; title: string; numberOfPages: number; averageRating?: number | null };
type Paged<T> = { content: T[] };

export function HomePage() {
  const { auth } = useAuth();
  const [highlights, setHighlights] = useState<BookCard[]>([]);

  useEffect(() => {
    api
      .get<Paged<BookCard>>("/api/v1/books?page=0&size=3&sort=TRENDING_WEEK&includeWithoutPdf=true")
      .then((r) => setHighlights(r.data.content))
      .catch(() => setHighlights([]));
  }, []);

  return (
    <section className="grid">
      <article className="card hero">
        <h2>Bem-vinda, {auth?.name}</h2>
        <p>Continue sua jornada. Aqui você acompanha estado da trama, personagens e conquistas.</p>
        <p className="quote">"Você não vê dados frios. Você vê a sua história em andamento."</p>
      </article>
      <article className="card">
        <div className="section-head">
          <h3>Sua jornada atual</h3>
          <span className="kpi">Início | Meio | Clímax</span>
        </div>
        <p>Dom Quixote tenta convencer Sancho Pança a seguir em sua primeira aventura.</p>
        <small>Página 42 · fase atual: Início</small>
      </article>
      <article className="card">
        <div className="section-head">
          <h3>Personagens recém conhecidos</h3>
        </div>
        <p className="section-sub">Dom Quixote · sonhador idealista</p>
        <p className="section-sub">Sancho Pança · companheiro pragmático e leal</p>
      </article>
      <article className="card">
        <div className="section-head">
          <h3>Quiz opcional</h3>
        </div>
        <p>Quem foi convencido por Dom Quixote?</p>
        <small>Desafio leve para fixar o trecho, sem pressao competitiva.</small>
      </article>
      <article className="card">
        <div className="section-head">
          <h3>Histórias em alta</h3>
          <span className="kpi">Ranking de livros</span>
        </div>
        <ul>
          {highlights.map((book) => (
            <li key={book.id}>
              {book.title} · {book.numberOfPages} pags · nota {Number(book.averageRating ?? 0).toFixed(1)}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

