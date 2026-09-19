export const images = {
  night: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=900&q=82',
  tide: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82',
  city: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=82',
  desert: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=82',
  red: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=82',
  road: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=82',
  coast: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=82',
  portrait: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=82'
};

export const catalog = [
  { id: 'afterlight', title: 'Afterlight', type: 'Film', year: 2026, runtime: '1h 48m', genre: 'Drama', rating: '8.7', image: images.night, description: 'After a city loses power for one long night, a radio producer traces a voice that may change how she sees home.', featured: true },
  { id: 'saltwater', title: 'Saltwater Letters', type: 'Film', year: 2025, runtime: '1h 36m', genre: 'Drama', rating: '8.4', image: images.tide, description: 'Two siblings return to the coastline where their family story began, carrying letters neither of them has read.', genre2: 'Indie' },
  { id: 'orbit', title: 'Low Orbit', type: 'Series', year: 2026, runtime: '8 episodes', genre: 'Sci-Fi', rating: '9.1', image: images.city, description: 'A quiet crew on the edge of the atmosphere discovers a signal with a memory of its own.', genre2: 'Original' },
  { id: 'red-earth', title: 'Red Earth', type: 'Film', year: 2024, runtime: '2h 02m', genre: 'Adventure', rating: '8.1', image: images.desert, description: 'A cartographer follows a vanished route across a changing landscape and finds a future worth mapping.', genre2: 'African Cinema' },
  { id: 'greenroom', title: 'The Green Room', type: 'Series', year: 2025, runtime: '6 episodes', genre: 'Comedy', rating: '7.9', image: images.red, description: 'A group of young creatives turn a tiny studio into an unlikely home for big ideas.', genre2: 'Comedy' },
  { id: 'northbound', title: 'Northbound', type: 'Film', year: 2023, runtime: '1h 54m', genre: 'Thriller', rating: '8.0', image: images.road, description: 'A night drive. A missing mile marker. And one decision that cannot be taken back.', genre2: 'Thriller' },
  { id: 'blue-hour', title: 'Blue Hour', type: 'Film', year: 2025, runtime: '1h 42m', genre: 'Romance', rating: '8.2', image: images.coast, description: 'A photographer and a chef share the brief hours before sunrise, learning the shape of a second chance.', genre2: 'Romance' },
  { id: 'mosaic', title: 'Mosaic House', type: 'Series', year: 2024, runtime: '10 episodes', genre: 'Drama', rating: '8.6', image: images.portrait, description: 'Four women build a new kind of family inside an old house full of unfinished stories.', genre2: 'Drama' }
];
