import { useState } from 'react';

export default function App() {
  const [day, setDay] = useState(18);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#16171b',
        color: '#eeeeee',
        padding: '40px',
        fontFamily: 'Inter, Arial, sans-serif'
      }}
    >
      <h1>Programmation Festival VITA 2026</h1>

      <p style={{ color: '#999' }}>
        Connexion à Monday en préparation
      </p>

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        {[17, 18, 19, 20].map((date) => (
          <button
            key={date}
            onClick={() => setDay(date)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: day === date ? '#8174d9' : '#292a2f',
              color: '#fff'
            }}
          >
            sept. {date}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          background: '#1d1e22',
          borderRadius: '8px'
        }}
      >
        Journée sélectionnée : <strong>sept. {day}</strong>
      </div>
    </div>
  );
}
  );
}
