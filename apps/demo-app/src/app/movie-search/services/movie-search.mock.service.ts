import { Injectable } from '@angular/core';
import { MovieDetails } from '../store/movie-search.types';

const MOCK_MOVIES: MovieDetails[] = [
  {
    id: 'resultado1',
    title: 'resultado1',
    year: 2024,
    synopsis: 'Drama sobre escolhas sob pressao e relacoes familiares.',
    genres: ['Drama', 'Aventura'],
    rating: 7.9,
    cast: ['Ator A', 'Atriz B', 'Ator C'],
  },
  {
    id: 'resultado2',
    title: 'resultado2',
    year: 2022,
    synopsis: 'Thriller urbano com investigacao e suspense progressivo.',
    genres: ['Suspense', 'Crime'],
    rating: 8.2,
    cast: ['Atriz D', 'Ator E', 'Atriz F'],
  },
  {
    id: 'resultado3',
    title: 'resultado3',
    year: 2020,
    synopsis: 'Ficcao cientifica sobre memoria, tempo e tecnologia.',
    genres: ['Ficcao', 'Mistério'],
    rating: 8.5,
    cast: ['Ator G', 'Atriz H', 'Ator I'],
  },
];

@Injectable({
  providedIn: 'root',
})
export class MovieSearchMockService {
  search(query: string): string[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return MOCK_MOVIES.filter((movie) =>
      movie.title.toLowerCase().includes(normalized),
    ).map((movie) => movie.title);
  }

  getDetails(title: string): MovieDetails | null {
    const normalized = title.trim().toLowerCase();
    const found = MOCK_MOVIES.find(
      (movie) => movie.title.toLowerCase() === normalized,
    );
    return found ?? null;
  }
}
