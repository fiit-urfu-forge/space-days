from datetime import timedelta, datetime

from .repository import Repository, get_event_from_ticket_id, user_came, get_events_from_phone
import telebot
from .config import BOT_TOKEN

bot = telebot.TeleBot(BOT_TOKEN)

repository = Repository()
repository.connect()


def refactor_phone(phone: str) -> str | None:
    correct_phone = ''
    for char in phone:
        if char.isdigit():
            correct_phone += char
    if len(correct_phone) == 10:
        return correct_phone
    if len(correct_phone) == 11 and correct_phone[0] in '78':
        return correct_phone[1:]


def send_event(event, ticket_id, chat_id):
    start_time = datetime(1970, 1, 1) + timedelta(seconds=int(event.start_time))
    keyboard = telebot.types.InlineKeyboardMarkup(row_width=2)
    buttonYes = telebot.types.InlineKeyboardButton(text='Пользователь пришел ✅', callback_data=f'save:{ticket_id}')
    buttonNo = telebot.types.InlineKeyboardButton(text='Отмена', callback_data=f'cancel')
    keyboard.add(buttonYes, buttonNo)
    message_event = f"Имя: {event.first_name}\nМероприятие: {event.title}\nВремя начала: {start_time}\nКоличество мест: {event.amount}\nНомер билета: {ticket_id}"
    bot.send_message(chat_id, message_event, reply_markup=keyboard)


@bot.message_handler(commands=['ticket'])
def get_ticket(message):
    if len(message.text.split()) == 2 and message.text.split()[1].is_digit():
        ticket_id = message.text.split()[1]
        event = get_event_from_ticket_id(repository, int(ticket_id))
        if not event:
            bot.send_message(message.chat.id, "Номер билета некорректный")
            return
        event = event[0]
        send_event(event, ticket_id, message.chat.id)
    else:
        bot.send_message(message.chat.id, "Введите номер билета в формат /ticket 123456789")


@bot.message_handler(commands=['phone'])
def get_tickets(message):
    if len(message.text.split()) == 2:
        phone = refactor_phone(message.text.split()[1])
        if not phone:
            bot.send_message(message.chat.id, "Некорректный номер телефона")
            return

        events = get_events_from_phone(repository, phone)

        if len(events) == 0:
            bot.send_message(message.chat.id, "Телефон не найден")
            return
        for event in events:
            send_event(event, event.ticket_id, message.chat.id)
    else:
        bot.send_message(message.chat.id, "Введите номер телефона в формате /phone 89999999999")


@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.data.startswith("save"):
        user_came(repository, int(call.data.split(':')[1]))
        bot.answer_callback_query(callback_query_id=call.id, text="Данные пользователя успешно обновлены!")

    elif call.data == "cancel":
        bot.answer_callback_query(callback_query_id=call.id, text="Действие отменено")
    bot.delete_message(call.message.chat.id, call.message.id)


@bot.message_handler(func=lambda message: True)
def echo_message(message):
    phone = refactor_phone(message.text)
    if phone:
        events = get_events_from_phone(repository, phone)
        if len(events) > 0:
            for event in events:
                print(event)
                send_event(event, event.ticket_id, message.chat.id)
            return
    if len(message.text) == 9 and message.text.isdigit():
        ticket_id = int(message.text)
        event = get_event_from_ticket_id(repository, ticket_id)
        if event:
            send_event(event[0], ticket_id, message.chat.id)
            return
    bot.send_message(message.chat.id, "Воспользуйтесь командами /ticket /phone для поиска билетов")
