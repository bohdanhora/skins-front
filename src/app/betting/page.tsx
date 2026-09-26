'use client';

import { Loader2, SearchX, Swords } from 'lucide-react';

import { EventStrip } from '@/components/betting/event-strip';
import { MatchCard } from '@/components/betting/match-card';
import { EmptyState } from '@/components/states/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useBettingMatches } from '@/lib/api/queries';
import { plural } from '@/lib/format/time';

const BettingPage = () => {
  const overview = useBettingMatches();
  const data = overview.data;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Ставки</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Ближайшие матчи крупных турниров с командами из топ-30 рейтинга Valve. Прогноз строится по
          картам: кто что пикнет, кто сильнее на каждой карте и с каким счётом закончится матч.
          Выгода считается по лучшему коэффициенту среди букмекеров.
        </p>
        {data ? (
          <p className="text-foreground-subtle flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>
              {data.mapsKnown} {plural(data.mapsKnown, ['карта', 'карты', 'карт'])} с крупных
              турниров в истории
            </span>
            {data.mapPool.length > 0 ? <span>Пул: {data.mapPool.join(', ')}</span> : null}
            {data.standingsDate ? <span>Рейтинг Valve от {data.standingsDate}</span> : null}
            {data.sync.running ? (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Загружаем историю: {data.sync.pagesDone} из {data.sync.pagesQueued} турниров
              </span>
            ) : null}
          </p>
        ) : null}
      </section>

      {data ? <EventStrip events={data.events} /> : null}

      {overview.isError && !data ? (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title="Не получилось загрузить матчи"
          description={overview.error.message}
        />
      ) : !data ? (
        <div className="space-y-3">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      ) : data.matches.length === 0 ? (
        <EmptyState
          icon={<Swords className="size-6" aria-hidden />}
          title="Крупных матчей пока нет"
          description={
            data.sources.schedule
              ? 'Матчи появятся здесь, когда в турнирах расставят соперников.'
              : 'Не задан ключ расписания матчей на сервере.'
          }
        />
      ) : (
        <div className="space-y-3">
          {data.matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BettingPage;
