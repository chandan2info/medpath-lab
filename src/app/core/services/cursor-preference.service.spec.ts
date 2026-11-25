import { TestBed } from '@angular/core/testing';
import { CursorPreferenceService } from './cursor-preference.service';

describe('CursorPreferenceService', () => {
  const storageKey = 'medpath.customCursor.enabled';

  beforeEach(() => {
    document.documentElement.classList.remove('cursor-custom-enabled');
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    spyOn(Storage.prototype, 'setItem').and.stub();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    document.documentElement.classList.remove('cursor-custom-enabled');
    TestBed.resetTestingModule();
  });

  it('enables the custom cursor by default when no preference is saved', () => {
    const service = TestBed.inject(CursorPreferenceService);

    expect(service.enabled()).toBeTrue();
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeTrue();
  });

  it('restores a previously saved disabled preference', () => {
    (Storage.prototype.getItem as jasmine.Spy).and.returnValue('false');

    const service = TestBed.inject(CursorPreferenceService);

    expect(service.enabled()).toBeFalse();
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeFalse();
  });

  it('persists and applies a preference when toggled', () => {
    const service = TestBed.inject(CursorPreferenceService);

    service.toggle();

    expect(service.enabled()).toBeFalse();
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(storageKey, 'false');
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeFalse();
  });

  it('synchronizes preference changes received from another browser tab', () => {
    const service = TestBed.inject(CursorPreferenceService);

    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: 'false',
    }));

    expect(service.enabled()).toBeFalse();
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeFalse();
  });

  it('re-enables the default preference when it is cleared in another tab', () => {
    const service = TestBed.inject(CursorPreferenceService);
    service.setEnabled(false);

    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: null,
    }));

    expect(service.enabled()).toBeTrue();
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeTrue();
  });
});
