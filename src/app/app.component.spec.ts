import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';

describe('AppComponent', () => {
  let component: AppComponent;
  let meta: Meta;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    meta = TestBed.inject(Meta);
  });

  afterEach(() => {
    document.body.className = '';
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'gloomhavensecretariat'`, () => {
    expect(component.title).toEqual('gloomhavensecretariat');
  });

  describe('onRightClick', () => {
    it('should return true in dev mode', () => {
      vi.spyOn(component, 'isAppDevMode').mockReturnValue(true);
      expect(component.onRightClick()).toEqual(true);
    });

    it('should return false in prod mode', () => {
      vi.spyOn(component, 'isAppDevMode').mockReturnValue(false);
      expect(component.onRightClick()).toEqual(false);
    });

    it('should return true in prod mode with debugRightClick enabled', () => {
      vi.spyOn(component, 'isAppDevMode').mockReturnValue(false);
      settingsManager.settings.debugRightClick = true;
      expect(component.onRightClick()).toEqual(true);
      settingsManager.settings.debugRightClick = false;
    });
  });

  describe('applyStyle', () => {
    it('should apply fh theme', () => {
      settingsManager.settings.theme = 'fh';
      component.applyStyle();
      expect(component.theme).toEqual('fh');
      expect(document.body.classList.contains('fh')).toBe(true);
      expect(document.body.classList.contains('modern')).toBe(false);
      expect(document.body.classList.contains('bb')).toBe(false);
    });

    it('should apply modern theme', () => {
      settingsManager.settings.theme = 'modern';
      component.applyStyle();
      expect(component.theme).toEqual('modern');
      expect(document.body.classList.contains('modern')).toBe(true);
      expect(document.body.classList.contains('fh')).toBe(false);
    });

    it('should apply bb theme', () => {
      settingsManager.settings.theme = 'bb';
      component.applyStyle();
      expect(component.theme).toEqual('bb');
      expect(document.body.classList.contains('bb')).toBe(true);
      expect(document.body.classList.contains('fh')).toBe(false);
      expect(document.body.classList.contains('modern')).toBe(false);
    });

    it('should apply default (gh) theme', () => {
      settingsManager.settings.theme = '';
      component.applyStyle();
      expect(document.body.classList.contains('fh')).toBe(false);
      expect(document.body.classList.contains('modern')).toBe(false);
      expect(document.body.classList.contains('bb')).toBe(false);
    });

    it('should add portrait-mode class when enabled', () => {
      settingsManager.settings.portraitMode = true;
      component.applyStyle();
      expect(document.body.classList.contains('portrait-mode')).toBe(true);
    });

    it('should remove portrait-mode class when disabled', () => {
      document.body.classList.add('portrait-mode');
      settingsManager.settings.portraitMode = false;
      component.applyStyle();
      expect(document.body.classList.contains('portrait-mode')).toBe(false);
    });

    it('should set locale class on body', () => {
      settingsManager.settings.locale = 'de';
      component.applyStyle();
      expect(component.locale).toEqual('de');
      expect(document.body.classList.contains('locale-de')).toBe(true);
    });

    it('should replace previous locale class', () => {
      document.body.classList.add('locale-en');
      settingsManager.settings.locale = 'fr';
      component.applyStyle();
      expect(document.body.classList.contains('locale-en')).toBe(false);
      expect(document.body.classList.contains('locale-fr')).toBe(true);
    });

    it('should update theme-color meta tag for fh', () => {
      vi.spyOn(meta, 'updateTag');
      settingsManager.settings.theme = 'fh';
      component.applyStyle();
      expect(meta.updateTag).toHaveBeenCalledWith({ name: 'theme-color', content: '#a2bbd1' });
    });

    it('should update theme-color meta tag for default theme', () => {
      vi.spyOn(meta, 'updateTag');
      settingsManager.settings.theme = '';
      component.applyStyle();
      expect(meta.updateTag).toHaveBeenCalledWith({ name: 'theme-color', content: '#936658' });
    });
  });

  describe('applyAnimations', () => {
    it('should add no-animations class when animations disabled', () => {
      settingsManager.settings.animations = false;
      component.applyAnimations();
      expect(document.body.classList.contains('no-animations')).toBe(true);
    });

    it('should remove no-animations class when animations enabled', () => {
      document.body.classList.add('no-animations');
      settingsManager.settings.animations = true;
      component.applyAnimations();
      expect(document.body.classList.contains('no-animations')).toBe(false);
    });
  });
});
