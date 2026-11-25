import { TestBed } from '@angular/core/testing';
import { CursorPreferenceService } from './cursor-preference.service';

describe('CursorPreferenceService', () => {
  const storageKey = 'medpath.customCursor.enabled';
  const colorKey = 'medpath.customCursor.color';

  beforeEach(() => {
    document.documentElement.classList.remove('cursor-custom-enabled');
    document.querySelector('[data-medpath-cursor-color]')?.remove();
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    spyOn(Storage.prototype, 'setItem').and.stub();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    document.documentElement.classList.remove('cursor-custom-enabled');
    document.querySelector('[data-medpath-cursor-color]')?.remove();
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
    window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: 'false' }));
    expect(service.enabled()).toBeFalse();
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeFalse();
  });

  it('re-enables the default preference when its key is removed in another tab', () => {
    const service = TestBed.inject(CursorPreferenceService);
    service.setEnabled(false);
    window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: null }));
    expect(service.enabled()).toBeTrue();
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeTrue();
  });

  it('re-enables the default preference when local storage is cleared in another tab', () => {
    const service = TestBed.inject(CursorPreferenceService);
    service.setEnabled(false);
    window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }));
    expect(service.enabled()).toBeTrue();
    expect(document.documentElement.classList.contains('cursor-custom-enabled')).toBeTrue();
  });

  it('uses the default cursor color when no color preference is saved', () => {
    const service = TestBed.inject(CursorPreferenceService);
    expect(service.color()).toBe('#8b5cf6');
    expect(document.querySelector('[data-medpath-cursor-color]')).not.toBeNull();
  });

  it('persists a selected cursor color and updates the cursor stylesheet', () => {
    const service = TestBed.inject(CursorPreferenceService);
    service.setColor('#2563eb');
    expect(service.color()).toBe('#2563eb');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(colorKey, '#2563eb');
    expect(document.querySelector('[data-medpath-cursor-color]')?.textContent).toContain('#2563eb');
  });

  it('ignores invalid cursor colors', () => {
    const service = TestBed.inject(CursorPreferenceService);
    service.setColor('red');
    expect(service.color()).toBe('#8b5cf6');
  });

  it('restores cursor color changes received from another browser tab', () => {
    const service = TestBed.inject(CursorPreferenceService);
    window.dispatchEvent(new StorageEvent('storage', { key: colorKey, newValue: '#e11d48' }));
    expect(service.color()).toBe('#e11d48');
    expect(document.querySelector('[data-medpath-cursor-color]')?.textContent).toContain('#e11d48');
  });
});
