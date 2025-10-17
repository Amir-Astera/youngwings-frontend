import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

const upcomingEvents = [
  {
    id: 1,
    title: "Tech Meetup: Облачные технологии",
    date: "25 октября 2025",
    time: "18:00",
    location: "Online",
    description: "Обсуждение современных облачных решений и их применения в бизнесе",
    status: "upcoming"
  },
  {
    id: 2,
    title: "Workshop: React и Next.js",
    date: "30 октября 2025",
    time: "19:00",
    location: "DevSpace Almaty",
    description: "Практический воркшоп по разработке современных веб-приложений",
    status: "upcoming"
  },
  {
    id: 3,
    title: "Networking: IT Community",
    date: "5 ноября 2025",
    time: "18:30",
    location: "CoWork Astana",
    description: "Нетворкинг для IT-специалистов и предпринимателей",
    status: "upcoming"
  },
  {
    id: 4,
    title: "AI Hackathon 2025",
    date: "10 ноября 2025",
    time: "10:00",
    location: "IT Park, Астана",
    description: "48-часовой хакатон по разработке AI-решений",
    status: "upcoming"
  },
  {
    id: 5,
    title: "Blockchain Conference",
    date: "15 ноября 2025",
    time: "09:00",
    location: "Rixos Almaty",
    description: "Международная конференция по блокчейн технологиям",
    status: "upcoming"
  },
];

interface UpcomingEventsPageProps {
  onPageChange: (page: string) => void;
}

export function UpcomingEventsPage({ onPageChange }: UpcomingEventsPageProps) {
  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
        <h1 className="mb-2">Ближайшие события</h1>
        <p className="text-muted-foreground">
          Актуальные митапы, воркшопы и нетворкинг мероприятия
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-5">
        {upcomingEvents.map((event) => (
          <article
            key={event.id}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="mb-2">{event.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {event.description}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{event.location}</span>
              </div>
            </div>

            <Button size="sm" className="gap-2">
              Зарегистрироваться
              <ChevronRight className="w-4 h-4" />
            </Button>
          </article>
        ))}
      </div>

      {/* Link to All Events */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
        <h3 className="mb-3">Смотрите все крупные выставки и события</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Технологические конференции, саммиты и международные выставки
        </p>
        <Button onClick={() => onPageChange("exhibitions")} className="gap-2">
          Все события
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
