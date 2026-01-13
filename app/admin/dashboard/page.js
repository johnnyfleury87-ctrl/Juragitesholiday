'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/shared';
import './dashboard.css';

// ============================================================
// MOCK DATA - Données fictives pour la démo
// ============================================================

const MOCK_PROPERTIES = [
  { id: '1', slug: 'gite-montagne-vue', title: 'Gîte de Montagne', price: 150 },
  { id: '2', slug: 'maison-lac-proximite', title: 'Maison Proximité Lac', price: 120 },
  { id: '3', slug: 'chalet-des-sapins', title: 'Chalet des Sapins', price: 320 },
  { id: '4', slug: 'maison-du-lac', title: 'Maison du Lac', price: 210 },
];

const MOCK_BOOKINGS = [
  { id: 1, property: 'Gîte de Montagne', checkin: '2026-01-15', checkout: '2026-01-20', nights: 5, price: 150, total: 750, status: 'confirmed', source: 'website' },
  { id: 2, property: 'Maison du Lac', checkin: '2026-01-18', checkout: '2026-01-25', nights: 7, price: 210, total: 1470, status: 'confirmed', source: 'airbnb' },
  { id: 3, property: 'Chalet des Sapins', checkin: '2026-02-01', checkout: '2026-02-08', nights: 7, price: 320, total: 2240, status: 'pending', source: 'website' },
  { id: 4, property: 'Maison Proximité', checkin: '2026-01-20', checkout: '2026-01-22', nights: 2, price: 120, total: 240, status: 'confirmed', source: 'website' },
  { id: 5, property: 'Gîte de Montagne', checkin: '2026-02-10', checkout: '2026-02-15', nights: 5, price: 150, total: 750, status: 'cancelled', source: 'website' },
];

const MOCK_CHARGES = [
  { id: 1, type: 'ménage', amount: 150, property: 'Gîte de Montagne', date: '2026-01-15' },
  { id: 2, type: 'électricité', amount: 200, property: null, date: '2026-01-10' },
  { id: 3, type: 'entretien', amount: 300, property: 'Chalet des Sapins', date: '2026-01-12' },
];

const MOCK_FUTURE_BOOKINGS = [
  { property: 'Maison du Lac', nights: 10, price: 210 },
  { property: 'Gîte de Montagne', nights: 5, price: 150 },
  { property: 'Chalet des Sapins', nights: 7, price: 320 },
];

// ============================================================
// CALCULATIONS
// ============================================================

const calculateStats = () => {
  const confirmed = MOCK_BOOKINGS.filter(b => b.status === 'confirmed');
  const pending = MOCK_BOOKINGS.filter(b => b.status === 'pending');
  const cancelled = MOCK_BOOKINGS.filter(b => b.status === 'cancelled');

  const totalCA = confirmed.reduce((sum, b) => sum + b.total, 0);
  const pendingCA = pending.reduce((sum, b) => sum + b.total, 0);
  const futureCA = MOCK_FUTURE_BOOKINGS.reduce((sum, b) => sum + (b.nights * b.price), 0);
  const totalCharges = MOCK_CHARGES.reduce((sum, c) => sum + c.amount, 0);

  const websiteBookings = MOCK_BOOKINGS.filter(b => b.source === 'website').length;
  const airbnbBookings = MOCK_BOOKINGS.filter(b => b.source === 'airbnb').length;

  return {
    totalVisits: 1247,
    totalUsers: 89,
    totalBookings: MOCK_BOOKINGS.length,
    totalCancellations: cancelled.length,
    totalCA,
    caEncashed: totalCA * 0.8,
    caFuture: futureCA,
    totalCharges,
    confirmed: confirmed.length,
    pending: pending.length,
    cancelled: cancelled.length,
    totalDeposits: totalCA * 0.2,
    remainingCA: totalCA * 0.2,
    websiteBookings,
    airbnbBookings,
  };
};

// ============================================================
// COMPONENTS
// ============================================================

function KPICard({ title, value, subtitle, trend }) {
  return (
    <div className="kpi-card" data-animation="fade-slide">
      <div className="kpi-content">
        <h3 className="kpi-title">{title}</h3>
        <div className="kpi-value">{value}</div>
        {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
      </div>
      {trend && <div className={`kpi-trend ${trend > 0 ? 'positive' : 'negative'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>}
    </div>
  );
}

function PropertyStatCard({ property, stats }) {
  const propStats = stats.propertyStats[property.slug] || {
    views: 0,
    bookings: 0,
    cancellations: 0,
    ca: 0,
    caEncashed: 0,
    caFuture: 0,
  };

  return (
    <div className="property-stat-card">
      <h4>{property.title}</h4>
      <div className="stat-row">
        <span>Vues:</span>
        <strong>{propStats.views}</strong>
      </div>
      <div className="stat-row">
        <span>Réservations:</span>
        <strong>{propStats.bookings}</strong>
      </div>
      <div className="stat-row">
        <span>Annulations:</span>
        <strong>{propStats.cancellations}</strong>
      </div>
      <div className="stat-row">
        <span>CA généré:</span>
        <strong>{propStats.ca}€</strong>
      </div>
      <div className="stat-row">
        <span>CA encaissé:</span>
        <strong>{propStats.caEncashed}€</strong>
      </div>
      <div className="stat-row">
        <span>CA prévisionnel:</span>
        <strong style={{ color: '#059669' }}>{propStats.caFuture}€</strong>
      </div>
    </div>
  );
}

function ChargeForm({ onAddCharge }) {
  const [form, setForm] = useState({
    type: 'ménage',
    amount: '',
    property: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.amount) {
      onAddCharge({
        id: Date.now(),
        ...form,
        amount: parseFloat(form.amount),
      });
      setForm({ type: 'ménage', amount: '', property: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="charge-form">
      <div className="form-row">
        <div className="form-group">
          <label>Type de charge</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="ménage">Ménage</option>
            <option value="entretien">Entretien</option>
            <option value="électricité">Électricité</option>
            <option value="eau">Eau</option>
            <option value="chauffage">Chauffage</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="form-group">
          <label>Montant</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Logement (optionnel)</label>
          <select value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
            <option value="">-- Tous les logements --</option>
            {MOCK_PROPERTIES.map(p => (
              <option key={p.id} value={p.title}>{p.title}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
      </div>
      <button type="submit" className="btn-submit">+ Ajouter charge</button>
    </form>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminDashboard() {
  const [charges, setCharges] = useState(MOCK_CHARGES);
  const celia = useRef(null);
  const stats = calculateStats();

  // Calculate property stats
  const propertyStats = {};
  MOCK_PROPERTIES.forEach(prop => {
    const propBookings = MOCK_BOOKINGS.filter(b => b.property.toLowerCase().includes(prop.title.split(' ')[0].toLowerCase()) || prop.title.includes(b.property.split(' ')[0]));
    const confirmed = propBookings.filter(b => b.status === 'confirmed');
    const cancelled = propBookings.filter(b => b.status === 'cancelled');
    
    propertyStats[prop.slug] = {
      views: Math.floor(Math.random() * 500) + 50,
      bookings: confirmed.length,
      cancellations: cancelled.length,
      ca: confirmed.reduce((sum, b) => sum + b.total, 0),
      caEncashed: confirmed.reduce((sum, b) => sum + b.total, 0) * 0.8,
      caFuture: MOCK_FUTURE_BOOKINGS.filter(b => b.property === prop.title).reduce((sum, b) => sum + (b.nights * b.price), 0),
    };
  });

  const statsWithProps = { ...stats, propertyStats };

  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);

  const scrollToCelia = () => {
    celia.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <AdminHeader />
      <div className="admin-dashboard">
        <div className="dashboard-header" data-animation="fade">
          <h1>JuraGites Admin</h1>
          <p>Gérez vos logements, réservations et finances en temps réel</p>
          <div className="header-actions">
            <button onClick={scrollToCelia} className="btn-celia">
              ✨ Célia, pour ta gestion c&apos;est ici
            </button>
            <Link href="/admin/logements" className="btn-secondary">
              🏠 Gestion des logements
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: KPIs GLOBAUX */}
        {/* ============================================================ */}

        <section className="dashboard-section" data-animation="fade-slide">
          <h2>📊 KPIs Globaux</h2>
          <div className="kpi-grid">
            <KPICard
              title="Visites du site"
              value={stats.totalVisits.toLocaleString()}
              subtitle="derniers 30 jours"
              trend={12}
            />
            <KPICard
              title="Utilisateurs inscrits"
              value={stats.totalUsers}
              subtitle="total plateforme"
              trend={8}
            />
            <KPICard
              title="Réservations confirmées"
              value={stats.confirmed}
              subtitle={`${stats.totalBookings} réservations au total`}
            />
            <KPICard
              title="Taux d'annulation"
              value={`${(stats.totalCancellations / stats.totalBookings * 100).toFixed(1)}%`}
              subtitle={stats.totalCancellations > 0 ? `${stats.totalCancellations} annulée(s)` : 'Aucune'}
              trend={-5}
            />
            <KPICard
              title="Chiffre d'affaires"
              value={`€${stats.totalCA.toLocaleString()}`}
              subtitle="montant confirmé"
            />
            <KPICard
              title="CA encaissé"
              value={`€${stats.caEncashed.toLocaleString()}`}
              subtitle={`${(stats.caEncashed / stats.totalCA * 100).toFixed(0)}% du CA`}
            />
            <KPICard
              title="CA prévisionnel"
              value={`€${stats.caFuture.toLocaleString()}`}
              subtitle="réservations à venir"
            />
            <KPICard
              title="Charges mensuelles"
              value={`€${totalCharges.toLocaleString()}`}
              subtitle="impact sur rentabilité"
            />
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: RÉSUMÉ RÉSERVATIONS */}
        {/* ============================================================ */}

        <section className="dashboard-section" data-animation="fade-slide">
          <h2>📋 Résumé Réservations</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-number">{stats.confirmed}</div>
              <div className="summary-label">Confirmées</div>
              <div className="summary-value">€{confirmed.reduce((sum, b) => sum + b.total, 0).toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{stats.pending}</div>
              <div className="summary-label">En attente</div>
              <div className="summary-value">€{MOCK_BOOKINGS.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.total, 0).toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{stats.cancelled}</div>
              <div className="summary-label">Annulées</div>
              <div className="summary-value">{(stats.cancelled / stats.totalBookings * 100).toFixed(1)}%</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">€{stats.totalDeposits.toFixed(0)}</div>
              <div className="summary-label">Acomptes reçus</div>
              <div className="summary-value">20% du CA</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">€{stats.remainingCA.toFixed(0)}</div>
              <div className="summary-label">À encaisser</div>
              <div className="summary-value">80% du CA</div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: STATISTIQUES PAR LOGEMENT */}
        {/* ============================================================ */}

        <section className="dashboard-section" data-animation="fade-slide">
          <h2>🏠 Performance par Logement</h2>
          <div className="property-grid">
            {MOCK_PROPERTIES.map(prop => (
              <PropertyStatCard key={prop.id} property={prop} stats={statsWithProps} />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: ORIGINE DES RÉSERVATIONS */}
        {/* ============================================================ */}

        <section className="dashboard-section" data-animation="fade-slide">
          <h2>🌐 Origine des Réservations</h2>
          <div className="chart-container">
            <div className="pie-chart-mock">
              <div className="pie-segment" style={{ width: `${stats.websiteBookings / stats.totalBookings * 100}%`, backgroundColor: '#0070F3' }}>
                <span className="pie-label">Site Web: {stats.websiteBookings}</span>
              </div>
              <div className="pie-segment" style={{ width: `${stats.airbnbBookings / stats.totalBookings * 100}%`, backgroundColor: '#8B92A9' }}>
                <span className="pie-label">Airbnb: {stats.airbnbBookings}</span>
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#0070F3' }}></span>
                <span>Site Web: {stats.websiteBookings} ({(stats.websiteBookings / stats.totalBookings * 100).toFixed(0)}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#8B92A9' }}></span>
                <span>Airbnb: {stats.airbnbBookings} ({(stats.airbnbBookings / stats.totalBookings * 100).toFixed(0)}%)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: GESTION CÉLIA - CHARGES */}
        {/* ============================================================ */}

        <section className="dashboard-section" data-animation="fade-slide" ref={celia}>
          <h2>💰 Gestion des Charges (Célia)</h2>
          <p className="section-subtitle">Saisir et analyser toutes vos dépenses</p>
          <ChargeForm onAddCharge={(charge) => setCharges([...charges, charge])} />

          <div className="charges-table">
            <h3>Charges enregistrées</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Logement</th>
                  <th>Montant</th>
                  <th>Impact CA</th>
                </tr>
              </thead>
              <tbody>
                {charges.map(charge => {
                  const propCA = charge.property ? (propertyStats[MOCK_PROPERTIES.find(p => p.title === charge.property)?.slug]?.ca || 0) : stats.totalCA;
                  const impact = ((charge.amount / propCA) * 100).toFixed(1);
                  return (
                    <tr key={charge.id}>
                      <td>{charge.date}</td>
                      <td className="charge-type-badge">{charge.type}</td>
                      <td>{charge.property || '---'}</td>
                      <td className="amount">€{charge.amount.toFixed(2)}</td>
                      <td style={{ color: impact > 10 ? '#DC2626' : '#059669' }}>-{impact}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="charges-summary">
              <span>Total charges:</span>
              <strong>€{totalCharges.toFixed(2)}</strong>
              <span>Marge nette:</span>
              <strong style={{ color: '#059669' }}>€{(stats.totalCA - totalCharges).toFixed(2)}</strong>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: PRÉVISIONS & EXPORT */}
        {/* ============================================================ */}

        <section className="dashboard-section" data-animation="fade-slide">
          <h2>🔮 Prévisions & Export Comptable</h2>
          <div className="forecast-container">
            <div className="forecast-card">
              <h3>Prévision CA (Janvier 2026)</h3>
              <div className="forecast-bar">
                <div className="forecast-fill" style={{ width: '65%' }}></div>
              </div>
              <div className="forecast-text">
                <strong>€{stats.caFuture.toLocaleString()}</strong> estimé
                <span>(basé sur {MOCK_FUTURE_BOOKINGS.length} réservations confirmées)</span>
              </div>
            </div>
            <div className="forecast-card">
              <h3>Analyse Rentabilité</h3>
              <div className="rentability-items">
                <div className="item">
                  <span>CA généré:</span>
                  <strong>€{stats.totalCA.toLocaleString()}</strong>
                </div>
                <div className="item">
                  <span>Charges:</span>
                  <strong>-€{totalCharges.toFixed(2)}</strong>
                </div>
                <div className="item divider">
                  <span>Marge nette:</span>
                  <strong style={{ color: '#059669' }}>€{(stats.totalCA - totalCharges).toFixed(2)}</strong>
                </div>
                <div className="item">
                  <span>Rentabilité:</span>
                  <strong>{((stats.totalCA - totalCharges) / stats.totalCA * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="export-section">
            <button className="btn-export" onClick={() => {
              const csv = `Date,Type,Propriété,Montant\n${charges.map(c => `${c.date},${c.type},${c.property || 'N/A'},${c.amount}`).join('\n')}`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `charges_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}>
              📥 Exporter Charges (CSV)
            </button>
            <button className="btn-export" onClick={() => {
              const csv = `Date,Logement,Statut,Prix Total,Source\n${MOCK_BOOKINGS.map(b => `${b.checkin},${b.property},${b.status},${b.total},${b.source}`).join('\n')}`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}>
              📥 Exporter Réservations (CSV)
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

// Variable globale pour la section résumé réservations
const confirmed = MOCK_BOOKINGS.filter(b => b.status === 'confirmed');
