import { Target, Users, Lightbulb, Heart, Mail, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export function AboutPage() {
  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-gray-200 rounded-xl p-8">
        <h1 className="mb-4">О проекте OrientVentus</h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          Новостная платформа для молодых предпринимателей, стартаперов и всех, кто интересуется миром технологий и инноваций
        </p>
      </div>

      {/* Main Content */}
      <article className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div>
            <h3 className="mb-3">Наша история</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              OrientVentus был создан в 2024 году с целью объединить молодых предпринимателей, разработчиков и
              инноваторов Казахстана и Центральной Азии. Мы верим, что доступ к актуальной информации и качественному 
              контенту о технологиях и бизнесе — это ключ к развитию успешной стартап-экосистемы.
            </p>
          </div>

          {/* Image */}
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200"
              alt="Team collaboration"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Mission Section */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h3>Наша миссия</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Мы стремимся создать платформу, где каждый предприниматель и энтузиаст технологий сможет:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Получать актуальную информацию о трендах в технологиях и бизнесе</li>
              <li>Находить вдохновение в историях успеха других предпринимателей</li>
              <li>Узнавать о предстоящих событиях, выставках и конференциях</li>
              <li>Получать доступ к полезным сервисам и услугам для развития бизнеса</li>
              <li>Общаться и обмениваться опытом с единомышленниками</li>
            </ul>
          </div>

          {/* Values Grid */}
          <div>
            <h3 className="mb-4">Наши ценности</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm">Сообщество</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Мы создаем пространство для обмена идеями и опытом между предпринимателями
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <h4 className="text-sm">Инновации</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Мы фокусируемся на передовых технологиях и инновационных решениях
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm">Качество</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Мы публикуем только проверенную информацию и качественный контент
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <h4 className="text-sm">Поддержка</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Мы помогаем стартапам и предпринимателям на пути к успеху
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <h4 className="mb-4 text-center">OrientVentus в цифрах</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl text-blue-600 mb-1">15K+</div>
                <div className="text-xs text-muted-foreground">Читателей</div>
              </div>
              <div className="text-center">
                <div className="text-3xl text-blue-600 mb-1">500+</div>
                <div className="text-xs text-muted-foreground">Статей</div>
              </div>
              <div className="text-center">
                <div className="text-3xl text-purple-600 mb-1">120+</div>
                <div className="text-xs text-muted-foreground">Событий</div>
              </div>
              <div className="text-center">
                <div className="text-3xl text-orange-600 mb-1">50+</div>
                <div className="text-xs text-muted-foreground">Партнеров</div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div>
            <h3 className="mb-3">Команда проекта</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              OrientVentus создается командой энтузиастов, которые верят в силу инноваций и предпринимательства.
              Мы работаем над тем, чтобы каждый материал на нашей платформе был полезным и вдохновляющим.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400"
                  alt="Team work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400"
                  alt="Office"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* What We Cover */}
          <div>
            <h3 className="mb-3">Что мы освещаем</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              На нашей платформе вы найдете актуальные новости и аналитику по следующим направлениям:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Стартапы и предпринимательство</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Искусственный интеллект</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Финансовые технологии</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Блокчейн и криптовалюты</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">EdTech и онлайн-образование</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Экология и зеленые технологии</span>
              </div>
            </div>
          </div>

          {/* Partners Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="mb-3 text-center">Наши партнеры</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Мы сотрудничаем с ведущими технологическими компаниями, инкубаторами и акселераторами
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">MOST Business Incubator</span>
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">Astana Hub</span>
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">IT Park</span>
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">Qaztech Ventures</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="mb-3">Связаться</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Хотите поделиться своей историей или рассказать о своем проекте? Свяжитесь с автором!
            </p>
            <Button className="gap-2">
              <Mail className="w-4 h-4" />
              Связаться с автором
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
