import { useEffect, useState } from 'react';
import BoardSDK from '@api/BoardSDK';
import { Loader2 } from 'lucide-react';

const ZONES = [
  { label: 'Kiosques', color: '#fdab3d' },
  { label: 'Terrain synthétique', color: '#00c875' },
  { label: 'Asphalte', color: '#df2f4a' },
  { label: 'Zone démo', color: '#007eb5' },
  { label: 'Zone Famille', color: '#9d50dd' },
  { label: 'Scène', color: '#037f4c' },
  { label: 'Tente VIP', color: '#579bfc' }
];

// ============================================================
// JOURNÉES DU FESTIVAL
// ============================================================

const FESTIVAL_DAYS = [
  { label: 'sept. 17', day: 17 },
  { label: 'sept. 18', day: 18 },
  { label: 'sept. 19', day: 19 },
  { label: 'sept. 20', day: 20 }
];

// ============================================================
// CONFIGURATION DU CALENDRIER
// ============================================================

const START_HOUR = 5;
const END_HOUR = 24;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 32;

const TIME_COLUMN_WIDTH = 80;
const ZONE_WIDTH = 180;

// ============================================================
// CRÉNEAUX DE 30 MINUTES
// ============================================================

const generateTimeSlots = () => {
  const slots = [];

  for (
    let hour = START_HOUR;
    hour < END_HOUR;
    hour++
  ) {
    for (const minute of [0, 30]) {
      slots.push(
        `${String(hour).padStart(2, '0')}:${String(
          minute
        ).padStart(2, '0')}`
      );
    }
  }

  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// ============================================================
// EXTRAIRE PROPREMENT LA VALEUR D'UNE COLONNE
// ============================================================

const getValue = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => getValue(item))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {

    if (value.label !== undefined) {
      return getValue(value.label);
    }

    if (value.name !== undefined) {
      return getValue(value.name);
    }

    if (value.value !== undefined) {
      return getValue(value.value);
    }

    if (value.text !== undefined) {
      return getValue(value.text);
    }

    if (value.title !== undefined) {
      return getValue(value.title);
    }
  }

  return String(value);
};

// ============================================================
// NORMALISER TEXTE
// ============================================================

const normalizeValue = (value) => {
  return getValue(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

// ============================================================
// PARSER UNE DATE
// ============================================================

const parseDate = (value) => {

  if (!value) {
    return null;
  }

  // Si c'est déjà un objet Date
  if (value instanceof Date) {
    return isNaN(value.getTime())
      ? null
      : value;
  }

  // Si BoardSDK retourne un objet
  if (
    typeof value === 'object'
  ) {

    // Cas possibles
    if (value.date) {
      return parseDate(
        value.date
      );
    }

    if (value.value) {
      return parseDate(
        value.value
      );
    }

    if (value.datetime) {
      return parseDate(
        value.datetime
      );
    }

    if (value.timestamp) {

      const timestamp =
        Number(value.timestamp);

      if (!isNaN(timestamp)) {
        const date =
          new Date(timestamp);

        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  }

  const stringValue =
    getValue(value);

  if (!stringValue) {
    return null;
  }

  // ----------------------------------------------------------
  // CAS NORMAL : ISO / Date JS
  // ----------------------------------------------------------

  let parsed =
    new Date(stringValue);

  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // ----------------------------------------------------------
  // CAS MONDAY :
  //
  // "sept. 19, 5:30 AM"
  // "sept. 19, 7:00 AM"
  //
  // ----------------------------------------------------------

  const monthMap = {
    'jan.': 0,
    'jan': 0,
    'févr.': 1,
    'févr': 1,
    'fév.': 1,
    'fév': 1,
    'mars': 2,
    'avr.': 3,
    'avr': 3,
    'mai': 4,
    'juin': 5,
    'juil.': 6,
    'juil': 6,
    'août': 7,
    'aoû': 7,
    'sept.': 8,
    'sept': 8,
    'oct.': 9,
    'oct': 9,
    'nov.': 10,
    'nov': 10,
    'déc.': 11,
    'déc': 11
  };

  const mondayMatch =
    stringValue.match(
      /^([a-zA-Zéûôîàèù.]+)\s+(\d{1,2}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
    );

  if (mondayMatch) {

    const monthText =
      mondayMatch[1]
        .toLowerCase();

    const day =
      Number(mondayMatch[2]);

    let hour =
      Number(mondayMatch[3]);

    const minute =
      Number(mondayMatch[4]);

    const ampm =
      mondayMatch[5]
        ?.toUpperCase();

    const month =
      monthMap[monthText];

    if (
      month !== undefined
    ) {

      if (ampm === 'PM' && hour < 12) {
        hour += 12;
      }

      if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }

      // Festival 2026
      parsed =
        new Date(
          2026,
          month,
          day,
          hour,
          minute,
          0,
          0
        );

      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  console.warn(
    'DATE IMPOSSIBLE À PARSER :',
    value
  );

  return null;
};

// ============================================================
// OBTENIR LE JOUR DU MOIS À PARTIR DE DÉBUT
// ============================================================
//
// C'EST CETTE FONCTION QUI DÉTERMINE LA JOURNÉE.
//
// Exemple :
// dbut = "sept. 19, 5:30 AM"
// résultat = 19
// ============================================================

const getDayFromStart = (value) => {

  const date =
    parseDate(value);

  if (!date) {
    return null;
  }

  return date.getDate();
};

// ============================================================
// FORMAT HEURE
// ============================================================

const formatTime = (value) => {

  const date =
    parseDate(value);

  if (!date) {
    return null;
  }

  return `${String(
    date.getHours()
  ).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

// ============================================================
// POSITION VERTICALE
// ============================================================

const getTimePosition = (
  timeString
) => {

  if (!timeString) {
    return -1;
  }

  const [
    hours,
    minutes
  ] = timeString
    .split(':')
    .map(Number);

  const startMinutes =
    START_HOUR * 60;

  const currentMinutes =
    hours * 60 + minutes;

  return (
    (currentMinutes -
      startMinutes) /
    SLOT_MINUTES
  );
};

// ============================================================
// DURÉE
// ============================================================

const getDurationInSlots = (
  startTime,
  endTime
) => {

  if (
    !startTime ||
    !endTime
  ) {
    return 1;
  }

  const [
    startH,
    startM
  ] = startTime
    .split(':')
    .map(Number);

  const [
    endH,
    endM
  ] = endTime
    .split(':')
    .map(Number);

  const startMinutes =
    startH * 60 + startM;

  const endMinutes =
    endH * 60 + endM;

  let duration =
    endMinutes -
    startMinutes;

  // Activité qui passe minuit
  if (duration < 0) {
    duration += 24 * 60;
  }

  if (duration <= 0) {
    return 1;
  }

  return (
    duration /
    SLOT_MINUTES
  );
};

// ============================================================
// APPLICATION
// ============================================================

export default function App() {

  const [
    allItems,
    setAllItems
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  // IMPORTANT :
  // On stocke le numéro du jour,
  // pas la valeur du dropdown "Jour".
  const [
    selectedDay,
    setSelectedDay
  ] = useState(18);

  // ==========================================================
  // CHARGER LES DONNÉES
  // ==========================================================

  useEffect(() => {

    const loadData =
      async () => {

        try {

          setLoading(true);
          setError(null);

          const board =
            new BoardSDK();

          // --------------------------------------------------
          // ON RÉCUPÈRE TOUTES LES ACTIVITÉS.
          //
          // "jour" N'EST PAS UTILISÉ.
          // --------------------------------------------------

          const result =
            await board
              .items()
              .withColumns([
                'activit',
                'zone',
                'dbut',
                'fin',
                'catgorieCouleur',
                'affichage'
              ])
              .where({
                dbut: {
                  isEmpty: false
                },
                zone: {
                  isEmpty: false
                }
              })
              .orderBy({
                column: 'dbut',
                direction: 'asc'
              })
              .withPagination({
                limit: 500
              })
              .execute();

          const loadedItems =
            result?.items ?? [];

          console.log(
            '========================================'
          );

          console.log(
            'TOTAL ACTIVITÉS CHARGÉES :',
            loadedItems.length
          );

          // --------------------------------------------------
          // DEBUG TRÈS IMPORTANT
          // --------------------------------------------------

          loadedItems.forEach(
            (item, index) => {

              const date =
                parseDate(
                  item.dbut
                );

              console.log(
                `ACTIVITÉ ${index + 1}`,
                {
                  id: item.id,

                  activite:
                    getValue(
                      item.activit
                    ),

                  debutBrut:
                    item.dbut,

                  debutParse:
                    date,

                  jourCalcule:
                    date
                      ? date.getDate()
                      : null,

                  heure:
                    formatTime(
                      item.dbut
                    ),

                  fin:
                    formatTime(
                      item.fin
                    ),

                  zone:
                    getValue(
                      item.zone
                    ),

                  affichage:
                    getValue(
                      item.affichage
                    )
                }
              );

            }
          );

          setAllItems(
            loadedItems
          );

        } catch (err) {

          console.error(
            'Erreur chargement données :',
            err
          );

          setError(
            err?.message ||
            'Erreur lors du chargement des données.'
          );

        } finally {

          setLoading(false);

        }

      };

    loadData();

  }, []);

  // ==========================================================
  // ACTIVITÉS DE LA JOURNÉE SÉLECTIONNÉE
  // ==========================================================
  //
  // IMPORTANT :
  //
  // IL N'Y A AUCUNE RÉFÉRENCE À item.jour ICI.
  //
  // La journée vient exclusivement de item.dbut.
  // ==========================================================

  const items =
    allItems.filter(
      (item) => {

        const itemDay =
          getDayFromStart(
            item.dbut
          );

        return (
          itemDay ===
          selectedDay
        );

      }
    );

  // ==========================================================
  // DEBUG DU FILTRE
  // ==========================================================

  console.log(
    '========================================'
  );

  console.log(
    'JOUR ACTUEL :',
    selectedDay
  );

  console.log(
    'ACTIVITÉS AFFICHÉES :',
    items.length
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div
        className="
          flex
          items-center
          justify-center
          min-h-screen
        "
      >

        <Loader2
          className="
            w-6
            h-6
            animate-spin
          "
        />

      </div>
    );

  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <div
        className="
          p-6
          text-red-500
        "
      >

        Error: {error}

      </div>
    );

  }

  // ==========================================================
  // COULEURS
  // ==========================================================

  const categoryColorMap = {

    'Synthé':
      '#66ccff',

    'Kiosques':
      '#e484bd',

    'Montage/Démontage':
      '#9cd326',

    'Arrivée/Départ':
      '#00c875',

    'Asphalte':
      '#007eb5',

    'Zone famille':
      '#bda8f9',

    'Scène':
      '#ff5ac4',

    'Tente VIP':
      '#fdab3d'

  };

  const totalHeight =
    TIME_SLOTS.length *
    SLOT_HEIGHT;

  // ==========================================================
  // RENDU
  // ==========================================================

  return (

    <div
      className="
        w-full
        min-h-screen
        bg-background
      "
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="
          sticky
          top-0
          z-30
          bg-background
          border-b
          border-border
        "
      >

        <div className="p-4">

          <h1
            className="
              text-xl
              font-semibold
            "
          >
            Programmation Festival VITA 2026
          </h1>

          <p
            className="
              text-sm
              text-muted-foreground
              mt-1
            "
          >
            {`sept. ${selectedDay}`}
          </p>

          {/* =================================================
              BOUTONS
          ================================================= */}

          <div
            className="
              flex
              gap-2
              mt-3
            "
          >

            {FESTIVAL_DAYS.map(
              (day) => (

                <button
                  key={day.day}
                  onClick={() =>
                    setSelectedDay(
                      day.day
                    )
                  }
                  className={`
                    px-3
                    py-1
                    text-xs
                    font-medium
                    rounded
                    transition-colors
                    ${
                      selectedDay === day.day
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                    }
                  `}
                >

                  {day.label}

                </button>

              )
            )}

          </div>

        </div>

      </div>

      {/* ====================================================
          CALENDRIER
      ==================================================== */}

      <div
        className="
          overflow-auto
        "
      >

        <div
          className="relative"
          style={{
            minWidth:
              TIME_COLUMN_WIDTH +
              ZONES.length *
                ZONE_WIDTH
          }}
        >

          {/* =================================================
              HEADER ZONES
          ================================================= */}

          <div
            className="
              sticky
              top-0
              z-20
              flex
              bg-surface-1
              border-b
              border-border
            "
            style={{
              height: '48px'
            }}
          >

            {/* HEURE */}

            <div
              className="
                flex-shrink-0
                border-r
                border-border
                px-2
                flex
                items-center
              "
              style={{
                width:
                  `${TIME_COLUMN_WIDTH}px`
              }}
            >

              <span
                className="
                  text-xs
                  font-medium
                  text-muted-foreground
                "
              >
                Heure
              </span>

            </div>

            {/* ZONES */}

            {ZONES.map(
              (zone) => (

                <div
                  key={zone.label}
                  className="
                    flex-shrink-0
                    border-r
                    border-border
                    px-2
                    flex
                    items-center
                  "
                  style={{
                    width:
                      `${ZONE_WIDTH}px`
                  }}
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      min-w-0
                    "
                  >

                    <div
                      className="
                        w-2
                        h-2
                        rounded-sm
                        flex-shrink-0
                      "
                      style={{
                        backgroundColor:
                          zone.color
                      }}
                    />

                    <span
                      className="
                        text-xs
                        font-medium
                        truncate
                      "
                    >
                      {zone.label}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

          {/* =================================================
              CORPS
          ================================================= */}

          <div
            className="
              relative
              flex
            "
            style={{
              height:
                `${totalHeight}px`
            }}
          >

            {/* =================================================
                HEURES
            ================================================= */}

            <div
              className="
                flex-shrink-0
                relative
                bg-surface-1
                border-r
                border-border
              "
              style={{
                width:
                  `${TIME_COLUMN_WIDTH}px`,
                height:
                  `${totalHeight}px`
              }}
            >

              {TIME_SLOTS.map(
                (time, index) => (

                  <div
                    key={time}
                    className="
                      absolute
                      left-0
                      right-0
                      border-b
                      border-border
                      px-2
                      text-xs
                      font-mono
                      text-muted-foreground
                      flex
                      items-start
                    "
                    style={{
                      top:
                        `${index * SLOT_HEIGHT}px`,
                      height:
                        `${SLOT_HEIGHT}px`,
                      paddingTop:
                        '4px'
                    }}
                  >

                    {time}

                  </div>

                )
              )}

            </div>

            {/* =================================================
                ZONES
            ================================================= */}

            {ZONES.map(
              (zone) => {

                const zoneItems =
                  items.filter(
                    (item) => {

                      return (
                        normalizeValue(
                          item.zone
                        ) ===
                        normalizeValue(
                          zone.label
                        )
                      );

                    }
                  );

                return (

                  <div
                    key={zone.label}
                    className="
                      flex-shrink-0
                      relative
                      bg-card
                      border-r
                      border-border
                    "
                    style={{
                      width:
                        `${ZONE_WIDTH}px`,
                      height:
                        `${totalHeight}px`
                    }}
                  >

                    {/* =====================================
                        LIGNES
                    ===================================== */}

                    {TIME_SLOTS.map(
                      (time, index) => (

                        <div
                          key={time}
                          className="
                            absolute
                            left-0
                            right-0
                            border-b
                            border-border
                          "
                          style={{
                            top:
                              `${index * SLOT_HEIGHT}px`,
                            height:
                              `${SLOT_HEIGHT}px`
                          }}
                        />

                      )
                    )}

                    {/* =====================================
                        BLOCS
                    ===================================== */}

                    {zoneItems.map(
                      (item, index) => {

                        const startTime =
                          formatTime(
                            item.dbut
                          );

                        const endTime =
                          formatTime(
                            item.fin
                          );

                        if (!startTime) {
                          return null;
                        }

                        const topPosition =
                          getTimePosition(
                            startTime
                          );

                        if (
                          topPosition < 0
                        ) {
                          return null;
                        }

                        const duration =
                          getDurationInSlots(
                            startTime,
                            endTime
                          );

                        const height =
                          duration *
                          SLOT_HEIGHT;

                        const category =
                          getValue(
                            item.catgorieCouleur
                          );

                        const itemColor =
                          categoryColorMap[
                            category
                          ] ||
                          zone.color;

                        const displayText =
                          getValue(
                            item.affichage
                          ) ||
                          getValue(
                            item.activit
                          ) ||
                          '';

                        return (

                          <div
                            key={
                              `${item.id}-${index}`
                            }
                            className="
                              absolute
                              left-0
                              right-0
                              z-10
                              px-1
                              py-1
                            "
                            style={{
                              top:
                                `${topPosition * SLOT_HEIGHT}px`,
                              height:
                                `${height}px`
                            }}
                          >

                            <div
                              className="
                                w-full
                                h-full
                                rounded-sm
                                overflow-hidden
                                px-1.5
                                py-1
                              "
                              style={{
                                backgroundColor:
                                  `${itemColor}20`,
                                borderLeft:
                                  `3px solid ${itemColor}`
                              }}
                            >

                              <div
                                className="
                                  text-xs
                                  font-medium
                                  leading-tight
                                "
                                style={{
                                  overflow:
                                    'hidden',

                                  display:
                                    '-webkit-box',

                                  WebkitLineClamp:
                                    3,

                                  WebkitBoxOrient:
                                    'vertical'
                                }}
                              >

                                {displayText}

                              </div>

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                );

              }
            )}

          </div>

        </div>

      </div>

    </div>

  );
}
