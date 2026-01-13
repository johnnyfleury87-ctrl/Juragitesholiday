// Configuration du mode développement Admin
// À définir via variable d'environnement

export const ADMIN_DEV_MODE = process.env.NEXT_PUBLIC_ADMIN_DEV_MODE === 'true';

export const getDevModeStatus = () => {
  return {
    isEnabled: ADMIN_DEV_MODE,
    message: ADMIN_DEV_MODE ? '⚙️ Mode développement – accès libre sans authentification' : null,
  };
};
