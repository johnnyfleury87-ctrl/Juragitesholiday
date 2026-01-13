'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './operations.module.css';

export default function OperationsPage() {
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState('arrivals');
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [inventory, setInventory] = useState([]);
  const [cleaningSessions, setCleaningSessions] = useState([]);
  const [linens, setLinens] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Fetch properties and select first
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, title, slug')
          .eq('is_published', true)
          .order('title');
        
        if (error) throw error;
        setProperties(data || []);
        if (data?.length > 0) {
          setSelectedProperty(data[0].id);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProperties();
  }, [supabase]);

  // Fetch all operational data when property changes
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [inventoryRes, cleaningRes, linensRes, bookingsRes] = await Promise.all([
          supabase
            .from('inventory_items')
            .select('*')
            .eq('property_id', selectedProperty)
            .order('category'),
          supabase
            .from('cleaning_sessions')
            .select('*')
            .eq('property_id', selectedProperty)
            .order('scheduled_date', { ascending: false }),
          supabase
            .from('linens')
            .select('*')
            .eq('property_id', selectedProperty)
            .order('linen_type'),
          supabase
            .from('bookings')
            .select('*')
            .eq('property_id', selectedProperty)
            .gte('check_out', new Date().toISOString().split('T')[0])
            .order('check_in')
        ]);

        if (inventoryRes.error) throw inventoryRes.error;
        if (cleaningRes.error) throw cleaningRes.error;
        if (linensRes.error) throw linensRes.error;
        if (bookingsRes.error) throw bookingsRes.error;

        setInventory(inventoryRes.data || []);
        setCleaningSessions(cleaningRes.data || []);
        setLinens(linensRes.data || []);
        setBookings(bookingsRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty, supabase]);

  if (error) return <div className={styles.error}>Erreur : {error}</div>;

  return (
    <div className={styles.container}>
      <h1>🏢 Gestion Opérationnelle</h1>

      {/* Property Selector */}
      <div className={styles.propertySelector}>
        <label htmlFor="property-select">Sélectionner un logement :</label>
        <select
          id="property-select"
          value={selectedProperty || ''}
          onChange={(e) => setSelectedProperty(e.target.value)}
        >
          {properties.map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.title}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        <button
          className={`${styles.tab} ${activeTab === 'arrivals' ? styles.active : ''}`}
          onClick={() => setActiveTab('arrivals')}
        >
          📅 Arrivées / Départs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'inventory' ? styles.active : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventaire
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'cleaning' ? styles.active : ''}`}
          onClick={() => setActiveTab('cleaning')}
        >
          🧹 Ménage
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'linens' ? styles.active : ''}`}
          onClick={() => setActiveTab('linens')}
        >
          👕 Linge
        </button>
      </nav>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : (
          <>
            {activeTab === 'arrivals' && <ArrivalsTab bookings={bookings} />}
            {activeTab === 'inventory' && <InventoryTab items={inventory} propertyId={selectedProperty} supabase={supabase} />}
            {activeTab === 'cleaning' && <CleaningTab sessions={cleaningSessions} propertyId={selectedProperty} supabase={supabase} />}
            {activeTab === 'linens' && <LinensTab linensData={linens} propertyId={selectedProperty} supabase={supabase} />}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB COMPONENTS
// ============================================================

function ArrivalsTab({ bookings }) {
  const today = new Date().toISOString().split('T')[0];
  const upcomingArrivals = bookings.filter(b => b.check_in >= today);
  const upcomingDepartures = bookings.filter(b => b.check_out >= today && b.check_in < today);

  const getPropertyStatus = (checkIn, checkOut) => {
    const today = new Date().toISOString().split('T')[0];
    if (checkOut < today) return { text: 'Libre', color: 'green' };
    if (checkIn <= today && checkOut > today) return { text: 'Occupé', color: 'red' };
    return { text: 'À préparer', color: 'orange' };
  };

  return (
    <div className={styles.tabPanel}>
      <h2>📅 Planification Arrivées / Départs</h2>

      {upcomingDepartures.length > 0 && (
        <section className={styles.section}>
          <h3>🚪 Départs Prévus</h3>
          <div className={styles.list}>
            {upcomingDepartures.map((booking) => (
              <div key={booking.id} className={styles.listItem}>
                <div className={styles.itemHeader}>
                  <strong>Départ le {new Date(booking.check_out).toLocaleDateString('fr-FR')}</strong>
                  <span className={styles.badge} style={{ backgroundColor: 'orange' }}>À nettoyer</span>
                </div>
                <p>Clients : {booking.num_guests} personnes</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcomingArrivals.length > 0 && (
        <section className={styles.section}>
          <h3>🔔 Arrivées Prévues</h3>
          <div className={styles.list}>
            {upcomingArrivals.map((booking) => (
              <div key={booking.id} className={styles.listItem}>
                <div className={styles.itemHeader}>
                  <strong>Arrivée le {new Date(booking.check_in).toLocaleDateString('fr-FR')}</strong>
                  <span className={styles.badge} style={{ backgroundColor: 'green' }}>Prêt</span>
                </div>
                <p>Clients : {booking.num_guests} personnes | Durée : {Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24))} nuits</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {bookings.length === 0 && (
        <p className={styles.empty}>Aucune réservation prévue pour cette période.</p>
      )}
    </div>
  );
}

function InventoryTab({ items, propertyId, supabase }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Vaisselle',
    quantity: 1,
    condition: 'ok',
    notes: ''
  });

  const categories = ['Vaisselle', 'Électroménager', 'Mobilier', 'Équipements', 'Autre'];
  const conditions = ['ok', 'à remplacer', 'HS'];

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('inventory_items').insert([
        {
          property_id: propertyId,
          ...formData
        }
      ]);
      if (error) throw error;
      setFormData({
        item_name: '',
        category: 'Vaisselle',
        quantity: 1,
        condition: 'ok',
        notes: ''
      });
      setShowForm(false);
      // Refresh data would be handled by parent
      window.location.reload();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const getConditionColor = (condition) => {
    switch(condition) {
      case 'ok': return '#4CAF50';
      case 'à remplacer': return '#FF9800';
      case 'HS': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.header}>
        <h2>📦 Inventaire</h2>
        <button className={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Annuler' : '+ Ajouter un item'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleAddItem}>
          <input
            type="text"
            placeholder="Nom de l'item"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Quantité"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          />
          <select
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          >
            {conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
          </select>
          <textarea
            placeholder="Commentaires (optionnel)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="2"
          />
          <button type="submit" className={styles.btnSuccess}>Ajouter</button>
        </form>
      )}

      <div className={styles.inventory}>
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className={styles.categorySection}>
            <h3>{category}</h3>
            <div className={styles.itemsGrid}>
              {categoryItems.map((item) => (
                <div key={item.id} className={styles.inventoryCard}>
                  <div className={styles.cardHeader}>
                    <strong>{item.item_name}</strong>
                    <span 
                      className={styles.conditionBadge}
                      style={{ backgroundColor: getConditionColor(item.condition) }}
                    >
                      {item.condition}
                    </span>
                  </div>
                  <p>Quantité : <strong>{item.quantity}</strong></p>
                  {item.notes && <p className={styles.notes}>{item.notes}</p>}
                  {item.last_checked_at && (
                    <p className={styles.small}>Vérifié : {new Date(item.last_checked_at).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className={styles.empty}>Aucun item d'inventaire. Commencez par en ajouter.</p>
      )}
    </div>
  );
}

function CleaningTab({ sessions, propertyId, supabase }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_date: '',
    cleaning_type: 'standard',
    duration_hours: 3,
    notes: ''
  });

  const handleAddSession = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('cleaning_sessions').insert([
        {
          property_id: propertyId,
          ...formData,
          is_completed: false
        }
      ]);
      if (error) throw error;
      setFormData({
        scheduled_date: '',
        cleaning_type: 'standard',
        duration_hours: 3,
        notes: ''
      });
      setShowForm(false);
      window.location.reload();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const toggleCompletion = async (sessionId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('cleaning_sessions')
        .update({ 
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', sessionId);
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const upcoming = sessions.filter(s => !s.is_completed);
  const completed = sessions.filter(s => s.is_completed);

  return (
    <div className={styles.tabPanel}>
      <div className={styles.header}>
        <h2>🧹 Ménage</h2>
        <button className={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Annuler' : '+ Planifier un ménage'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleAddSession}>
          <input
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            required
          />
          <select
            value={formData.cleaning_type}
            onChange={(e) => setFormData({ ...formData, cleaning_type: e.target.value })}
          >
            <option value="standard">Standard</option>
            <option value="approfondi">Approfondi</option>
          </select>
          <input
            type="number"
            min="0.5"
            step="0.5"
            placeholder="Durée (heures)"
            value={formData.duration_hours}
            onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
          />
          <textarea
            placeholder="Commentaires (optionnel)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="2"
          />
          <button type="submit" className={styles.btnSuccess}>Planifier</button>
        </form>
      )}

      {upcoming.length > 0 && (
        <section className={styles.section}>
          <h3>📋 À faire</h3>
          <div className={styles.list}>
            {upcoming.map((session) => (
              <div key={session.id} className={styles.listItem}>
                <div className={styles.itemHeader}>
                  <strong>{new Date(session.scheduled_date).toLocaleDateString('fr-FR')} - {session.cleaning_type === 'approfondi' ? 'Ménage approfondi' : 'Ménage standard'}</strong>
                  <button
                    className={styles.btnSmall}
                    onClick={() => toggleCompletion(session.id, session.is_completed)}
                  >
                    ✓ Marquer comme complété
                  </button>
                </div>
                <p>Durée : {session.duration_hours}h {session.notes && `| ${session.notes}`}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className={styles.section}>
          <h3>✅ Complété</h3>
          <div className={styles.list}>
            {completed.map((session) => (
              <div key={session.id} className={`${styles.listItem} ${styles.completed}`}>
                <div className={styles.itemHeader}>
                  <strong>{new Date(session.scheduled_date).toLocaleDateString('fr-FR')}</strong>
                  <span className={styles.badge}>Complété</span>
                </div>
                <p>Durée : {session.duration_hours}h</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <p className={styles.empty}>Aucune session de ménage planifiée.</p>
      )}
    </div>
  );
}

function LinensTab({ linensData, propertyId, supabase }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    linen_type: 'Draps',
    quantity: 1,
    status: 'Disponible'
  });

  const linens_types = ['Draps', 'Serviettes', 'Housses de couette', 'Taies d\'oreiller', 'Autre'];
  const statuses = ['Disponible', 'Propre', 'Sale', 'En lavage', 'Manquant'];

  const handleAddLinens = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('linens').insert([
        {
          property_id: propertyId,
          ...formData
        }
      ]);
      if (error) throw error;
      setFormData({
        linen_type: 'Draps',
        quantity: 1,
        status: 'Disponible'
      });
      setShowForm(false);
      window.location.reload();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const updateStatus = async (linensId, newStatus) => {
    try {
      const { error } = await supabase
        .from('linens')
        .update({ 
          status: newStatus,
          last_status_change_at: new Date().toISOString()
        })
        .eq('id', linensId);
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Disponible': return '#4CAF50';
      case 'Propre': return '#2196F3';
      case 'Sale': return '#FF5722';
      case 'En lavage': return '#FF9800';
      case 'Manquant': return '#9C27B0';
      default: return '#757575';
    }
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.header}>
        <h2>👕 Gestion du Linge</h2>
        <button className={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Annuler' : '+ Ajouter du linge'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleAddLinens}>
          <select
            value={formData.linen_type}
            onChange={(e) => setFormData({ ...formData, linen_type: e.target.value })}
          >
            {linens_types.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Quantité"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <button type="submit" className={styles.btnSuccess}>Ajouter</button>
        </form>
      )}

      <div className={styles.linensGrid}>
        {linensData.map((linen) => (
          <div key={linen.id} className={styles.linensCard}>
            <div className={styles.cardHeader}>
              <strong>{linen.linen_type}</strong>
              <span className={styles.quantity}>x{linen.quantity}</span>
            </div>
            <div className={styles.statusSelector}>
              <select
                value={linen.status}
                onChange={(e) => updateStatus(linen.id, e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <span 
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(linen.status) }}
              >
                {linen.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {linensData.length === 0 && (
        <p className={styles.empty}>Aucun linge enregistré. Commencez par en ajouter.</p>
      )}
    </div>
  );
}
