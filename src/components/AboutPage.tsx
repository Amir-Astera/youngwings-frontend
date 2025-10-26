export function AboutPage() {
  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-gray-200 rounded-xl p-8">
        <h1 className="mb-4">О проекте YoungWinds</h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          YoungWinds — независимая медиа-платформа, посвящённая бизнесу, стартапам и инновациям в Китае.
        </p>
      </div>

      {/* Main Content */}
      <article className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">🌏 Миссия</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              YoungWinds — независимая медиа-платформа, посвящённая бизнесу, стартапам и инновациям в Китае. Наша миссия
              — вдохновлять и обучать предпринимателей из стран СНГ, помогая им понять, как устроен китайский рынок, и
              использовать этот опыт для развития собственного бизнеса.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Мы верим, что знание — это мост между странами, а понимание Китая делает наши проекты сильнее,
              конкурентоспособнее и ближе к мировым стандартам.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">💡 Что мы делаем</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Мы публикуем аналитические материалы, обзоры и вдохновляющие истории о китайских компаниях, стартапах и
              тенденциях. Через контент и исследования мы показываем, как развивается Китай — от технологий и дизайна до
              потребительских привычек и бизнес-культуры.
            </p>
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                На платформе YoungWinds вы найдёте:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>обзоры китайских брендов и новых проектов;</li>
                <li>разборы рыночных тенденций и бизнес-кейсов;</li>
                <li>статьи о деловой культуре, коммуникации и работе с китайскими партнёрами;</li>
                <li>вдохновляющие примеры, как идеи из Китая можно адаптировать в СНГ.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">🎯 Для кого</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Наш проект создан для:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>предпринимателей и стартаперов из стран СНГ,</li>
              <li>студентов и исследователей, интересующихся Китаем,</li>
              <li>специалистов, которые хотят выстраивать деловые отношения с китайскими партнёрами,</li>
              <li>всех, кто вдохновляется идеями Востока и хочет понимать, как Китай двигает глобальные тренды.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">🐉 Почему Китай</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Китай — одна из самых динамичных экономик мира, где ежедневно рождаются новые идеи, бренды и бизнес-модели.
              Изучая Китай, мы открываем не только крупнейший рынок, но и философию подхода к делу: дисциплину, уважение,
              скорость и постоянное развитие.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              YoungWinds помогает увидеть Китай изнутри — не как далёкую страну, а как источник опыта, вдохновения и
              партнёрства для новых поколений предпринимателей СНГ.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
