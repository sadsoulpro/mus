import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Sidebar from "@/components/Sidebar";

const faqData = [
  {
    category: "Общие вопросы",
    subtitle: "Для новичков",
    items: [
      {
        question: "Что такое mytrack.cc?",
        answer: "Это инструмент для артистов, который объединяет все ссылки на стриминговые платформы (Spotify, Apple Music, VK Музыка и др.) на одной красивой странице."
      },
      {
        question: "Это бесплатно?",
        answer: "Основной функционал создания страниц доступен бесплатно."
      }
    ]
  },
  {
    category: "Технические вопросы",
    subtitle: "Процесс",
    items: [
      {
        question: "Как добавить свой трек?",
        answer: "Просто вставьте ссылку на ваш релиз из любого стриминга (например, Spotify или Apple Music) в поле поиска, и наш сервис автоматически подтянет ссылки на другие площадки."
      },
      {
        question: "Могу ли я изменить оформление?",
        answer: "Да, вы можете загрузить свою обложку и настроить порядок отображения кнопок платформ."
      },
      {
        question: 'Что такое "Вид ссылки"?',
        answer: "Это уникальное имя вашей страницы в адресной строке. Например: mytrack.cc/mysong, слово mysong — это и есть вид ссылки."
      }
    ]
  },
  {
    category: "Аналитика и продвижение",
    subtitle: "Статистика",
    items: [
      {
        question: "Где я могу увидеть количество просмотров?",
        answer: "Статистика просмотров отображается в вашем личном кабинете во вкладке Аналитика."
      },
      {
        question: "Зачем нужен QR-код?",
        answer: "Мы автоматически создаем QR-код для каждой страницы. Вы можете скачать его и разместить на афишах или в соцсетях, чтобы фанаты могли перейти к прослушиванию за одно сканирование."
      }
    ]
  },
  {
    category: "Решение проблем",
    subtitle: "Помощь",
    items: [
      {
        question: "Сервис не нашел мой трек автоматически, что делать?",
        answer: "Если автопоиск не сработал (например, если релиз только что вышел), вы можете добавить ссылки на площадки вручную в редакторе страницы."
      },
      {
        question: "Как удалить страницу?",
        answer: "В личном кабинете нажмите на иконку корзины рядом с нужным релизом. Внимание: это действие необратимо."
      }
    ]
  }
];

export default function FAQ() {
  return (
    <Sidebar>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-10">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display">FAQ</h1>
              <p className="text-sm text-muted-foreground">Часто задаваемые вопросы</p>
            </div>
          </div>
        </div>
        
        {/* FAQ Categories */}
        <div className="space-y-6 sm:space-y-8">
          {faqData.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="p-4 sm:p-6 rounded-2xl bg-zinc-900/50 border border-white/5"
            >
              {/* Category Header */}
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-semibold">{category.category}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{category.subtitle}</p>
              </div>
              
              {/* Accordion */}
              <Accordion type="single" collapsible className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <AccordionItem 
                    key={itemIndex} 
                    value={`${categoryIndex}-${itemIndex}`}
                    className="border border-white/5 rounded-xl px-4 bg-zinc-800/30 data-[state=open]:bg-zinc-800/50"
                  >
                    <AccordionTrigger className="text-sm sm:text-base text-left hover:no-underline py-3 sm:py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
        
        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center"
        >
          <p className="text-sm sm:text-base text-muted-foreground">
            Не нашли ответ на свой вопрос?
          </p>
          <p className="text-sm text-primary mt-1">
            Напишите нам на support@mytrack.cc
          </p>
        </motion.div>
      </div>
    </Sidebar>
  );
}
