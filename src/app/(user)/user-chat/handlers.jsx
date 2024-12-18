
export async function handleAssistantClick(assistantRequests, setLoading, t) {
  if (assistantRequests > 0) {
    setLoading(true); 
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;
        console.log('Текущий userId:', currentUserId);
        if (!currentUserId) {
          throw new Error(t('errorNoUserId'));
        }

        const response = await fetch('/api/request-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUserId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('errorServerRoute'));
        }

        const data = await response.json();
        console.log('Ответ от сервера:', data);
        window.Telegram.WebApp.close();
      } catch (error) {
        console.error('Ошибка:', error);
        if (error instanceof Error) {
          alert(t('errorOccurred') + error.message);
        } else {
          alert(t('unknownError'));
        }
        setLoading(false); 
      }
    } else {
      alert(t('onlyInApp'));
      setLoading(false);
    }
  }
}

export async function handleAIClick(aiRequests, setLoading, t) {
  if (aiRequests > 0) {
    setLoading(true); 
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;
        console.log('Текущий userId:', currentUserId);
        if (!currentUserId) {
          throw new Error(t('errorNoUserId'));
        }

        const response = await fetch('/api/initiate-ai-dialog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUserId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('errorServerRoute'));
        }

        const data = await response.json();
        console.log('Ответ от сервера:', data);
        window.Telegram.WebApp.close();
      } catch (error) {
        console.error('Ошибка:', error);
        if (error instanceof Error) {
          alert(t('errorOccurred') + error.message);
        } else {
          alert(t('unknownError'));
        }
        setLoading(false); 
      }
    } else {
      alert(t('onlyInApp'));
      setLoading(false);
    }
  }
}
