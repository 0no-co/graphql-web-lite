import React from 'react';
import { render } from 'react-dom';
import Pokemons from './Pokemons';

const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
});

render(
  <React.StrictMode>
    <Provider value={client}>
      <Pokemons />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);