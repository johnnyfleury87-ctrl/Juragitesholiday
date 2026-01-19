'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, loginClient, registerClient } from '@/lib/estim-auth';
import Link from 'next/link';

export default function EstimationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { user, error } = await getCurrentUser();
    setUser(user);
    setLoading(false);

    // If logged in, can proceed
    if (user && !error) {
      // Don't redirect yet - let them choose
    }
  }

  function handleStartEstimation() {
    if (user) {
      router.push('/estimation/form/step1-reason');
    } else {
      setShowAuthModal(true);
      setIsLogin(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            Estimation Immobilière
          </h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user.profile?.full_name}</span>
              <Link
                href="/estimation/profile"
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Mon profil
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Estimez la valeur de votre bien immobilier
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Obtenez une estimation indicative en quelques minutes. Outil d'aide à la décision,
          non opposable juridiquement.
        </p>

        {!loading && (
          <button
            onClick={handleStartEstimation}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition"
          >
            Commencer une estimation
          </button>
        )}
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        {/* Feature 1 */}
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="text-4xl mb-4">⏱️</div>
          <h3 className="text-lg font-bold mb-2">Rapide & Instantané</h3>
          <p className="text-gray-600">
            Recevez votre rapport d'estimation en PDF en quelques minutes après paiement.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-bold mb-2">Sécurisé & Confidentiel</h3>
          <p className="text-gray-600">
            Vos données sont chiffrées et votre profil est protégé. Accès personnel sécurisé.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="text-4xl mb-4">⚖️</div>
          <h3 className="text-lg font-bold mb-2">Juridiquement Clair</h3>
          <p className="text-gray-600">
            Positionnement clair comme estimation indicative, avec tous les disclaimers requis.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche</h2>

          <div className="grid md:grid-cols-6 gap-4 items-center">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">
                1
              </div>
              <p className="text-sm font-medium text-gray-700">Inscription</p>
            </div>

            <div className="hidden md:flex justify-center text-gray-400">→</div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">
                2
              </div>
              <p className="text-sm font-medium text-gray-700">Données du bien</p>
            </div>

            <div className="hidden md:flex justify-center text-gray-400">→</div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">
                3
              </div>
              <p className="text-sm font-medium text-gray-700">Paiement</p>
            </div>

            <div className="hidden md:flex justify-center text-gray-400">→</div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">
                4
              </div>
              <p className="text-sm font-medium text-gray-700">Résultats PDF</p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Notice */}
      <section className="bg-blue-50 py-12 border-t-4 border-blue-200">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-lg font-bold text-blue-900 mb-4">⚠️ Avis Important</h3>
          <p className="text-blue-800 mb-3">
            <strong>Cette estimation est indicative et non opposable juridiquement.</strong>
          </p>
          <ul className="text-blue-800 space-y-2 ml-4">
            <li>✗ Ce n'est pas une expertise immobilière officielle</li>
            <li>✗ Ce n'est pas une valeur vénale certifiée</li>
            <li>✗ Aucune visite sur site n'est effectuée</li>
            <li>✓ Elle aide à prendre une décision personnelle</li>
            <li>✓ Pour un usage officiel, consultez un expert professionnel</li>
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-8 rounded-lg text-center">
          <p className="text-gray-200 mb-2">Tarif unique</p>
          <p className="text-5xl font-bold mb-4">49€</p>
          <p className="text-indigo-200 mb-6">
            Un rapport PDF complet et immédiat
          </p>
          <button
            onClick={handleStartEstimation}
            className="bg-white text-indigo-600 hover:bg-gray-100 font-bold py-2 px-6 rounded transition"
          >
            Commencer maintenant
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>

          <div className="space-y-6">
            <FAQItem
              question="Mes données sont-elles sécurisées?"
              answer="Oui. Votre compte est protégé par authentification sécurisée et vos estimations sont liées à votre profil uniquement."
            />
            <FAQItem
              question="Puis-je utiliser l'estimation pour un divorce?"
              answer="Oui, mais ce document ne remplace pas une expertise ordonnée par le tribunal. Il est informatif pour préparer les discussions."
            />
            <FAQItem
              question="Puis-je me faire rembourser?"
              answer="Oui, remboursement possible sous 30 jours suivant votre demande."
            />
            <FAQItem
              question="Puis-je modifier mes données après paiement?"
              answer="Non, les données sont gelées à la date du paiement pour assurer la traçabilité légale."
            />
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isLogin={isLogin}
          onClose={() => setShowAuthModal(false)}
          onSwitch={() => setIsLogin(!isLogin)}
          onSuccess={() => {
            setShowAuthModal(false);
            router.push('/estimation/form/step1-reason');
          }}
        />
      )}
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left font-medium hover:bg-gray-100 flex justify-between items-center"
      >
        {question}
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="p-4 bg-gray-100 text-gray-700 border-t">
          {answer}
        </div>
      )}
    </div>
  );
}

function AuthModal({ isLogin, onClose, onSwitch, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { user, error: authError } = await loginClient(email, password);
        if (authError) {
          setError(authError.message);
          return;
        }
      } else {
        const { user, error: authError } = await registerClient(email, password, {
          firstName,
          lastName
        });
        if (authError) {
          setError(authError.message);
          return;
        }
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-2 rounded transition"
          >
            {loading ? 'Chargement...' : isLogin ? 'Connexion' : 'Inscription'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          {isLogin ? "Pas de compte?" : "Vous avez déjà un compte?"}
          <button
            onClick={onSwitch}
            className="text-indigo-600 hover:underline ml-1 font-medium"
          >
            {isLogin ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>

        <button
          onClick={onClose}
          className="w-full mt-4 text-gray-600 hover:text-gray-800"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
