import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';
describe('getErrorMessage', () => {
  it('affiche le message et le code des objets PostgREST', () => {
    expect(getErrorMessage({ message: 'Une colonne est absente', code: 'PGRST204' }, 'Échec')).toBe('Une colonne est absente [PGRST204]');
  });
  it('accepte les erreurs JavaScript', () => {
    expect(getErrorMessage(new Error('Session expirée'), 'Échec')).toBe('Session expirée');
  });
  it('utilise le message de secours pour une erreur sans message', () => {
    for (const error of [null, undefined, {}, { message: '' }, { message: 42 }]) expect(getErrorMessage(error, 'Échec')).toBe('Échec');
  });
});
