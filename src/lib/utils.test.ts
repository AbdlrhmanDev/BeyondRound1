import { cn } from './utils';

describe('cn', () => {
  it('should combine string arguments correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle undefined and null arguments', () => {
    expect(cn('class1', undefined, 'class2', null)).toBe('class1 class2');
  });

  it('should combine array arguments correctly', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle object arguments where values are booleans', () => {
    expect(cn({ class1: true, class2: false }, 'class3')).toBe('class1 class3');
  });

  it('should handle a mix of argument types', () => {
    expect(cn('class1', ['class2', { class3: true, class4: false }], null, 'class5')).toBe('class1 class2 class3 class5');
  });

  it('should return an empty string if no valid classes are provided', () => {
    expect(cn(null, undefined, false, { test: false }, [])).toBe('');
  });

  it('should handle empty strings in arguments', () => {
    expect(cn('class1', '', 'class2')).toBe('class1 class2');
  });
});
