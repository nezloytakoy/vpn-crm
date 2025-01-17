export const translations = {
    en: {
        userIdRequired: 'UserId is required',
        userNotFound: 'User not found',
        requestReceived: 'Your request has been received. Please wait while an assistant contacts you.',
        noAssistantsAvailable: 'No assistants available',
        requestSent: 'The request has been sent to the assistant.',
        notEnoughRequests: 'You do not have enough requests to contact an assistant.',
        serverError: 'Server Error',
        assistantRequestMessage: 'User request for conversation',
        accept: 'Accept',
        reject: 'Reject',
        logMessage: 'userIdBigInt before creating AssistantRequest',
        enterSubject: 'Please enter the subject of your request.',
        existingActiveRequest: 'You already have an active request to an assistant.',
        noActiveRequest: 'You have no active assistant requests.',
        waitingForSubject: 'We are waiting for you to provide the subject of your request.',
        userIsBlocked: 'You are blocked.',
        topic: 'Topic',
        no_subject: 'No subject',
        assistant_declined_extension: 'The assistant declined the extension.',
        assistant_joined_chat: 'The assistant joined the chat.',
        extend_session_new_request: 'Extend session with a new request.',
        request_subject: 'Request subject',
        request_subject_from_user: 'Request subject from user',
        // Новые ключи:
        no_username: 'No username',
        new_request_from_user: 'New request from user',
    },
    ru: {
        userIdRequired: 'Требуется UserId',
        userNotFound: 'Пользователь не найден',
        requestReceived: 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.',
        noAssistantsAvailable: 'Нет доступных ассистентов',
        requestSent: 'Запрос отправлен ассистенту.',
        notEnoughRequests: 'У вас недостаточно запросов для общения с ассистентом.',
        serverError: 'Ошибка сервера',
        assistantRequestMessage: 'Запрос пользователя на разговор',
        accept: 'Принять',
        reject: 'Отклонить',
        logMessage: 'userIdBigInt перед созданием AssistantRequest',
        enterSubject: 'Пожалуйста, введите тему вашего запроса.',
        existingActiveRequest: 'У вас уже есть открытый запрос к ассистенту.',
        noActiveRequest: 'У вас нет активных запросов к ассистенту.',
        waitingForSubject: 'Мы ожидаем от вас ввода темы запроса.',
        userIsBlocked: 'Вы заблокированы.',
        topic: 'Тема',
        no_subject: 'Нет темы',
        assistant_declined_extension: 'Ассистент отклонил продление.',
        assistant_joined_chat: 'Ассистент присоединился к чату.',
        extend_session_new_request: 'Продлить сессию с новым запросом.',
        request_subject: 'Тема запроса',
        request_subject_from_user: 'Тема запроса от пользователя',
        // Новые ключи:
        no_username: 'без имени',
        new_request_from_user: 'Новый запрос от пользователя',
    },
};




// Функция получения перевода
export function getTranslation(
    lang: 'en' | 'ru',
    key: keyof typeof translations['en']
) {
    return translations[lang][key] || translations['en'][key];
}

// Функция для определения языка пользователя
export function detectLanguage(): 'en' | 'ru' {
    // Здесь можно добавить логику определения языка
    return 'ru';
}
