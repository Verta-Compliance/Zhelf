import { describe, expect, it } from 'vitest';
import { parseSuggestion } from './listing-suggestion';

const valid = {
  category: 'Home & Garden',
  subcategory: 'Chairs',
  title: 'IKEA wooden dining chair',
  condition: 'Good',
  description: 'Solid wooden dining chair with minor signs of use.',
  priceMin: 15,
  priceMax: 20,
  material: 'Wood',
  colour: 'Natural',
  brand: 'IKEA',
};

describe('parseSuggestion', () => {
  it('accepts a well-formed suggestion', () => {
    expect(parseSuggestion(valid)).toEqual(valid);
  });

  it('rejects categories and conditions the form cannot hold', () => {
    expect(parseSuggestion({ ...valid, category: 'Furniture' })).toBeNull();
    expect(parseSuggestion({ ...valid, condition: 'Mint' })).toBeNull();
    expect(parseSuggestion({ ...valid, title: '  ' })).toBeNull();
    expect(parseSuggestion('nope')).toBeNull();
  });

  it('orders a reversed price range and drops unusable prices', () => {
    expect(parseSuggestion({ ...valid, priceMin: 20, priceMax: 15 })).toMatchObject({
      priceMin: 15,
      priceMax: 20,
    });
    expect(parseSuggestion({ ...valid, priceMin: -5, priceMax: 'x' })).toMatchObject({
      priceMin: 0,
      priceMax: 0,
    });
  });

  it('trims and caps free text', () => {
    const result = parseSuggestion({ ...valid, title: ` ${'a'.repeat(300)} ` });
    expect(result?.title).toHaveLength(160);
  });
});
