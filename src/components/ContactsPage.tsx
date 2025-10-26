import {
  Mail,
  Phone,
  Send,
  MessageSquare,
  Instagram,
  Music4,
  AtSign,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export function ContactsPage() {
  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      {/* Header */}
      <div>
        <h1 className="mb-2">Свяжитесь с нами</h1>
        <p className="text-muted-foreground">
          Мы всегда рады ответить на ваши вопросы и выслушать предложения
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
          <h2 className="mb-4">Отправить сообщение</h2>
          <form className="flex flex-col gap-4 h-full">
            <div>
              <label className="text-sm mb-2 block text-gray-700">Ваше имя</label>
              <Input placeholder="Иван Иванов" />
            </div>
            <div>
              <label className="text-sm mb-2 block text-gray-700">Email</label>
              <Input type="email" placeholder="example@email.com" />
            </div>
            <div>
              <label className="text-sm mb-2 block text-gray-700">Тема сообщения</label>
              <Input placeholder="Вопрос по сотрудничеству" />
            </div>
            <div>
              <label className="text-sm mb-2 block text-gray-700">Сообщение</label>
              <Textarea
                placeholder="Расскажите подробнее о вашем вопросе..."
                rows={5}
              />
            </div>
            <Button className="w-full gap-2 mt-auto">
              <Send className="w-4 h-4" />
              Отправить сообщение
            </Button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Contact Cards */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
            <h2 className="mb-4">Контактная информация</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm mb-1">Email</p>
                  <a href="mailto:info@orientventus.kz" className="text-sm text-blue-600 hover:underline">
                    info@orientventus.kz
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm mb-1">Телефон</p>
                  <a href="tel:+77172000000" className="text-sm text-blue-600 hover:underline">
                    +7 (717) 200-00-00
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm mb-1">Telegram</p>
                  <a href="https://t.me/orientventus_kz" className="text-sm text-orange-600 hover:underline">
                    @orientventus_kz
                  </a>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-8">
              <a
                href="https://www.tiktok.com/@youngwinds"
                className="flex items-center gap-3 rounded-xl p-4 text-white shadow-sm transition-transform transform hover:-translate-y-1 bg-blue-600 from-purple-600 via-fuchsia-500 to-pink-500"
                target="_blank"
                rel="noreferrer"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
                  <Music4 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">TikTok</p>
                  <p className="text-sm opacity-90">@youngwinds</p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/youngwinds"
                className="flex items-center gap-3 rounded-xl p-4 text-white shadow-sm transition-transform transform hover:-translate-y-1 bg-blue-600 from-pink-500 via-rose-500 to-orange-400"
                target="_blank"
                rel="noreferrer"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Instagram</p>
                  <p className="text-sm opacity-90">@youngwinds</p>
                </div>
              </a>

              <a
                href="https://www.threads.net/@youngwinds"
                className="flex items-center gap-3 rounded-xl p-4 text-white shadow-sm transition-transform transform hover:-translate-y-1 bg-blue-600 from-gray-900 via-gray-800 to-gray-700"
                target="_blank"
                rel="noreferrer"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
                  <AtSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Threads</p>
                  <p className="text-sm opacity-90">@youngwinds</p>
                </div>
              </a>

              <a
                href="https://t.me/orientventus_kz"
                className="flex items-center gap-3 rounded-xl p-4 text-white shadow-sm transition-transform transform hover:-translate-y-1 bg-blue-600 from-sky-500 via-blue-500 to-indigo-500"
                target="_blank"
                rel="noreferrer"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Telegram</p>
                  <p className="text-sm opacity-90">@orientventus_kz</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
