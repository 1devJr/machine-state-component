import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { PokemonDetails } from '../store/pokemon-search.types';

interface PokemonListResponse {
  results: Array<{
    name: string;
  }>;
}

interface PokemonApiResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
      };
    };
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
  species: {
    url: string;
  };
}

interface PokemonSpeciesResponse {
  evolution_chain: {
    url: string;
  };
}

interface EvolutionChainNode {
  species: {
    name: string;
  };
  evolves_to: EvolutionChainNode[];
}

interface EvolutionChainResponse {
  chain: EvolutionChainNode;
}

@Injectable({
  providedIn: 'root',
})
export class PokemonSearchApiService {
  readonly #http = inject(HttpClient);

  #cachedNames: string[] | null = null;

  searchByName(term: string): Observable<string[]> {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) {
      return of([]);
    }

    if (this.#cachedNames) {
      return of(this.#filterByTerm(this.#cachedNames, normalizedTerm));
    }

    return this.#http
      .get<PokemonListResponse>('https://pokeapi.co/api/v2/pokemon?limit=1302')
      .pipe(
        map((response) => response.results.map((pokemon) => pokemon.name)),
        tap((names) => {
          this.#cachedNames = names;
        }),
        map((names) => this.#filterByTerm(names, normalizedTerm)),
      );
  }

  getPokemonDetails(name: string): Observable<PokemonDetails> {
    const normalizedName = name.trim().toLowerCase();

    return this.#http
      .get<PokemonApiResponse>(
        `https://pokeapi.co/api/v2/pokemon/${normalizedName}`,
      )
      .pipe(
        switchMap((pokemon) =>
          this.#http.get<PokemonSpeciesResponse>(pokemon.species.url).pipe(
            switchMap((species) =>
              this.#http
                .get<EvolutionChainResponse>(species.evolution_chain.url)
                .pipe(
                  map((evolutionChain) => {
                    const evolutions = this.#extractEvolutionNames(
                      evolutionChain.chain,
                    )
                      .filter((entry) => entry !== pokemon.name)
                      .sort((left, right) => left.localeCompare(right));

                    return this.#toPokemonDetails(pokemon, evolutions);
                  }),
                ),
            ),
          ),
        ),
      );
  }

  #toPokemonDetails(
    pokemon: PokemonApiResponse,
    evolutions: string[],
  ): PokemonDetails {
    return {
      id: pokemon.id,
      name: pokemon.name,
      spriteUrl:
        pokemon.sprites.other?.['official-artwork']?.front_default ??
        pokemon.sprites.front_default,
      types: pokemon.types.map((item) => item.type.name),
      abilities: pokemon.abilities.map((item) => item.ability.name),
      heightDecimeters: pokemon.height,
      weightHectograms: pokemon.weight,
      stats: pokemon.stats.map((item) => ({
        name: item.stat.name,
        value: item.base_stat,
      })),
      evolutions,
    };
  }

  #extractEvolutionNames(chain: EvolutionChainNode): string[] {
    const visited = new Set<string>();

    const walk = (node: EvolutionChainNode): void => {
      visited.add(node.species.name);
      for (const nextNode of node.evolves_to) {
        walk(nextNode);
      }
    };

    walk(chain);
    return Array.from(visited);
  }

  #filterByTerm(names: string[], normalizedTerm: string): string[] {
    return names
      .filter((name) => name.includes(normalizedTerm))
      .sort((left, right) => left.localeCompare(right));
  }
}
