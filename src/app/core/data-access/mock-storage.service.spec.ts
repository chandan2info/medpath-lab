import { MockStorageService } from './mock-storage.service';

describe('MockStorageService', () => {
  let service: MockStorageService;
  const key = 'medpath.test.mock-storage';

  beforeEach(() => {
    service = new MockStorageService();
    localStorage.removeItem(key);
  });

  afterEach(() => localStorage.removeItem(key));

  it('writes a versioned envelope and reads its data', () => {
    service.write(key, { value: 42 });

    const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
    expect(raw.schemaVersion).toBe(1);
    expect(raw.data).toEqual({ value: 42 });
    expect(raw.updatedAt).toBeTruthy();
    expect(service.read(key, { value: 0 }, (value): value is { value: number } =>
      !!value && typeof value === 'object' && typeof (value as { value?: unknown }).value === 'number'
    )).toEqual({ value: 42 });
  });

  it('continues to read legacy un-enveloped mock data', () => {
    localStorage.setItem(key, JSON.stringify([{ id: 'SMP-1' }]));

    expect(service.read(key, [], (value): value is Array<{ id: string }> => Array.isArray(value)))
      .toEqual([{ id: 'SMP-1' }]);
  });

  it('returns a safe fallback for malformed or invalid data', () => {
    localStorage.setItem(key, '{invalid json');

    expect(service.read(key, [], (value): value is string[] =>
      Array.isArray(value) && value.every(item => typeof item === 'string')
    )).toEqual([]);
  });

  it('returns a defensive copy so callers cannot mutate the stored fallback', () => {
    const fallback = [{ id: 'seed' }];
    const result = service.read(key, fallback, (value): value is Array<{ id: string }> => Array.isArray(value));
    result[0].id = 'changed';

    expect(fallback[0].id).toBe('seed');
  });
});
