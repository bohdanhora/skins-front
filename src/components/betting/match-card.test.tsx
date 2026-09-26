import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BetMatch, BetOffer } from '@/lib/api/types';

import { MatchCard, offerLabel } from './match-card';

const offer = (extra: Partial<BetOffer>): BetOffer => ({
  kind: 'winner',
  line: 0,
  mapIndex: null,
  side: 1,
  model: 0.6,
  market: 0.55,
  chance: 0.575,
  odds: 1.95,
  bookmaker: 'pinnacle',
  bookmakers: 40,
  expectedValue: 0.121,
  stake: 0.032,
  ...extra,
});

const team = (name: string, rank: number) => ({
  name,
  image: null,
  rank,
  points: 1800,
  roster: [],
  mapGames: 60,
  habits: [
    { map: 'Nuke', share: 0.31, permaban: false },
    { map: 'Mirage', share: 0.22, permaban: false },
    { map: 'Anubis', share: 0, permaban: true },
  ],
});

const match: BetMatch = {
  id: 1,
  startsAt: '2026-10-03T12:00:00Z',
  live: false,
  bestOf: 3,
  event: 'ESL Pro League',
  stage: 'Group Stage',
  team1: team('Vitality', 5),
  team2: team('Spirit', 1),
  win: 0.58,
  scores: [
    { first: 2, second: 0, chance: 0.34 },
    { first: 2, second: 1, chance: 0.24 },
    { first: 1, second: 2, chance: 0.22 },
    { first: 0, second: 2, chance: 0.2 },
  ],
  maps: [
    {
      map: 'Nuke',
      pickedBy: 2,
      chance: 0.45,
      team1: { offset: 0, games: 10, wins: 6 },
      team2: null,
    },
    { map: 'Inferno', pickedBy: 1, chance: 0.66, team1: null, team2: null },
    { map: 'Dust2', pickedBy: null, chance: 0.55, team1: null, team2: null },
  ],
  vetoes: [],
  markets: [offer({}), offer({ kind: 'handicap', line: 1.5, side: 2, expectedValue: -0.04 })],
  bestBet: offer({}),
  oddsFound: true,
  confidence: 'high',
};

describe('MatchCard', () => {
  it('names every kind of bet', () => {
    expect(offerLabel(offer({}), match)).toBe('Победа Vitality');
    expect(offerLabel(offer({ kind: 'handicap', line: 1.5, side: 2 }), match)).toBe(
      'Spirit −1,5 по картам',
    );
    expect(offerLabel(offer({ kind: 'map', mapIndex: 2, side: 2 }), match)).toBe(
      'Spirit берёт карту 2 (Inferno)',
    );
    expect(offerLabel(offer({ kind: 'total', line: 2.5, side: 1 }), match)).toBe('Больше 2,5 карт');
  });

  it('shows the forecast and the best bet', () => {
    render(<MatchCard match={match} />);

    expect(screen.getByText('Победа Vitality за 1,95 на pinnacle')).toBeInTheDocument();
    expect(screen.getByText('пик Spirit', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('6–4')).toBeInTheDocument();
    expect(screen.getAllByText('не играет Anubis', { exact: false })).toHaveLength(2);

    fireEvent.click(screen.getByText('Все ставки (2)'));
    expect(screen.getByText('Spirit −1,5 по картам')).toBeInTheDocument();
  });
});
