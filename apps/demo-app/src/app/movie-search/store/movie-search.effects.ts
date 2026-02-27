import { defineKernelEffects } from '@machine-state-component/ui-state';
import { movieSearchActions } from './movie-search.actions';
import { MovieSearchServices, MovieSearchState } from './movie-search.types';

export function createMovieSearchEffects() {
  return defineKernelEffects<MovieSearchState, MovieSearchServices>()(
    movieSearchActions,
    ({ on, actions }) => [
      on(actions.submit, {
        id: 'movie-search-submit-effect',
        priority: 10,
        handler: ({ state, dispatch, services }) => {
          const query = state.query.trim();
          if (!query) {
            dispatch(actions.error('Digite um termo para buscar.'));
            return;
          }

          dispatch(actions.loading());
          const results = services.movieApi.search(query);

          if (!results.length) {
            dispatch(actions.error('Nenhum resultado encontrado.'));
            return;
          }

          dispatch(actions.success(results));
          dispatch(actions.historyRecorded(query));
        },
      }),
      on(actions.selectMovie, {
        id: 'movie-search-details-effect',
        priority: 20,
        handler: ({ event, dispatch, services }) => {
          const name = event.name.trim();
          if (!name) {
            dispatch(actions.detailsError('Filme invalido.'));
            return;
          }

          dispatch(actions.detailsLoading(name));

          const details = services.movieApi.getDetails(name);
          if (!details) {
            dispatch(actions.detailsError('Detalhes nao encontrados.'));
            return;
          }

          dispatch(actions.detailsSuccess(details));
        },
      }),
    ],
  );
}
