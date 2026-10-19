'use client';

import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import {
  MAPBOX_TOKEN,
  searchPlaces,
  type PlaceSuggestion,
} from '../src/lib/mapbox';

export interface LocationValue {
  location: string;
  latitude: number | null;
  longitude: number | null;
}

export default function LocationInput({
  value,
  onChange,
  required,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  required?: boolean;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!open || !MAPBOX_TOKEN) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(value.location, controller.signal)
        .then((places) => {
          setSuggestions(places);
          setActive(-1);
        })
        .catch(() => {
          // Aborted or offline: keep typing as plain text.
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, value.location]);

  function choose(place: PlaceSuggestion) {
    onChange({
      location: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setOpen(false);
    setSuggestions([]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;
  const pinned = value.latitude !== null && value.longitude !== null;

  return (
    <label className='location-field'>
      <span>Location</span>
      <input
        name='location'
        value={value.location}
        required={required}
        maxLength={160}
        placeholder='Manchester'
        autoComplete='off'
        role={MAPBOX_TOKEN ? 'combobox' : undefined}
        aria-expanded={MAPBOX_TOKEN ? showList : undefined}
        aria-controls={MAPBOX_TOKEN ? listId : undefined}
        aria-autocomplete={MAPBOX_TOKEN ? 'list' : undefined}
        onChange={(event) => {
          onChange({
            location: event.target.value,
            latitude: null,
            longitude: null,
          });
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      />
      {showList ? (
        <ul
          id={listId}
          role='listbox'
          className='location-suggestions'
        >
          {suggestions.map((place, index) => (
            <li
              key={`${place.label}-${index}`}
              role='option'
              aria-selected={index === active}
              className={index === active ? 'active' : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(place)}
            >
              {place.label}
            </li>
          ))}
        </ul>
      ) : null}
      {MAPBOX_TOKEN ? (
        <small className='muted'>
          {pinned
            ? 'Buyers see an approximate area on a map, not your address.'
            : 'Pick a suggestion to show your area on a map.'}
        </small>
      ) : null}
    </label>
  );
}
