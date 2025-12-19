export function createTestTournamentState() {
    return {
      tables: [
        { id: "t1", name: "Table 1" },
        { id: "t2", name: "Table 2" },
        { id: "t3", name: "Finals Table" }
      ],
  
      queue: [
        // 176 RH
        {
          id: "m001",
          weightClass: "176",
          division: "RH",
          round: "Round of 16",
          bestOf: 1,
          athletes: { a: "Kyler Loucks", b: "Brandon Miller" },
          scheduledTableId: "t1"
        },
        {
          id: "m002",
          weightClass: "176",
          division: "RH",
          round: "Round of 16",
          bestOf: 1,
          athletes: { a: "Eli Sanders", b: "Noah Turner" },
          scheduledTableId: "t2"
        },
  
        // 198 LH
        {
          id: "m003",
          weightClass: "198",
          division: "LH",
          round: "Round of 16",
          bestOf: 1,
          athletes: { a: "Sam Perez", b: "Diego Ramirez" }
        },
        {
          id: "m004",
          weightClass: "198",
          division: "LH",
          round: "Round of 16",
          bestOf: 1,
          athletes: { a: "Jared King", b: "Miles Vance" }
        },
  
        // 220 RH
        {
          id: "m005",
          weightClass: "220",
          division: "RH",
          round: "Quarterfinal",
          bestOf: 1,
          athletes: { a: "Alex Johnson", b: "Cole Wright" }
        },
  
        // Heavyweight finals (best of 3)
        {
          id: "m006",
          weightClass: "242+",
          division: "RH",
          round: "Final",
          bestOf: 3,
          athletes: { a: "Mark Davis", b: "Tyler Brooks" },
          scheduledTableId: "t3"
        }
      ],
  
      currentByTable: {
        t1: {
          matchId: "live001",
          startedAtMs: Date.now() - 45_000, // started 45s ago
          match: {
            id: "live001",
            weightClass: "154",
            division: "RH",
            round: "Round of 16",
            bestOf: 1,
            athletes: { a: "Chris Nolan", b: "Ben Carter" }
          }
        },
  
        t2: null,
  
        t3: {
          matchId: "live002",
          startedAtMs: Date.now() - 110_000, // started 1m50s ago
          match: {
            id: "live002",
            weightClass: "242+",
            division: "LH",
            round: "Semifinal",
            bestOf: 3,
            athletes: { a: "Victor Hayes", b: "Roman Steele" }
          }
        }
      },
  
      history: [
        {
          matchId: "h001",
          tableId: "t1",
          weightClass: "154",
          durationSeconds: 62,
          endedAtMs: Date.now() - 6 * 60_000
        },
        {
          matchId: "h002",
          tableId: "t2",
          weightClass: "154",
          durationSeconds: 71,
          endedAtMs: Date.now() - 5 * 60_000
        },
        {
          matchId: "h003",
          tableId: "t1",
          weightClass: "176",
          durationSeconds: 83,
          endedAtMs: Date.now() - 4 * 60_000
        },
        {
          matchId: "h004",
          tableId: "t3",
          weightClass: "242+",
          durationSeconds: 142,
          endedAtMs: Date.now() - 2 * 60_000
        }
      ]
    };
  }
  