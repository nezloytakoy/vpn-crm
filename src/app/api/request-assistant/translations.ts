// translations.ts

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
