import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="mb-4">Отправить сообщение</h2>
          <form className="space-y-4">
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
            <Button className="w-full gap-2">
              <Send className="w-4 h-4" />
              Отправить сообщение
            </Button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          {/* Contact Cards */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="mb-4">Контактная информация</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm mb-1">Email</p>
                  <a href="mailto:info@youngwings.kz" className="text-sm text-blue-600 hover:underline">
                    info@youngwings.kz
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
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm mb-1">Адрес</p>
                  <p className="text-sm text-gray-600">
                    г. Астана, пр. Мангилик Ел, 55/20<br />
                    Бизнес-центр "Astana Hub"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm mb-1">Telegram</p>
                  <a href="https://t.me/youngwings_kz" className="text-sm text-orange-600 hover:underline">
                    @youngwings_kz
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="mb-3">Время работы</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Понедельник - Пятница</span>
                <span>09:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Суббота</span>
                <span>10:00 - 15:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Воскресенье</span>
                <span className="text-gray-500">Выходной</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
            <h3 className="mb-3">Часто задаваемые вопросы</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm mb-1">Как стать автором?</p>
                <p className="text-xs text-gray-600">
                  Отправьте заявку на info@youngwings.kz с примерами ваших работ
                </p>
              </div>
              <div>
                <p className="text-sm mb-1">Размещение рекламы</p>
                <p className="text-xs text-gray-600">
                  Свяжитесь с нами по email для обсуждения рекламных возможностей
                </p>
              </div>
              <div>
                <p className="text-sm mb-1">Сотрудничество</p>
                <p className="text-xs text-gray-600">
                  Мы открыты к партнерству с компаниями и организациями
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
