import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "./ui/button";

const events = [
  {
    id: 1,
    title: "TechCrunch Disrupt 2025",
    date: "15-17 ноября 2025",
    location: "Алматы, Казахстан",
    description: "Крупнейшая технологическая конференция региона с участием ведущих стартапов и инвесторов.",
    attendees: 500,
    format: "Офлайн",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    status: "Предстоящее",
  },
  {
    id: 2,
    title: "Startup Weekend Astana",
    date: "22-24 ноября 2025",
    location: "Астана, Казахстан",
    description: "54-часовой марафон для предпринимателей, разработчиков и дизайнеров.",
    attendees: 150,
    format: "Офлайн",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800",
    status: "Предстоящее",
  },
  {
    id: 3,
    title: "AI Conference Central Asia",
    date: "5-7 декабря 2025",
    location: "Онлайн",
    description: "Конференция по искусственному интеллекту с докладами экспертов из разных стран.",
    attendees: 1000,
    format: "Онлайн",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
    status: "Предстоящее",
  },
  {
    id: 4,
    title: "FinTech Innovation Summit",
    date: "12-13 декабря 2025",
    location: "Алматы, Казахстан",
    description: "Саммит посвященный инновациям в финансовых технологиях.",
    attendees: 300,
    format: "Гибрид",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
    status: "Предстоящее",
  },
];

export function EventsPage() {
  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
        <h1 className="mb-2">События</h1>
        <p className="text-muted-foreground">
          Технологические конференции, meetup'ы и мероприятия для предпринимателей
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6">
        {events.map((event) => (
          <article
            key={event.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="md:flex">
              {/* Image */}
              <div className="md:w-64 md:flex-shrink-0">
                <div className="relative aspect-[16/9] md:aspect-auto md:h-full">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <h3 className="mb-3">{event.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {event.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{event.attendees}+ участников</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{event.format}</span>
                  </div>
                </div>

                <Button className="w-full sm:w-auto">Зарегистрироваться</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
