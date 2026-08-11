```jsx
import React, { useMemo, useState } from "react";

const zones = [
  "Terrain synthétique",
  "Asphalte",
  "Zone démo",
  "Zone Famille",
  "Kiosques",
  "Scène",
  "Tente VIP",
];

const zoneColors = {
  "Terrain synthétique": "#00c875",
  Asphalte: "#df2f4a",
  "Zone démo": "#007eb5",
  "Zone Famille": "#9d50dd",
  Kiosques: "#fdab3d",
  Scène: "#8580d9",
  "Tente VIP": "#7f7f86",
};

const activities = [
  {
    id: 1,
    name: "Activité sportive",
    zone: "Terrain synthétique",
    start: "09:00",
    end: "10:00",
    day: "Vendredi",
    volet: "BOUGER",
  },
  {
    id: 2,
    name: "Démonstration",
    zone: "Zone démo",
    start: "10:00",
    end: "11:30",
    day: "Vendredi",
    volet: "BOUGER",
  },
  {
    id: 3,
    name: "Animation famille",
    zone: "Zone Famille",
    start: "11:00",
    end: "12:00",
    day: "Vendredi",
    volet: "BOUGER",
  },
  {
    id: 4,
    name: "Kiosques partenaires",
    zone: "Kiosques",
    start: "09:00",
    end: "17:00",
    day: "Vendredi",
    volet: "S'INSPIRER",
  },
];

const timeSlots = [
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

function App() {
  const [selectedDay, setSelectedDay] = useState("Vendredi");
  const [selectedVolet, setSelectedVolet] = useState("Tous");

  const filteredActivities = useMemo(() => {
    return activities.filter(function (activity) {
      return (
        activity.day === selectedDay &&
        (selectedVolet === "Tous" ||
          activity.volet === selectedVolet)
      );
    });
  }, [selectedDay, selectedVolet]);

  return (
    <div className="min-h-screen bg-[#151619] text-[#ebebed]">

      <header className="border-b border-[#303137] bg-[#1b1c20] px-6 py-5">
        <div className="mx-auto max-w-[1800px]">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-sm font-medium text-[#8580d9]">
                FESTIVAL VITA 2026
              </p>

              <h1 className="mt-1 text-2xl font-semibold">
                Programmation
              </h1>
            </div>

            <div className="flex items-center gap-2">

              {["Vendredi", "Samedi"].map(function (day) {
                return (
                  <button
                    key={day}
                    onClick={function () {
                      setSelectedDay(day);
                    }}
                    className={
                      "rounded-md px-4 py-2 text-sm font-medium transition " +
                      (selectedDay === day
                        ? "bg-[#8580d9] text-[#151619]"
                        : "bg-[#303137] text-[#ebebed] hover:bg-[#3c3d43]")
                    }
                  >
                    {day}
                  </button>
                );
              })}

              <select
                value={selectedVolet}
                onChange={function (event) {
                  setSelectedVolet(event.target.value);
                }}
                className="rounded-md border border-[#3c3d43] bg-[#1b1c20] px-3 py-2 text-sm"
              >
                <option value="Tous">Tous</option>
                <option value="BOUGER">BOUGER</option>
                <option value="FÊTER">FÊTER</option>
                <option value="S'INSPIRER">S'INSPIRER</option>
              </select>

            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] overflow-x-auto p-6">

        <div
          className="grid min-w-[1300px]"
          style={{
            gridTemplateColumns:
              "90px repeat(7, minmax(160px, 1fr))",
          }}
        >

          <div className="border-b border-r border-[#303137] bg-[#151619]" />

          {zones.map(function (zone) {
            return (
              <div
                key={zone}
                className="border-b border-r border-[#303137] bg-[#1b1c20] px-3 py-4 text-center text-sm font-semibold"
              >
                <div
                  className="mx-auto mb-2 h-1 w-8 rounded-full"
                  style={{
                    backgroundColor: zoneColors[zone],
                  }}
                />

                {zone}
              </div>
            );
          })}

          {timeSlots.map(function (time) {
            return (
              <React.Fragment key={time}>

                <div className="border-b border-r border-[#303137] bg-[#151619] px-2 py-3 text-right text-xs text-[#a1a1a8]">
                  {time}
                </div>

                {zones.map(function (zone) {

                  const matchingActivities =
                    filteredActivities.filter(function (activity) {
                      return (
                        activity.zone === zone &&
                        activity.start <= time &&
                        activity.end > time
                      );
                    });

                  return (
                    <div
                      key={time + "-" + zone}
                      className="relative min-h-[52px] border-b border-r border-[#303137] bg-[#151619]"
                    >

                      {matchingActivities.map(function (activity) {
                        return (
                          <div
                            key={activity.id}
                            className="absolute inset-x-1 top-1 z-10 rounded-md p-2 text-xs shadow-lg"
                            style={{
                              backgroundColor:
                                zoneColors[activity.zone],
                              color: "#151619",
                            }}
                          >

                            <div className="font-semibold">
                              {activity.name}
                            </div>

                            <div className="mt-1 opacity-80">
                              {activity.start} – {activity.end}
                            </div>

                          </div>
                        );
                      })}

                    </div>
                  );
                })}

              </React.Fragment>
            );
          })}

        </div>
      </main>

      <footer className="border-t border-[#303137] px-6 py-4 text-center text-xs text-[#a1a1a8]">
        Programmation VITA 2026
      </footer>

    </div>
  );
}

export default App;
```
